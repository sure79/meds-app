from pydantic import BaseModel, Field
from typing import Literal, Optional


class Generator(BaseModel):
    id: str
    name: str
    type: Literal['diesel', 'emergency', 'shaft', 'fuel_cell', 'battery']
    rated_power_kw: float = Field(gt=0)
    rated_voltage: float
    rated_current_a: float = 0  # auto-calculated
    power_factor: float = Field(default=0.8, ge=0, le=1)
    frequency: Literal[50, 60] = 60
    phase: Literal[1, 3] = 3
    subtransient_reactance_xd: float = Field(default=0.15, ge=0.05, le=0.5)
    transient_reactance_xd_prime: float = Field(default=0.25, ge=0.1, le=0.6)
    bus_id: str
