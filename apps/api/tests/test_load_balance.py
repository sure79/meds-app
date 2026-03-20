"""Tests for load balance calculation engine."""
import sys
import os
import pytest

# Allow running tests directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from apps.api.models.generator import Generator
from apps.api.models.bus import Bus
from apps.api.models.equipment import Load
from apps.api.engines.load_balance_engine import calculate_load_balance, recommend_generators


def _make_generator(id="gen1", name="DG1", type="diesel", kw=500, voltage=450, bus_id="bus1"):
    return Generator(id=id, name=name, type=type, rated_power_kw=kw,
                     rated_voltage=voltage, bus_id=bus_id)


def _make_bus(id="bus1", name="MSB1", type="main", voltage=450):
    return Bus(id=id, name=name, type=type, rated_voltage=voltage)


def _make_load(id="load1", name="Pump 1", type="pump", kw=50, bus_id="bus1",
               load_factors=None, diversity_factor=1.0, is_emergency=False):
    return Load(id=id, name=name, type=type, rated_power_kw=kw, bus_id=bus_id,
                load_factors=load_factors or {}, diversity_factor=diversity_factor,
                is_emergency=is_emergency)


class TestLoadBalanceEmpty:
    """Test 1: Empty project returns all zeros."""

    def test_empty_loads(self):
        gen = _make_generator()
        bus = _make_bus()
        results = calculate_load_balance([gen], [], [bus], ["sea_going"])
        assert len(results) == 1
        r = results[0]
        assert r["total_load_kw"] == 0
        assert r["total_load_kva"] == 0
        assert r["load_percentage"] == 0
        assert r["is_acceptable"] is True

    def test_no_generators(self):
        bus = _make_bus()
        load = _make_load(load_factors={"sea_going": 0.8})
        results = calculate_load_balance([], [load], [bus], ["sea_going"])
        r = results[0]
        assert r["total_gen_capacity_kw"] == 0
        assert r["load_percentage"] == 0
        assert r["is_acceptable"] is False


class TestLoadBalanceSingle:
    """Test 2: Single load, single condition - exact calculation."""

    def test_single_load_single_condition(self):
        gen = _make_generator(kw=500)
        bus = _make_bus()
        load = _make_load(kw=100, load_factors={"sea_going": 0.8}, diversity_factor=0.9)
        results = calculate_load_balance([gen], [load], [bus], ["sea_going"], margin=0.1)

        r = results[0]
        # P = 100 * 0.8 * 0.9 = 72 kW
        assert r["total_load_kw"] == 72.0
        # S = 72 / 0.85 = 84.71 kVA
        assert abs(r["total_load_kva"] - 84.71) < 0.1
        # Load% = 72 / 500 * 100 = 14.4%
        assert abs(r["load_percentage"] - 14.4) < 0.01
        assert r["is_acceptable"] is True

    def test_load_factor_zero(self):
        gen = _make_generator(kw=500)
        bus = _make_bus()
        load = _make_load(kw=100, load_factors={"sea_going": 0.0})
        results = calculate_load_balance([gen], [load], [bus], ["sea_going"])
        assert results[0]["total_load_kw"] == 0


class TestLoadBalanceMultiple:
    """Test 3: Multiple loads, multiple conditions - correct matrix."""

    def test_multiple_loads_conditions(self):
        gen = _make_generator(kw=1000)
        bus = _make_bus()
        load1 = _make_load(id="l1", name="Pump A", kw=100,
                           load_factors={"sea_going": 0.9, "port_idle": 0.3})
        load2 = _make_load(id="l2", name="Pump B", kw=200,
                           load_factors={"sea_going": 0.7, "port_idle": 0.5})
        results = calculate_load_balance([gen], [load1, load2], [bus],
                                         ["sea_going", "port_idle"])

        sg = results[0]
        pi = results[1]

        # sea_going: 100*0.9*1.0 + 200*0.7*1.0 = 90 + 140 = 230
        assert sg["total_load_kw"] == 230.0
        # port_idle: 100*0.3*1.0 + 200*0.5*1.0 = 30 + 100 = 130
        assert pi["total_load_kw"] == 130.0

    def test_per_bus_loads(self):
        gen = _make_generator(kw=1000)
        bus1 = _make_bus(id="bus1", name="MSB1")
        bus2 = _make_bus(id="bus2", name="MSB2")
        load1 = _make_load(id="l1", kw=100, bus_id="bus1",
                           load_factors={"sea_going": 1.0})
        load2 = _make_load(id="l2", kw=200, bus_id="bus2",
                           load_factors={"sea_going": 1.0})
        results = calculate_load_balance([gen], [load1, load2], [bus1, bus2], ["sea_going"])
        r = results[0]
        assert r["per_bus_loads"]["bus1"] == 100.0
        assert r["per_bus_loads"]["bus2"] == 200.0


class TestLoadBalanceOverload:
    """Test 4: Load > 90% triggers warning flag."""

    def test_overload_warning(self):
        gen = _make_generator(kw=100)
        bus = _make_bus()
        load = _make_load(kw=95, load_factors={"sea_going": 1.0})
        results = calculate_load_balance([gen], [load], [bus], ["sea_going"], margin=0.1)
        r = results[0]
        assert r["load_percentage"] == 95.0
        assert r["is_acceptable"] is False

    def test_exactly_at_limit(self):
        gen = _make_generator(kw=1000)
        bus = _make_bus()
        load = _make_load(kw=900, load_factors={"sea_going": 1.0})
        results = calculate_load_balance([gen], [load], [bus], ["sea_going"], margin=0.1)
        r = results[0]
        # 90% load, required = 900*1.1 = 990 <= 1000, so acceptable
        assert r["load_percentage"] == 90.0
        assert r["is_acceptable"] is True


class TestLoadBalanceEmergency:
    """Test 5: Emergency condition only includes emergency loads and generators."""

    def test_emergency_condition(self):
        gen_main = _make_generator(id="dg1", type="diesel", kw=500, bus_id="bus1")
        gen_emerg = _make_generator(id="eg1", type="emergency", kw=100, bus_id="bus_e")
        bus_main = _make_bus(id="bus1", name="MSB")
        bus_emerg = _make_bus(id="bus_e", name="ESB", type="emergency")

        load_main = _make_load(id="l1", kw=200, bus_id="bus1",
                               load_factors={"sea_going": 1.0, "emergency": 0.5},
                               is_emergency=False)
        load_emerg = _make_load(id="l2", kw=50, bus_id="bus_e",
                                load_factors={"sea_going": 0.5, "emergency": 1.0},
                                is_emergency=True)

        results = calculate_load_balance(
            [gen_main, gen_emerg],
            [load_main, load_emerg],
            [bus_main, bus_emerg],
            ["sea_going", "emergency"]
        )

        sg = results[0]  # sea_going
        em = results[1]  # emergency

        # Sea going: both loads active (main gen only)
        assert sg["total_load_kw"] == 200.0 + 25.0  # 200*1.0 + 50*0.5
        assert "dg1" in sg["active_generators"]
        assert "eg1" not in sg["active_generators"]

        # Emergency: only emergency loads (emergency gen only)
        assert em["total_load_kw"] == 50.0  # only load_emerg: 50*1.0
        assert "eg1" in em["active_generators"]
        assert "dg1" not in em["active_generators"]


class TestRecommendGenerators:
    """Test generator recommendation."""

    def test_basic_recommendation(self):
        loads = [
            _make_load(id="l1", kw=100, load_factors={"sea_going": 0.8}),
            _make_load(id="l2", kw=200, load_factors={"sea_going": 0.9}),
        ]
        result = recommend_generators(loads, ["sea_going"])
        assert result["main_generator_count"] >= 2
        assert result["main_generator_kw"] > 0
        assert result["max_load_kw"] > 0
