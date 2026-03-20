import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import load_balance, short_circuit, voltage_drop, export

app = FastAPI(
    title="MEDS - Marine Electrical Design Suite API",
    description="선박 전기계통 설계 계산 엔진 API",
    version="0.1.0"
)

# Allow all origins in production (Render sets CORS via env) or specific dev origins
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://meds-web.onrender.com",  # Render frontend
]
# Allow any additional origin from env (for custom domains)
extra_origin = os.getenv("ALLOWED_ORIGIN")
if extra_origin:
    allowed_origins.append(extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(load_balance.router)
app.include_router(short_circuit.router)
app.include_router(voltage_drop.router)
app.include_router(export.router)


@app.get("/")
async def root():
    return {"message": "MEDS API v0.1.0", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
