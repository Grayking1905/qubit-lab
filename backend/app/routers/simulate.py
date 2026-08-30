from fastapi import APIRouter, HTTPException, status

from app.schemas.simulate import SimulateRequest, SimulateResult
from app.services import quantum

router = APIRouter(tags=["simulate"])


@router.post("/simulate", response_model=SimulateResult)
async def simulate(payload: SimulateRequest):
    try:
        return quantum.run_simulation(payload.qubits, payload.gates)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
