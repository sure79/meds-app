"""Tests for short circuit calculation engine."""
import sys
import os
import math
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from apps.api.models.generator import Generator
from apps.api.models.bus import Bus
from apps.api.models.equipment import Load, BusTie
from apps.api.engines.short_circuit_engine import calculate_short_circuit


def _make_generator(id="gen1", name="DG1", type="diesel", kw=500, voltage=450,
                    bus_id="bus1", xd=0.15, xd_prime=0.25):
    return Generator(id=id, name=name, type=type, rated_power_kw=kw,
                     rated_voltage=voltage, bus_id=bus_id,
                     subtransient_reactance_xd=xd, transient_reactance_xd_prime=xd_prime)


def _make_bus(id="bus1", name="MSB1", type="main", voltage=450, busbar_rating=0):
    return Bus(id=id, name=name, type=type, rated_voltage=voltage, busbar_rating=busbar_rating)


def _make_load(id="load1", name="Pump", type="pump", kw=50, bus_id="bus1",
               start_multiplier=6.0):
    return Load(id=id, name=name, type=type, rated_power_kw=kw, bus_id=bus_id,
                load_factors={}, starting_current_multiplier=start_multiplier)


class TestSingleGenerator:
    """Test 1: Single generator produces known I_sc value."""

    def test_single_gen_isc(self):
        gen = _make_generator(kw=500, voltage=450, xd=0.15)
        bus = _make_bus()
        results = calculate_short_circuit([gen], [bus], [], [], include_motor_contribution=False)

        assert len(results) == 1
        r = results[0]

        # Manual calculation:
        # S_rated = 500000 / 0.8 = 625000 VA
        # Z_gen = 0.15 * 450^2 / 625000 = 0.15 * 202500 / 625000 = 0.0486 ohms
        # I_sc = 450 / (sqrt(3) * 0.0486) = 450 / 0.08417 = 5346.4 A = 5.35 kA
        s_rated = 500000 / 0.8
        z_gen = 0.15 * (450 ** 2) / s_rated
        expected_isc_ka = 450 / (math.sqrt(3) * z_gen) / 1000

        assert abs(r["symmetrical_current_ka"] - expected_isc_ka) < 0.1
        assert r["peak_current_ka"] > r["symmetrical_current_ka"]
        assert r["breaking_current_ka"] == r["symmetrical_current_ka"]
        assert r["is_adequate"] is True


class TestTwoGeneratorsWithBusTie:
    """Test 2: Two generators with bus-tie doubles contribution."""

    def test_two_gens_bus_tie(self):
        gen1 = _make_generator(id="g1", kw=500, voltage=450, bus_id="bus1")
        gen2 = _make_generator(id="g2", kw=500, voltage=450, bus_id="bus2")
        bus1 = _make_bus(id="bus1", name="MSB1")
        bus2 = _make_bus(id="bus2", name="MSB2")
        tie = BusTie(id="bt1", name="Bus Tie 1", bus1_id="bus1", bus2_id="bus2",
                     breaker_rating=1000, is_closed=True)

        results_tied = calculate_short_circuit([gen1, gen2], [bus1, bus2], [], [tie],
                                               include_motor_contribution=False)
        results_open = calculate_short_circuit([gen1, gen2], [bus1, bus2], [], [],
                                               include_motor_contribution=False)

        # With tie closed, bus1 sees both generators
        r_tied_bus1 = next(r for r in results_tied if r["bus_id"] == "bus1")
        r_open_bus1 = next(r for r in results_open if r["bus_id"] == "bus1")

        # Tied should be approximately double the open value
        assert abs(r_tied_bus1["symmetrical_current_ka"] -
                   2 * r_open_bus1["symmetrical_current_ka"]) < 0.1

    def test_open_tie(self):
        gen1 = _make_generator(id="g1", kw=500, bus_id="bus1")
        gen2 = _make_generator(id="g2", kw=500, bus_id="bus2")
        bus1 = _make_bus(id="bus1")
        bus2 = _make_bus(id="bus2")
        tie = BusTie(id="bt1", name="BT", bus1_id="bus1", bus2_id="bus2",
                     breaker_rating=1000, is_closed=False)

        results = calculate_short_circuit([gen1, gen2], [bus1, bus2], [], [tie],
                                          include_motor_contribution=False)
        r_bus1 = next(r for r in results if r["bus_id"] == "bus1")
        r_bus2 = next(r for r in results if r["bus_id"] == "bus2")

        # Open tie: each bus only sees its own generator
        assert abs(r_bus1["symmetrical_current_ka"] -
                   r_bus2["symmetrical_current_ka"]) < 0.01


class TestMotorContribution:
    """Test 3: Motor contribution increases fault current."""

    def test_motor_contribution_included(self):
        gen = _make_generator(kw=500, bus_id="bus1")
        bus = _make_bus(id="bus1")
        motor = _make_load(id="m1", name="Motor", type="motor", kw=100,
                           bus_id="bus1", start_multiplier=6.0)

        results_with = calculate_short_circuit([gen], [bus], [motor], [],
                                               include_motor_contribution=True)
        results_without = calculate_short_circuit([gen], [bus], [motor], [],
                                                   include_motor_contribution=False)

        r_with = results_with[0]
        r_without = results_without[0]

        # Motor contribution should increase symmetrical current
        assert r_with["symmetrical_current_ka"] > r_without["symmetrical_current_ka"]

    def test_non_motor_no_contribution(self):
        gen = _make_generator(kw=500, bus_id="bus1")
        bus = _make_bus(id="bus1")
        heater = Load(id="h1", name="Heater", type="heater", rated_power_kw=50,
                      bus_id="bus1", load_factors={})

        results_with = calculate_short_circuit([gen], [bus], [heater], [],
                                               include_motor_contribution=True)
        results_without = calculate_short_circuit([gen], [bus], [heater], [],
                                                   include_motor_contribution=False)

        # Heater is not a motor type, so no contribution regardless
        assert (results_with[0]["symmetrical_current_ka"] ==
                results_without[0]["symmetrical_current_ka"])
