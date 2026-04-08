import requests


def fetch_model_data(model_id_or_url: str) -> str:
    """Fetch model metadata from HuggingFace Hub."""
    # Strip URL prefix if given
    if "huggingface.co/" in model_id_or_url:
        model_id = model_id_or_url.split("huggingface.co/")[-1].strip("/")
    else:
        model_id = model_id_or_url.strip()

    api_url = f"https://huggingface.co/api/models/{model_id}"
    try:
        res = requests.get(api_url, timeout=10)
    except Exception as e:
        return f"Failed to fetch model: {str(e)}"

    if res.status_code != 200:
        return f"Model '{model_id}' not found on HuggingFace Hub (status {res.status_code})"

    data = res.json()

    description = ""
    card_data = data.get("cardData") or {}
    if isinstance(card_data, dict):
        description = card_data.get("description", "") or ""

    tags = " ".join(data.get("tags", []))
    pipeline = data.get("pipeline_tag", "")
    library = data.get("library_name", "")

    # Include model card README if available
    readme_url = f"https://huggingface.co/{model_id}/raw/main/README.md"
    readme_text = ""
    try:
        readme_res = requests.get(readme_url, timeout=5)
        if readme_res.status_code == 200:
            readme_text = readme_res.text[:3000]
    except Exception:
        pass

    combined = f"{description} {tags} {pipeline} {library} {readme_text}"
    return combined.strip() or f"Model: {model_id}"
