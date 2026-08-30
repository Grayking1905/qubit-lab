from datetime import datetime
from typing import Any

from pydantic import BaseModel


class GateOut(BaseModel):
    id: str
    name: str
    symbol: str
    matrixDefinition: Any
    description: str
    createdBy: str
    createdAt: datetime

    model_config = {"from_attributes": True}
