from pydantic import BaseModel, Field
from typing import Literal, Optional


class Bus(BaseModel):
    id: str
    name: str
    type: Literal['main', 'emergency', 'distribution', 'motor_control']
    rated_voltage: float
    rated_current_a: float = 0
    busbar_rating: float = 0
    parent_bus_id: Optional[str] = None
    position: dict = Field(default_factory=lambda: {"x": 0, "y": 0})
