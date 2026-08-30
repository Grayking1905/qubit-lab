from fastapi import APIRouter

from app.database import db
from app.schemas.gate import GateOut

router = APIRouter(prefix="/gates", tags=["gates"])


@router.get("", response_model=list[GateOut])
async def list_gates():
    return await db.gate.find_many(order={"createdAt": "asc"})
