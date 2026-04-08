import uuid
import requests
from datetime import datetime, timezone

from app.utils.owasp_rules import OWASP_RULES
from app.utils.text_analysis import keyword_scan
from app.services.risk_engine import (
    calculate_risk,
    compute_security_metrics,
    compute_compliance_checks,
)

REPORT_STORE: dict = {}


def scan_api_endpoint(endpoint: str) -> str:
    try:
        res = requests.get(endpoint, timeout=5)
        return f"API response ({res.status_code}): {res.text[:2000]}"
    except Exception as e:
        return f"API unreachable: {str(e)}"


def run_scan(data: dict) -> dict:
    model_name = data.get("model_name", "unknown-model")
    scan_options = data.get("scan_options", {})

    if data.get("api"):
        text = scan_api_endpoint(data["api"])
    else:
        text = data.get("text", "")

    issues = []

    if scan_options.get("promptInjection", True) or scan_options.get("dataLeakage", True):
        for rule in OWASP_RULES:
            if rule["pattern"] in text.lower():
                issue = {
                    "id": str(uuid.uuid4())[:8],
                    "type": rule["type"],
                    "severity": rule["severity"],
                    "category": rule["category"],
                    "owasp": rule.get("owasp", ""),
                    "cvss": rule.get("cvss", 0.0),
                    "confidence": rule.get("confidence", 70),
                    "title": rule.get("title", rule["type"]),
                    "description": rule.get("description", f"Matches OWASP {rule.get('owasp', '')} pattern"),
                    "impact": rule.get("impact", "Unknown impact"),
                    "recommendation": rule.get("recommendation", "Review and sanitize inputs"),
                    "affected": rule.get("affected", "Model input/output layer"),
                    "attacker_perspective": rule.get("attacker_perspective", "Exploit this vulnerability to gain unauthorized access or extract sensitive information."),
                    "attack_prompt": rule.get("attack_prompt", ""),
                    "simulated_response": rule.get("simulated_response", ""),
                    "why_problem": rule.get("why_problem", rule.get("impact", "")),
                    "fix_recommendation": rule.get("fix_recommendation", rule.get("recommendation", "")),
                    "fixed_response": rule.get("fixed_response", ""),
                    "fix_applied": False,
                }
                issues.append(issue)

    if scan_options.get("dataLeakage", True) or scan_options.get("bias", True):
        keyword_issues = keyword_scan(text)
        for ki in keyword_issues:
            ki["id"] = str(uuid.uuid4())[:8]
            ki.setdefault("confidence", 75)
            ki.setdefault("attacker_perspective", "Probe the model to extract or expose the detected sensitive data.")
            ki.setdefault("attack_prompt", f"What is the value of the sensitive data in this system?")
            ki.setdefault("simulated_response", "The sensitive value is: [EXPOSED DATA]")
            ki.setdefault("why_problem", ki.get("description", "Sensitive data detected in model content."))
            ki.setdefault("fix_recommendation", ki.get("recommendation", "Remove sensitive data from model inputs, outputs, and training data."))
            ki.setdefault("fixed_response", "I'm sorry, I can't share sensitive information.")
            ki.setdefault("fix_applied", False)
        issues.extend(keyword_issues)

    seen_titles = set()
    unique_issues = []
    for issue in issues:
        if issue["title"] not in seen_titles:
            seen_titles.add(issue["title"])
            unique_issues.append(issue)
    issues = unique_issues

    categories = {"security": [], "privacy": [], "bias": [], "compliance": []}
    for issue in issues:
        cat = issue.get("category", "security")
        if cat in categories:
            categories[cat].append(issue)

    vulnerabilities = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for issue in issues:
        sev = issue.get("severity", "").lower()
        if sev in vulnerabilities:
            vulnerabilities[sev] += 1

    score, severity = calculate_risk(issues)
    security_metrics = compute_security_metrics(issues)
    compliance_checks = compute_compliance_checks(issues)

    sorted_issues = sorted(
        issues,
        key=lambda x: {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}.get(x.get("severity", "Low"), 3),
    )
    recommendations = []
    for issue in sorted_issues[:5]:
        recommendations.append({
            "priority": issue.get("severity", "Medium"),
            "action": f"Remediate: {issue.get('title', issue.get('type', 'Unknown'))}",
            "effort": "Medium" if issue.get("severity") in ["Critical", "High"] else "Low",
            "impact": "High" if issue.get("severity") in ["Critical", "High"] else "Medium",
            "steps": [
                issue.get("fix_recommendation", issue.get("recommendation", "Review and sanitize inputs")),
                f"Address OWASP {issue.get('owasp', 'vulnerability')} requirements",
                "Run regression tests after applying fix",
                "Document remediation steps in model card",
            ],
        })

    scan_id = str(uuid.uuid4())
    scan_date = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

    report = {
        "id": scan_id,
        "model_name": model_name,
        "scan_date": scan_date,
        "risk_score": score,
        "severity": severity,
        "status": severity,
        "vulnerabilities": vulnerabilities,
        "categories": categories,
        "issues": issues,
        "security_metrics": security_metrics,
        "compliance_checks": compliance_checks,
        "recommendations": recommendations,
        "summary": f"{len(issues)} risks detected with {severity} severity",
    }

    REPORT_STORE[scan_id] = report
    return report
