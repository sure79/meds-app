"""Protection coordination engine for TCC curve generation."""
import math
from typing import List, Dict, Optional


def generate_mccb_curve(rated_current: float, trip_setting: float) -> List[Dict]:
    """
    Generate MCCB time-current curve points.
    Thermal region: t = k / (I/In)^2 for I > 1.05*In
    Magnetic region: instantaneous trip at ~10*In
    """
    points = []
    in_val = trip_setting

    # Thermal region (1.05 to 10x rated)
    for mult in [1.05, 1.1, 1.2, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10]:
        current = in_val * mult
        if mult <= 1.05:
            time_val = 7200  # 2 hours
        else:
            time_val = 120 / (mult ** 2 - 1)  # inverse time characteristic
        points.append({"current": round(current, 1), "time": round(time_val, 3)})

    # Magnetic (instantaneous) region
    for mult in [10, 10.5, 11, 12, 15, 20]:
        current = in_val * mult
        points.append({"current": round(current, 1), "time": 0.02})  # ~1 cycle

    return points


def generate_acb_curve(rated_current: float, lt_pickup: float = 0.8, lt_delay: float = 10,
                       st_pickup: float = 6, st_delay: float = 0.3) -> List[Dict]:
    """
    Generate ACB time-current curve points with LT, ST, and INST regions.
    """
    points = []
    in_val = rated_current

    # Long-time region
    for mult in [lt_pickup, lt_pickup * 1.1, lt_pickup * 1.5, lt_pickup * 2,
                 lt_pickup * 3, lt_pickup * 4, lt_pickup * 5]:
        current = in_val * mult
        if mult <= lt_pickup:
            time_val = lt_delay * 10
        else:
            time_val = lt_delay / ((mult / lt_pickup) ** 2)
        points.append({"current": round(current, 1), "time": round(max(time_val, st_delay), 3)})

    # Short-time region
    for mult in [st_pickup, st_pickup * 1.5, st_pickup * 2]:
        current = in_val * mult
        points.append({"current": round(current, 1), "time": round(st_delay, 3)})

    # Instantaneous
    for mult in [st_pickup * 2.5, st_pickup * 3, st_pickup * 5]:
        current = in_val * mult
        points.append({"current": round(current, 1), "time": 0.01})

    return points


def generate_cable_damage_curve(conductor_area: float, material: str = "copper") -> List[Dict]:
    """
    Cable I^2*t damage curve.
    For copper: I^2*t = k^2 * S^2  where k=115 for PVC, k=143 for XLPE
    t = k^2 * S^2 / I^2
    """
    k = 115  # PVC insulation
    points = []

    for time_val in [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10]:
        current = k * conductor_area / math.sqrt(time_val)
        points.append({"current": round(current, 1), "time": time_val})

    return points


def check_selectivity(upstream_curve: List[Dict], downstream_curve: List[Dict]) -> Dict:
    """
    Check selectivity between upstream and downstream devices.
    Downstream device must always trip faster (lower time) than upstream at all current levels.
    """
    is_selective = True
    overlap_regions = []

    # Compare at common current levels
    for ds_point in downstream_curve:
        ds_current = ds_point["current"]
        ds_time = ds_point["time"]

        # Find upstream time at same or nearest current
        us_time = _interpolate_time(upstream_curve, ds_current)
        if us_time is not None and ds_time >= us_time:
            is_selective = False
            overlap_regions.append({
                "current": ds_current,
                "downstream_time": ds_time,
                "upstream_time": us_time,
            })

    return {
        "is_selective": is_selective,
        "overlap_regions": overlap_regions,
        "message": "선택성 확보" if is_selective else f"선택성 미확보 - {len(overlap_regions)}개 구간에서 겹침 발생"
    }


def _interpolate_time(curve: List[Dict], current: float) -> Optional[float]:
    if not curve:
        return None

    for i in range(len(curve) - 1):
        if curve[i]["current"] <= current <= curve[i + 1]["current"]:
            c_range = curve[i + 1]["current"] - curve[i]["current"]
            if c_range == 0:
                return curve[i]["time"]
            ratio = (current - curve[i]["current"]) / c_range
            return curve[i]["time"] + ratio * (curve[i + 1]["time"] - curve[i]["time"])

    return None
