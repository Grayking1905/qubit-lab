from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.badge import BadgeOut

GateType = Literal["H", "X", "Y", "Z", "CNOT", "TOFFOLI", "MEASURE"]


class GateOp(BaseModel):
    type: GateType
    qubit: int = Field(ge=0)
    target: int | None = Field(default=None, ge=0)
    controls: list[int] | None = None
    step: int = Field(ge=0)

    @model_validator(mode="after")
    def check_shape(self):
        if self.type == "CNOT" and self.target is None:
            raise ValueError("CNOT requires a 'target' qubit")
        if self.type == "TOFFOLI" and (not self.controls or len(self.controls) != 2 or self.target is None):
            raise ValueError("TOFFOLI requires exactly two 'controls' and a 'target'")
        return self


class SimulateRequest(BaseModel):
    qubits: int = Field(gt=0, le=12)
    gates: list[GateOp]


class Complex(BaseModel):
    re: float
    im: float


class SimulateResult(BaseModel):
    finalStatevector: list[Complex]
    probabilities: dict[str, float]
    intermediateStatevectors: list[list[Complex]]


class SubmitRequest(BaseModel):
    qubits: int = Field(gt=0, le=12)
    gates: list[GateOp]


class SubmitResponse(BaseModel):
    correct: bool
    yourResult: SimulateResult
    expectedResult: SimulateResult | None = None
    xpEarned: int
    newBadges: list[BadgeOut] = []
