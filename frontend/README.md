# AI Model Scanner — Full Stack Setup

## Project Structure
```
ai-model-scanner/   ← FastAPI backend
frontend/           ← React + Vite frontend
```

---

## 1. Start the Backend

```bash
cd ai-model-scanner
./start.sh
# OR manually:
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**

API endpoints:
- `POST /api/scan`                  — Upload file or paste text
- `POST /api/analyze/huggingface`   — Scan any HuggingFace model
- `POST /api/analyze/api`           — Scan a model API endpoint
- `GET  /api/report/{scan_id}`      — Fetch a scan report
- `GET  /api/reports`               — List all reports

---

## 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## How it works

| Frontend Action | Backend Call |
|---|---|
| Upload file on New Scan | `POST /api/scan` (multipart) |
| Enter HuggingFace ID | `POST /api/analyze/huggingface` |
| Enter API endpoint | `POST /api/analyze/api` |
| View report page | `GET /api/report/{id}` |
| Dashboard loads scans | `GET /api/reports` |

---

## Scan Capabilities

The scanner checks for:
- **OWASP LLM Top 10** — Prompt injection (LLM01), data leakage (LLM06), system prompt extraction (LLM07), training data poisoning (LLM03)
- **Sensitive keyword detection** — passwords, API keys, PII, secrets, tokens, SSNs, credit cards
- **Bias patterns** — racial bias, discriminatory language, stereotypes
- **Compliance** — GDPR, EU AI Act, model documentation gaps

All detected issues come with: severity, CVSS score, OWASP category, impact description, and remediation steps.
