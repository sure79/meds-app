from pydantic import BaseModel


class CableSpec(BaseModel):
    type: str
    size: str
    conductor_area: float
    cores: int
    resistance_20c: float
    resistance_75c: float
    reactance: float
    current_rating_30c: float
    current_rating_40c: float
    current_rating_45c: float
    voltage: str
    short_circuit_rating_1s: float
