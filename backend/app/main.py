from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .api.routes.alerts import router as alerts_router
from .api.routes.auth import router as auth_router
from .api.routes.cyber_memory import incident_router as incident_cyber_memory_router
from .api.routes.cyber_memory import router as cyber_memory_router
from .api.routes.detection import router as detection_router
from .api.routes.incidents import router as incidents_router
from .api.routes.iocs import router as iocs_router
from .api.routes.logs import router as logs_router
from .api.routes.mitre import router as mitre_router
from .api.routes.response_actions import router as response_actions_router
from .database import Base, engine
from .services.mitre_service import seed_mitre_techniques

app = FastAPI(title="Cyber Memory Network")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(incidents_router)
app.include_router(alerts_router)
app.include_router(iocs_router)
app.include_router(logs_router)
app.include_router(detection_router)
app.include_router(mitre_router)
app.include_router(response_actions_router)
app.include_router(cyber_memory_router)
app.include_router(incident_cyber_memory_router)


@app.on_event("startup")
def create_development_tables() -> None:
    Base.metadata.create_all(bind=engine)
    seed_mitre_techniques()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Cyber Memory Network API is running"}
