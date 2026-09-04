from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.armies import router as armies_router
from app.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(title="MESBG Companion API", version="0.1.0")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    application.include_router(armies_router, prefix="/api/v1")
    return application


app = create_app()
