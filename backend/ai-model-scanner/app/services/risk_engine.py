WEIGHTS = {
    "Critical": 10,
    "High": 6,
    "Medium": 3,
    "Low": 1,
}

MAX_SCORE = 100


def calculate_risk(issues: list) -> tuple[int, str]:
    raw = sum(WEIGHTS.get(i.get("severity", "Low"), 1) for i in issues)

    # Normalize to 0-100
    score = min(raw * 4, 100)

    if score >= 70:
        level = "Critical"
    elif score >= 50:
        level = "High"
    elif score >= 25:
        level = "Medium"
    else:
        level = "Low"

    return score, level


def compute_security_metrics(issues: list) -> list:
    """Compute radar chart metrics from detected issues."""
    # Start with base scores
    metrics = {
        "Robustness": 80,
        "Privacy": 90,
        "Fairness": 85,
        "Transparency": 70,
        "Safety": 80,
        "Security": 85,
    }

    category_map = {
        "security": ["Robustness", "Security", "Safety"],
        "privacy": ["Privacy", "Transparency"],
        "bias": ["Fairness"],
        "compliance": ["Transparency", "Privacy"],
    }

    penalty = {"Critical": 20, "High": 12, "Medium": 6, "Low": 2}

    for issue in issues:
        cat = issue.get("category", "security")
        sev = issue.get("severity", "Low")
        affected_metrics = category_map.get(cat, ["Security"])
        for m in affected_metrics:
            metrics[m] = max(0, metrics[m] - penalty.get(sev, 2))

    return [{"metric": k, "score": v, "fullMark": 100} for k, v in metrics.items()]


def compute_compliance_checks(issues: list) -> list:
    """Generate compliance check results from scan findings."""
    has_privacy = any(i.get("category") == "privacy" for i in issues)
    has_bias = any(i.get("category") == "bias" for i in issues)
    has_critical = any(i.get("severity") == "Critical" for i in issues)
    has_security = any(i.get("category") == "security" for i in issues)
    has_compliance = any(i.get("category") == "compliance" for i in issues)

    return [
        {
            "name": "GDPR Compliance",
            "status": "fail" if has_privacy else "pass",
            "details": "PII detected in outputs without proper consent mechanisms"
            if has_privacy
            else "No obvious PII exposure detected",
        },
        {
            "name": "EU AI Act",
            "status": "warning" if has_critical else "pass",
            "details": "High-risk AI system - requires conformity assessment"
            if has_critical
            else "No critical risks identified",
        },
        {
            "name": "Model Card Documentation",
            "status": "warning",
            "details": "Model card completeness could not be verified from content alone",
        },
        {
            "name": "Bias & Fairness Testing",
            "status": "fail" if has_bias else "pass",
            "details": "Bias patterns detected in model content"
            if has_bias
            else "Fairness metrics within acceptable thresholds",
        },
        {
            "name": "Access Controls",
            "status": "warning" if has_security else "pass",
            "details": "Security vulnerabilities found - review access controls"
            if has_security
            else "No access control issues detected",
        },
        {
            "name": "Regulatory Compliance",
            "status": "fail" if has_compliance else "pass",
            "details": "Compliance gaps detected"
            if has_compliance
            else "No compliance issues detected",
        },
    ]
