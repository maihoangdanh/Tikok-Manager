from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_tables
from app.api import auth, companies, campaigns, gmv, creatives, alerts
from app.jobs.sync_metrics import start_scheduler

app = FastAPI(title="DM Manager API", version="1.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(companies.router, prefix="/api/v1/companies", tags=["companies"])
app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["campaigns"])
app.include_router(gmv.router, prefix="/api/v1/gmv", tags=["gmv"])
app.include_router(creatives.router, prefix="/api/v1/creatives", tags=["creatives"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])

@app.on_event("startup")
async def startup():
    create_tables()
    start_scheduler()

@app.get("/api/health")
def health():
    return {"status": "ok"}
