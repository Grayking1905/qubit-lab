from pydantic import BaseModel, Field


class SandboxRequest(BaseModel):
    code: str = Field(min_length=1, max_length=8000)
    dialect: str = "qiskit"


class SandboxResponse(BaseModel):
    ok: bool
    stdout: str
    stderr: str
