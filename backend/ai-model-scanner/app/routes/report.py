from fastapi import APIRouter, HTTPException
from app.services.scanner import REPORT_STORE

router = APIRouter()


@router.get("/report/{scan_id}")
async def get_report(scan_id: str):
    """Retrieve a previously generated scan report by ID."""
    report = REPORT_STORE.get(scan_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{scan_id}' not found")
    return report


@router.get("/reports")
async def list_reports():
    """List all stored reports (summary only)."""
    summaries = []
    for scan_id, report in REPORT_STORE.items():
        summaries.append({
            "id": scan_id,
            "model_name": report.get("model_name"),
            "scan_date": report.get("scan_date"),
            "risk_score": report.get("risk_score"),
            "status": report.get("status"),
            "vulnerabilities": report.get("vulnerabilities"),
        })
    # Sort newest first (UUID v4 is random, so use insertion order via dict)
    return list(reversed(summaries))


@router.post("/report")
async def generate_report_legacy(data: dict):
    """Legacy report endpoint."""
    return {
        "summary": f"Model risk is {data.get('severity')} with score {data.get('risk_score')}",
        "details": data,
    }
