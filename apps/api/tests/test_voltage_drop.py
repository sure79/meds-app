"""Tests for voltage drop calculation engine."""
import sys
import os
import math
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from apps.api.models.equipment import Load
from apps.api.engines.voltage_drop_engine import calculate_voltage_drop, auto_size_cable, load_cable_database, CLASS_LIMITS


def _make_load(id="load1", name="Pump 1", type="pump", kw=50, bus_id="bus1",
               cable_length=30, cable_type="TPYC", cable_size=None,
               start_method="DOL", start_multiplier=6.0, pf=0.85, eff=0.9):
    return Load(id=id, name=name, type=type, rated_power_kw=kw, bus_id=bus_id,
                cable_length=cable_length, cable_type=cable_type, cable_size=cable_size,
                start_method=start_method, starting_current_multiplier=start_multiplier,
                power_factor=pf, efficiency=eff, load_factors={})


class TestKnownVoltageDropCalculation:
    """Test 1: Known cable/length/current produces expected VD%."""

    def test_known_cable_vd(self):
        # 50kW motor, 30m cable, 3C x 16 sq TPYC
        load = _make_load(kw=50, cable_length=30, cable_size="3C x 16 sq")
        results = calculate_voltage_drop([load], system_voltage=450, frequency=60,
                                         class_rule="KR", ambient_temp=45)

        assert len(results) == 1
        r = results[0]

        # Manual calculation:
        # I_run = 50000 / (sqrt(3) * 450 * 0.85 * 0.9) = 50000 / 596.05 = 83.89 A
        # R = 1.38 ohm/km, X = 0.078 ohm/km
        # cos_phi = 0.85, sin_phi = 0.5268
        # VD = sqrt(3) * 83.89 * 30 * (1.38*0.85 + 0.078*0.5268) / 1000
        # VD = 1.7321 * 83.89 * 30 * (1.173 + 0.04109) / 1000
        # VD = 1.7321 * 83.89 * 30 * 1.2141 / 1000
        # VD = 5.295 V
        # VD% = 5.295 / 450 * 100 = 1.177%

        i_run = 50000 / (math.sqrt(3) * 450 * 0.85 * 0.9)
        r_cable = 1.38
        x_cable = 0.078
        cos_phi = 0.85
        sin_phi = math.sqrt(1 - 0.85 ** 2)
        vd = math.sqrt(3) * i_run * 30 * (r_cable * cos_phi + x_cable * sin_phi) / 1000
        expected_pct = vd / 450 * 100

        assert abs(r["running_voltage_drop_percent"] - expected_pct) < 0.01
        assert r["cable_size"] == "3C x 16 sq"

    def test_starting_vd_higher(self):
        load = _make_load(kw=50, cable_length=30, cable_size="3C x 16 sq",
                          start_method="DOL", start_multiplier=6.0)
        results = calculate_voltage_drop([load], system_voltage=450)
        r = results[0]
        assert r["starting_voltage_drop_percent"] > r["running_voltage_drop_percent"]


class TestAutoCableSizing:
    """Test 2: Auto cable sizing returns valid size."""

    def test_auto_size_small_load(self):
        # Small load should get small cable
        load = _make_load(kw=5, cable_length=20)
        results = calculate_voltage_drop([load], system_voltage=450)
        r = results[0]
        assert r["cable_size"] is not None
        assert r["cable_size"] != "N/A"
        assert r["is_acceptable"] is True

    def test_auto_size_large_load(self):
        # Large load should get larger cable
        load = _make_load(kw=200, cable_length=50)
        results = calculate_voltage_drop([load], system_voltage=450)
        r = results[0]
        assert r["cable_size"] is not None
        # The cable should handle the current
        cable_db = load_cable_database()
        cable = next((c for c in cable_db["cables"]
                      if c["type"] == "TPYC" and c["size"] == r["cable_size"]), None)
        assert cable is not None

    def test_auto_size_returns_valid_db_entry(self):
        cable_db = load_cable_database()
        limits = CLASS_LIMITS["KR"]
        load = _make_load(kw=30, cable_length=25)
        size = auto_size_cable(load, cable_db, "TPYC", 450, 45, limits)
        valid_sizes = [c["size"] for c in cable_db["cables"]]
        assert size in valid_sizes


class TestOverLimitRecommendation:
    """Test 3: Over-limit cable triggers recommendation for larger size."""

    def test_overlimit_triggers_recommendation(self):
        # Use a very small cable for a large load to force over-limit
        load = _make_load(kw=100, cable_length=100, cable_size="3C x 4 sq")
        results = calculate_voltage_drop([load], system_voltage=450, class_rule="KR")
        r = results[0]
        # Should fail voltage drop check with such a small cable for 100kW at 100m
        assert r["is_acceptable"] is False
        assert r["recommended_cable_size"] is not None

    def test_acceptable_no_recommendation(self):
        # Use a properly sized cable
        load = _make_load(kw=10, cable_length=10, cable_size="3C x 10 sq")
        results = calculate_voltage_drop([load], system_voltage=450)
        r = results[0]
        assert r["is_acceptable"] is True
        assert r["recommended_cable_size"] is None

    def test_dnv_stricter_limits(self):
        # DNV has 5% running limit vs KR's 6%
        load = _make_load(kw=50, cable_length=50, cable_size="3C x 16 sq")
        results_kr = calculate_voltage_drop([load], system_voltage=450, class_rule="KR")
        results_dnv = calculate_voltage_drop([load], system_voltage=450, class_rule="DNV")

        r_kr = results_kr[0]
        r_dnv = results_dnv[0]

        assert r_dnv["max_allowed_running"] == 5.0
        assert r_kr["max_allowed_running"] == 6.0
        # Same VD% but different limits
        assert (r_kr["running_voltage_drop_percent"] ==
                r_dnv["running_voltage_drop_percent"])
