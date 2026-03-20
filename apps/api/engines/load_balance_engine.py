import math
from typing import List, Dict, Tuple

CONDITION_LABELS = {
    "sea_going": "항해 (Sea Going)",
    "maneuvering": "입출항 (Maneuvering)",
    "port_loading": "정박-하역 (Port Loading)",
    "port_idle": "정박-무하역 (Port Idle)",
    "emergency": "비상 (Emergency)",
    "anchor": "묘박 (Anchor)",
    "dynamic_positioning": "DP 운전 (Dynamic Positioning)",
    "special_1": "특수조건 1 (Special 1)",
    "special_2": "특수조건 2 (Special 2)",
}

CLASS_MARGINS = {
    "KR": 0.10,
    "ABS": 0.10,
    "DNV": 0.15,
    "LR": 0.10,
    "BV": 0.10,
    "NK": 0.10,
    "CCS": 0.10,
}


def calculate_load_balance(generators, loads, buses, conditions, margin=None, class_society="KR"):
    """
    Calculate load balance for all operating conditions.

    For each condition:
    1. P_load = P_rated * LF * DF for each load
    2. P_total = sum of all P_load
    3. S_total = sum of (P_load / PF) for each load
    4. Determine active generators for the condition
    5. Calculate load percentage, margin, acceptability

    Emergency condition: only use emergency generator, only emergency loads

    Returns list of results per condition.
    """
    if margin is None:
        margin = CLASS_MARGINS.get(class_society, 0.10)

    results = []
    for condition in conditions:
        total_kw = 0.0
        total_kva = 0.0
        per_bus = {}

        for load in loads:
            lf = load.load_factors.get(condition, 0.0)
            df = load.diversity_factor

            # For emergency condition, only include emergency loads
            if condition == "emergency" and not load.is_emergency:
                continue

            p_load = load.rated_power_kw * lf * df
            s_load = p_load / load.power_factor if load.power_factor > 0 else p_load

            total_kw += p_load
            total_kva += s_load

            bus_id = load.bus_id
            per_bus[bus_id] = per_bus.get(bus_id, 0) + p_load

        # Determine active generators
        if condition == "emergency":
            active_gens = [g for g in generators if g.type == "emergency"]
        else:
            active_gens = [g for g in generators if g.type != "emergency"]

        total_gen_kw = sum(g.rated_power_kw for g in active_gens)
        required_kw = total_kw * (1 + margin)

        load_pct = (total_kw / total_gen_kw * 100) if total_gen_kw > 0 else 0
        margin_kw = total_gen_kw - total_kw
        margin_pct = (margin_kw / total_gen_kw * 100) if total_gen_kw > 0 else 0

        # Acceptable: load% <= 90% and margin >= required margin
        is_acceptable = load_pct <= 90 and total_gen_kw >= required_kw

        results.append({
            "condition": condition,
            "condition_label": CONDITION_LABELS.get(condition, condition),
            "total_load_kw": round(total_kw, 2),
            "total_load_kva": round(total_kva, 2),
            "required_gen_kw": round(required_kw, 2),
            "active_generators": [g.id for g in active_gens],
            "total_gen_capacity_kw": round(total_gen_kw, 2),
            "load_percentage": round(load_pct, 2),
            "margin_kw": round(margin_kw, 2),
            "margin_percentage": round(margin_pct, 2),
            "is_acceptable": is_acceptable,
            "per_bus_loads": {k: round(v, 2) for k, v in per_bus.items()},
        })

    return results


def recommend_generators(loads, conditions, voltage=450, frequency=60):
    """Recommend generator configuration based on total load."""
    max_load = 0
    for condition in conditions:
        if condition == "emergency":
            continue
        total = sum(
            l.rated_power_kw * l.load_factors.get(condition, 0) * l.diversity_factor
            for l in loads
        )
        max_load = max(max_load, total)

    # Rule: at least 2 generators, each can handle max_load alone with 15% margin
    # Standard sizes: 100, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1500, 2000
    standard_sizes = [100, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1500, 2000]

    required_per_gen = max_load * 1.15  # single gen must handle max load + 15%

    # Find smallest standard size >= required
    gen_size = standard_sizes[-1]
    for s in standard_sizes:
        if s >= required_per_gen:
            gen_size = s
            break

    # Determine count: at least 2 main + 1 emergency
    count = max(2, math.ceil(max_load * 1.15 / gen_size) + 1)

    # Emergency generator: handle SOLAS emergency loads
    emerg_load = sum(
        l.rated_power_kw * l.load_factors.get("emergency", 0) * l.diversity_factor
        for l in loads if l.is_emergency
    )
    eg_size = standard_sizes[0]
    for s in standard_sizes:
        if s >= emerg_load * 1.15:
            eg_size = s
            break

    return {
        "main_generator_count": count,
        "main_generator_kw": gen_size,
        "emergency_generator_kw": eg_size,
        "max_load_kw": round(max_load, 1),
        "reasoning": f"최대 부하 {max_load:.0f}kW 기준, {gen_size}kW x {count}대 + 비상 {eg_size}kW 추천"
    }
