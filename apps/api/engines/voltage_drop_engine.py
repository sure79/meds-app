import math
import json
import os
from typing import List, Optional

CLASS_LIMITS = {
    "KR": {"running": 6.0, "starting": 15.0},
    "ABS": {"running": 6.0, "starting": 15.0},
    "DNV": {"running": 5.0, "starting": 15.0},
    "LR": {"running": 6.0, "starting": 20.0},
    "BV": {"running": 6.0, "starting": 15.0},
    "NK": {"running": 6.0, "starting": 15.0},
    "CCS": {"running": 5.0, "starting": 15.0},
}

STARTING_PF = {
    "DOL": 0.3,
    "Y-Delta": 0.4,
    "SoftStarter": 0.5,
    "VFD": 0.9,
    "None": 0.85,
}


def load_cable_database():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'cable_database.json')
    with open(data_path, 'r') as f:
        return json.load(f)


def calculate_voltage_drop(loads, system_voltage=450, frequency=60, class_rule="KR", ambient_temp=45):
    """
    IEC 60092-352 voltage drop calculation.

    delta_V = sqrt(3) * I * L * (R*cos_phi + X*sin_phi) / 1000
    delta_V% = (delta_V / V_rated) * 100
    """
    cable_db = load_cable_database()
    limits = CLASS_LIMITS.get(class_rule, CLASS_LIMITS["KR"])
    results = []

    for load in loads:
        cable_type = load.cable_type or "TPYC"

        # Auto-select cable size if not specified
        cable_size = load.cable_size
        if not cable_size:
            cable_size = auto_size_cable(load, cable_db, cable_type, system_voltage, ambient_temp, limits)

        # Get cable specs
        cable_spec = _find_cable_spec(cable_db, cable_type, cable_size)
        if not cable_spec:
            results.append({
                "load_id": load.id,
                "load_name": load.name,
                "cable_type": cable_type,
                "cable_size": cable_size or "N/A",
                "cable_length": load.cable_length,
                "running_voltage_drop_percent": 0,
                "starting_voltage_drop_percent": 0,
                "max_allowed_running": limits["running"],
                "max_allowed_starting": limits["starting"],
                "is_acceptable": False,
                "recommended_cable_size": None,
            })
            continue

        # Running current
        i_running = (load.rated_power_kw * 1000) / (
            math.sqrt(3) * system_voltage * load.power_factor * load.efficiency
        )

        # Running voltage drop
        r = cable_spec["resistance_75c"]  # ohm/km at operating temp
        x = cable_spec["reactance"]  # ohm/km
        cos_phi = load.power_factor
        sin_phi = math.sqrt(1 - cos_phi ** 2)

        vd_running = math.sqrt(3) * i_running * load.cable_length * (r * cos_phi + x * sin_phi) / 1000
        vd_running_pct = (vd_running / system_voltage) * 100

        # Starting voltage drop
        if load.start_method != "None" and load.starting_current_multiplier > 1:
            i_starting = i_running * load.starting_current_multiplier
            cos_phi_start = STARTING_PF.get(load.start_method, 0.3)
            sin_phi_start = math.sqrt(1 - cos_phi_start ** 2)

            # Y-Delta reduces starting current by 1/3
            if load.start_method == "Y-Delta":
                i_starting = i_starting / 3

            vd_starting = math.sqrt(3) * i_starting * load.cable_length * (
                r * cos_phi_start + x * sin_phi_start
            ) / 1000
            vd_starting_pct = (vd_starting / system_voltage) * 100
        else:
            vd_starting_pct = vd_running_pct

        is_acceptable = vd_running_pct <= limits["running"] and vd_starting_pct <= limits["starting"]

        recommended = None
        if not is_acceptable:
            recommended = _recommend_larger_cable(
                load, cable_db, cable_type, cable_size, system_voltage, limits, ambient_temp
            )

        results.append({
            "load_id": load.id,
            "load_name": load.name,
            "cable_type": cable_type,
            "cable_size": cable_size,
            "cable_length": load.cable_length,
            "running_voltage_drop_percent": round(vd_running_pct, 2),
            "starting_voltage_drop_percent": round(vd_starting_pct, 2),
            "max_allowed_running": limits["running"],
            "max_allowed_starting": limits["starting"],
            "is_acceptable": is_acceptable,
            "recommended_cable_size": recommended,
        })

    return results


def auto_size_cable(load, cable_db, cable_type, system_voltage, ambient_temp, limits):
    """Select minimum cable size meeting current rating, voltage drop, and short circuit criteria."""
    i_running = (load.rated_power_kw * 1000) / (
        math.sqrt(3) * system_voltage * load.power_factor * load.efficiency
    )

    cables = [c for c in cable_db.get("cables", []) if c["type"] == cable_type]
    cables.sort(key=lambda c: c["conductor_area"])

    if ambient_temp >= 45:
        temp_key = "current_rating_45c"
    elif ambient_temp >= 40:
        temp_key = "current_rating_40c"
    else:
        temp_key = "current_rating_30c"

    for cable in cables:
        if cable[temp_key] >= i_running:
            # Check voltage drop too
            r = cable["resistance_75c"]
            x = cable["reactance"]
            cos_phi = load.power_factor
            sin_phi = math.sqrt(1 - cos_phi ** 2)
            vd = math.sqrt(3) * i_running * load.cable_length * (r * cos_phi + x * sin_phi) / 1000
            vd_pct = (vd / system_voltage) * 100
            if vd_pct <= limits["running"]:
                return cable["size"]

    # If none found, return largest available
    if cables:
        return cables[-1]["size"]
    return "3C x 2.5 sq"


def _find_cable_spec(cable_db, cable_type, cable_size):
    for c in cable_db.get("cables", []):
        if c["type"] == cable_type and c["size"] == cable_size:
            return c
    return None


def _recommend_larger_cable(load, cable_db, cable_type, current_size, system_voltage, limits, ambient_temp):
    cables = [c for c in cable_db.get("cables", []) if c["type"] == cable_type]
    cables.sort(key=lambda c: c["conductor_area"])

    found_current = False
    for cable in cables:
        if cable["size"] == current_size:
            found_current = True
            continue
        if found_current:
            return cable["size"]
    return None
