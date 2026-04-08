from fastapi import APIRouter
from app.services.hf_service import fetch_model_data
from app.services.scanner import run_scan
from app.models.schemas import HFAnalyzeRequest, APIAnalyzeRequest

router = APIRouter()


@router.post("/analyze/huggingface")
async def analyze_huggingface(data: HFAnalyzeRequest):
    """Fetch a model from HuggingFace Hub and scan it."""
    content = fetch_model_data(data.model_id)

    result = run_scan({
        "text": content,
        "model_name": data.model_name or data.model_id,
        "scan_options": data.scan_options or {},
    })

    return result


@router.post("/analyze/api")
async def analyze_api_endpoint(data: APIAnalyzeRequest):
    """Scan a model exposed via an API endpoint."""
    result = run_scan({
        "api": data.endpoint,
        "model_name": data.model_name or data.endpoint,
        "scan_options": data.scan_options or {},
    })

    return result


# Keep backward-compat route
@router.post("/analyze-model")
async def analyze_model_legacy(data: dict):
    model_url = data.get("url", "")
    content = fetch_model_data(model_url)
    result = run_scan({
        "text": content,
        "model_name": model_url,
    })
    return result
