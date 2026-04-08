from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from app.services.scanner import run_scan

router = APIRouter()


@router.post("/scan")
async def scan_input(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    model_name: Optional[str] = Form("uploaded-model"),
    scan_options_json: Optional[str] = Form(None),
):
    """
    Scan a model by uploading a file or providing raw text.
    Optionally pass scan_options as a JSON string in the form.
    """
    import json

    scan_options = {
        "dataLeakage": True,
        "promptInjection": True,
        "dependencies": True,
        "bias": True,
        "compliance": True,
    }
    if scan_options_json:
        try:
            scan_options = json.loads(scan_options_json)
        except Exception:
            pass

    content = ""
    if file:
        file_bytes = await file.read()
        content = file_bytes.decode(errors="ignore")[:5000]
    elif text:
        content = text

    result = run_scan({
        "text": content,
        "model_name": model_name or "uploaded-model",
        "scan_options": scan_options,
    })

    return result
