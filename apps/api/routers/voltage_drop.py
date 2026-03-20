from fastapi import APIRouter
from ..models.project import VoltageDropRequest
from ..engines.voltage_drop_engine import calculate_voltage_drop

router = APIRouter(prefix="/api/voltage-drop", tags=["Voltage Drop"])


@router.post("/calculate")
async def calc_voltage_drop(req: VoltageDropRequest):
    results = calculate_voltage_drop(
        req.loads, req.system_voltage, req.frequency, req.class_rule, req.ambient_temp
    )
    return {"results": results}
