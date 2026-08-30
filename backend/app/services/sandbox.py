"""Execute a tiny, time-boxed quantum Python snippet (Qiskit-first)."""

from __future__ import annotations

import io
import traceback
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from contextlib import redirect_stderr, redirect_stdout

from app.schemas.sandbox import SandboxRequest, SandboxResponse

TIMEOUT_S = 6
MAX_CHARS = 8000


_ALLOWED_IMPORT_HINTS = ("qiskit", "numpy", "math", "cirq", "pennylane")


def _run(code: str) -> tuple[str, str]:
    stdout = io.StringIO()
    stderr = io.StringIO()
    # Intentionally small namespace — no open/os/sys.exit.
    safe_builtins = {
        "abs": abs,
        "all": all,
        "any": any,
        "bool": bool,
        "dict": dict,
        "enumerate": enumerate,
        "float": float,
        "int": int,
        "len": len,
        "list": list,
        "max": max,
        "min": min,
        "print": print,
        "range": range,
        "round": round,
        "str": str,
        "sum": sum,
        "tuple": tuple,
        "zip": zip,
        "__import__": __import__,
    }
    env: dict = {"__builtins__": safe_builtins}
    with redirect_stdout(stdout), redirect_stderr(stderr):
        exec(compile(code, "<sandbox>", "exec"), env, env)  # noqa: S102 — isolated, timed
    return stdout.getvalue(), stderr.getvalue()


def execute(payload: SandboxRequest) -> SandboxResponse:
    code = payload.code.strip()
    if len(code) > MAX_CHARS:
        return SandboxResponse(ok=False, stdout="", stderr="Snippet too long.")
    lowered = code.lower()
    if any(tok in lowered for tok in ("os.system", "subprocess", "socket", "open(", "pathlib", "shutil", "eval(", "exec(")):
        return SandboxResponse(ok=False, stdout="", stderr="That construct is blocked in the teaching sandbox.")
    if not any(h in lowered for h in _ALLOWED_IMPORT_HINTS) and "qc." not in lowered:
        return SandboxResponse(
            ok=False,
            stdout="",
            stderr="Import qiskit, cirq, or pennylane (or use qc.h / qc.cx) so this stays a quantum snippet.",
        )

    try:
        with ThreadPoolExecutor(max_workers=1) as pool:
            fut = pool.submit(_run, code)
            out, err = fut.result(timeout=TIMEOUT_S)
        return SandboxResponse(ok=True, stdout=out[-4000:], stderr=err[-2000:])
    except FuturesTimeout:
        return SandboxResponse(ok=False, stdout="", stderr=f"Timed out after {TIMEOUT_S}s.")
    except Exception:
        return SandboxResponse(ok=False, stdout="", stderr=traceback.format_exc()[-2000:])
