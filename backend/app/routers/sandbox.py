from fastapi import APIRouter

from app.schemas.sandbox import SandboxRequest, SandboxResponse
from app.services import sandbox

router = APIRouter(tags=["sandbox"])


@router.post("/sandbox/run", response_model=SandboxResponse)
async def run_sandbox(payload: SandboxRequest):
    return sandbox.execute(payload)
