"""Cable sizing engine combining current rating, voltage drop, and short circuit criteria."""
import math
from typing import Optional
from .voltage_drop_engine import load_cable_database, auto_size_cable, CLASS_LIMITS


def size_cable(rated_power_kw, voltage, power_factor, efficiency, cable_length,
               start_method="DOL", start_multiplier=6.0, cable_type="TPYC",
               ambient_temp=45, class_rule="KR", cable_db=None):
    """
    Determine minimum cable size based on three criteria:
    1. Current carrying capacity (IEC 60092-352)
    2. Voltage drop limit
    3. Short circuit withstand (I^2*t)
    Returns the largest size among the three.
    """
    if cable_db is None:
        cable_db = load_cable_database()

    limits = CLASS_LIMITS.get(class_rule, CLASS_LIMITS["KR"])

    # Build a minimal load-like object for auto_size_cable
    class _LoadProxy:
        def __init__(self):
            self.rated_power_kw = rated_power_kw
            self.power_factor = power_factor
            self.efficiency = efficiency
            self.cable_length = cable_length
            self.start_method = start_method
            self.starting_current_multiplier = start_multiplier

    load_proxy = _LoadProxy()
    selected_size = auto_size_cable(load_proxy, cable_db, cable_type, voltage, ambient_temp, limits)
    return selected_size
