from fastapi import APIRouter
from ..models.project import ShortCircuitRequest
from ..engines.short_circuit_engine import calculate_short_circuit

router = APIRouter(prefix="/api/short-circuit", tags=["Short Circuit"])


@router.post("/calculate")
async def calc_short_circuit(req: ShortCircuitRequest):
    results = calculate_short_circuit(
        req.generators, req.buses, req.loads, req.bus_ties, req.include_motor_contribution
    )
    return {"results": results}
