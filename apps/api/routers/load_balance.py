from fastapi import APIRouter
from ..models.project import LoadBalanceRequest, LoadBalanceResultItem
from ..engines.load_balance_engine import calculate_load_balance, recommend_generators

router = APIRouter(prefix="/api/load-balance", tags=["Load Balance"])


@router.post("/calculate")
async def calc_load_balance(req: LoadBalanceRequest):
    results = calculate_load_balance(
        req.generators, req.loads, req.buses, req.conditions, req.margin, req.class_society
    )
    return {"results": results}


@router.post("/recommend-generators")
async def rec_generators(req: LoadBalanceRequest):
    result = recommend_generators(req.loads, req.conditions,
                                  req.generators[0].rated_voltage if req.generators else 450)
    return {"recommendation": result}
