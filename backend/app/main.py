from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.auth import router as auth_router
from app.api.hosts import router as hosts_router
from app.api.events import router as events_router
from app.api.alerts import router as alerts_router
from app.api.incidents import router as incidents_router
from app.api.iocs import router as iocs_router
from app.api.dashboard import router as dashboard_router
from app.api.users import router as users_router
from app.api.rules import router as rules_router
from app.api.audit_logs import router as audit_logs_router

from contextlib import asynccontextmanager
from app.database import SessionLocal
from app.database_seeder import seed_detection_rules, seed_initial_admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed detection rules and initial admin user on startup
    db = SessionLocal()
    try:
        seed_detection_rules(db)
        seed_initial_admin(db)
    except Exception:
        pass
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CyberShield XDR Security Monitoring and Incident Response API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register api routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(hosts_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(iocs_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(rules_router, prefix=settings.API_V1_STR)
app.include_router(audit_logs_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["root"])
def read_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "status": "healthy",
        "docs": "/docs"
    }
