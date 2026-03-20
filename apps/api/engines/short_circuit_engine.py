import math
from typing import List, Dict


def calculate_short_circuit(generators, buses, loads, bus_ties, include_motor_contribution=True):
    """
    IEC 61363-1 short circuit calculation for each bus.

    1. Generator contribution:
       I_sc_gen = V / (sqrt(3) * Z_gen)
       Z_gen = X"d * V^2 / S_rated  (ohms)
       S_rated = P_rated / PF (VA)

    2. Motor contribution (if enabled):
       I_sc_motor = I_rated / X"d_motor
       X"d_motor ~ 1/starting_current_multiplier

    3. Peak current:
       I_peak = I_sc_total * kappa * sqrt(2)
       kappa = 1.02 + 0.98 * exp(-3/(X/R))
       Typical X/R = 10 for ship systems, so kappa ~ 1.8

    4. Breaking current:
       I_breaking = I_sc_total * mu
       mu ~ 1.0 for 5-cycle breakers

    5. Steady state:
       I_ss = V / (sqrt(3) * X_d * V^2/S_rated)
       Using synchronous reactance (approx 2 * X'd)
    """
    results = []

    for bus in buses:
        v = bus.rated_voltage
        i_sc_total = 0.0

        # Find generators connected to this bus (directly or via bus-ties)
        connected_bus_ids = _get_connected_buses(bus.id, buses, bus_ties)

        # Generator contributions
        for gen in generators:
            if gen.bus_id in connected_bus_ids:
                if gen.type == 'emergency' and bus.type != 'emergency':
                    continue
                s_rated = gen.rated_power_kw * 1000 / gen.power_factor  # VA
                z_gen = gen.subtransient_reactance_xd * (v ** 2) / s_rated  # ohms
                i_sc_gen = v / (math.sqrt(3) * z_gen)  # A
                i_sc_total += i_sc_gen

        # Motor contributions
        if include_motor_contribution:
            motor_types = ('motor', 'pump', 'compressor', 'ventilation', 'thruster', 'winch', 'crane')
            for load in loads:
                if load.bus_id in connected_bus_ids and load.type in motor_types:
                    i_rated = (load.rated_power_kw * 1000) / (
                        math.sqrt(3) * v * load.power_factor * load.efficiency
                    )
                    xd_motor = 1.0 / load.starting_current_multiplier
                    i_sc_motor = i_rated / xd_motor
                    i_sc_total += i_sc_motor

        i_sc_ka = i_sc_total / 1000

        # Peak current (kappa factor)
        xr_ratio = 10  # typical for ship systems
        kappa = 1.02 + 0.98 * math.exp(-3.0 / xr_ratio)
        i_peak_ka = i_sc_ka * kappa * math.sqrt(2)

        # Breaking current
        mu = 1.0  # 5-cycle breaker
        i_breaking_ka = i_sc_ka * mu

        # Steady state (using ~2x transient reactance as approximation for synchronous)
        i_ss_total = 0.0
        for gen in generators:
            if gen.bus_id in connected_bus_ids:
                if gen.type == 'emergency' and bus.type != 'emergency':
                    continue
                s_rated = gen.rated_power_kw * 1000 / gen.power_factor
                x_d = gen.transient_reactance_xd_prime * 2  # approximate synchronous
                z_ss = x_d * (v ** 2) / s_rated
                i_ss = v / (math.sqrt(3) * z_ss)
                i_ss_total += i_ss
        i_ss_ka = i_ss_total / 1000

        # Required breaker rating (round up to standard)
        standard_ratings = [10, 15, 20, 25, 35, 50, 65, 85, 100, 150]
        req_rating = i_peak_ka
        breaker_rating = standard_ratings[-1]
        for r in standard_ratings:
            if r >= req_rating:
                breaker_rating = r
                break

        # Check adequacy against bus breaker rating
        is_adequate = bus.busbar_rating == 0 or i_peak_ka <= bus.busbar_rating

        results.append({
            "bus_id": bus.id,
            "bus_name": bus.name,
            "symmetrical_current_ka": round(i_sc_ka, 2),
            "peak_current_ka": round(i_peak_ka, 2),
            "breaking_current_ka": round(i_breaking_ka, 2),
            "steady_state_current_ka": round(i_ss_ka, 2),
            "required_breaker_rating_ka": breaker_rating,
            "is_adequate": is_adequate,
        })

    return results


def _get_connected_buses(bus_id, buses, bus_ties):
    """Get all bus IDs connected via closed bus-ties (BFS)."""
    connected = {bus_id}
    queue = [bus_id]
    while queue:
        current = queue.pop(0)
        for bt in bus_ties:
            if bt.is_closed:
                if bt.bus1_id == current and bt.bus2_id not in connected:
                    connected.add(bt.bus2_id)
                    queue.append(bt.bus2_id)
                elif bt.bus2_id == current and bt.bus1_id not in connected:
                    connected.add(bt.bus1_id)
                    queue.append(bt.bus1_id)
    return connected
