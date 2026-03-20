from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from .generator import Generator
from .bus import Bus
from .equipment import Load, CircuitBreaker, BusTie


class LoadBalanceRequest(BaseModel):
    generators: List[Generator]
    loads: List[Load]
    buses: List[Bus]
    conditions: List[str]
    margin: float = 0.1
    class_society: str = "KR"


class ShortCircuitRequest(BaseModel):
    generators: List[Generator]
    buses: List[Bus]
    loads: List[Load]
    bus_ties: List[BusTie] = []
    include_motor_contribution: bool = True


class VoltageDropRequest(BaseModel):
    loads: List[Load]
    system_voltage: float = 450
    frequency: float = 60
    class_rule: str = "KR"
    ambient_temp: float = 45


class ExportRequest(BaseModel):
    project_name: str = "Marine Electrical Project"
    vessel_name: str = ""
    class_society: str = "KR"
    system_voltage: float = 450
    frequency: int = 60
    generators: List[Generator] = []
    buses: List[Bus] = []
    loads: List[Load] = []
    bus_ties: List[BusTie] = []
    breakers: List[CircuitBreaker] = []


class LoadBalanceResultItem(BaseModel):
    condition: str
    condition_label: str
    total_load_kw: float
    total_load_kva: float
    required_gen_kw: float
    active_generators: List[str]
    total_gen_capacity_kw: float
    load_percentage: float
    margin_kw: float
    margin_percentage: float
    is_acceptable: bool
    per_bus_loads: dict = {}


class ShortCircuitResultItem(BaseModel):
    bus_id: str
    bus_name: str
    symmetrical_current_ka: float
    peak_current_ka: float
    breaking_current_ka: float
    steady_state_current_ka: float
    required_breaker_rating_ka: float
    is_adequate: bool


class VoltageDropResultItem(BaseModel):
    load_id: str
    load_name: str
    cable_type: str
    cable_size: str
    cable_length: float
    running_voltage_drop_percent: float
    starting_voltage_drop_percent: float
    max_allowed_running: float
    max_allowed_starting: float
    is_acceptable: bool
    recommended_cable_size: Optional[str] = None
