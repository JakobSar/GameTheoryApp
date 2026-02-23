from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .models import SolveRequest, SolveResponse
from .routes.exercises import router as exercises_router
from .solver import solve_perfect_information

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exercises_router)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "env": settings.app_env}


@app.post("/api/v1/game-tree/solve", response_model=SolveResponse)
def solve_game_tree(payload: SolveRequest) -> SolveResponse:
    return solve_perfect_information(payload.game)
