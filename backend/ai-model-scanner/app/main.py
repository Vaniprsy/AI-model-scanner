from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import scan, analyze_model, report

app = FastAPI(title="AI Model Scanner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router, prefix="/api")
app.include_router(analyze_model.router, prefix="/api")
app.include_router(report.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "AI Model Scanner API running"}
