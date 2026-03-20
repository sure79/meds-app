from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict


class Load(BaseModel):
    id: str
    name: str
    type: Literal['motor', 'transformer', 'heater', 'lighting', 'navigation',
                  'communication', 'pump', 'compressor', 'ventilation', 'crane',
                  'winch', 'thruster', 'other']
    rated_power_kw: float = Field(gt=0)
    power_factor: float = Field(default=0.85, ge=0, le=1)
    efficiency: float = Field(default=0.9, ge=0, le=1)
    bus_id: str
    start_method: Literal['DOL', 'Y-Delta', 'SoftStarter', 'VFD', 'None'] = 'DOL'
    load_factors: Dict[str, float] = Field(default_factory=dict)
    diversity_factor: float = Field(default=1.0, ge=0, le=1)
    cable_length: float = Field(default=30, ge=0)
    cable_type: Optional[str] = "TPYC"
    cable_size: Optional[str] = None
    starting_current_multiplier: float = Field(default=6.0, ge=1)
    locked_rotor_current_a: Optional[float] = None
    is_essential: bool = False
    is_emergency: bool = False


class CircuitBreaker(BaseModel):
    id: str
    name: str
    type: Literal['ACB', 'MCCB', 'MCB', 'Fuse']
    rated_current_a: float
    breaking_capacity_ka: float
    trip_setting_a: float
    bus_id: str
    load_id: Optional[str] = None
    generator_id: Optional[str] = None


class BusTie(BaseModel):
    id: str
    name: str
    bus1_id: str
    bus2_id: str
    breaker_rating: float
    is_closed: bool = True
