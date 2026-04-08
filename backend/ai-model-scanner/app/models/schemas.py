from pydantic import BaseModel
from typing import Optional


class ScanRequest(BaseModel):
    model_name: str = "custom-input"
    text: Optional[str] = None
    api: Optional[str] = None
    scan_options: Optional[dict] = {
        "dataLeakage": True,
        "promptInjection": True,
        "dependencies": True,
        "bias": True,
        "compliance": True,
    }


class HFAnalyzeRequest(BaseModel):
    model_id: str
    model_name: Optional[str] = None
    scan_options: Optional[dict] = {}


class APIAnalyzeRequest(BaseModel):
    endpoint: str
    model_name: Optional[str] = None
    scan_options: Optional[dict] = {}
