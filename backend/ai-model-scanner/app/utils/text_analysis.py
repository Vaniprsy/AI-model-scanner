SENSITIVE_KEYWORDS = {
    "password": {"severity": "Critical", "category": "privacy", "cvss": 8.5},
    "passwd": {"severity": "Critical", "category": "privacy", "cvss": 8.5},
    "secret": {"severity": "High", "category": "privacy", "cvss": 7.8},
    "api_key": {"severity": "Critical", "category": "security", "cvss": 9.0},
    "api key": {"severity": "Critical", "category": "security", "cvss": 9.0},
    "private key": {"severity": "Critical", "category": "security", "cvss": 9.2},
    "access token": {"severity": "High", "category": "security", "cvss": 8.0},
    "admin": {"severity": "Medium", "category": "security", "cvss": 5.5},
    "token": {"severity": "High", "category": "security", "cvss": 7.5},
    "ssn": {"severity": "Critical", "category": "privacy", "cvss": 9.0},
    "social security": {"severity": "Critical", "category": "privacy", "cvss": 9.0},
    "credit card": {"severity": "Critical", "category": "privacy", "cvss": 9.1},
    "date of birth": {"severity": "High", "category": "privacy", "cvss": 7.0},
    "pii": {"severity": "High", "category": "privacy", "cvss": 7.5},
    "sql injection": {"severity": "Critical", "category": "security", "cvss": 9.3},
    "exec(": {"severity": "Critical", "category": "security", "cvss": 9.5},
    "eval(": {"severity": "High", "category": "security", "cvss": 8.0},
    "os.system": {"severity": "Critical", "category": "security", "cvss": 9.5},
    "subprocess": {"severity": "High", "category": "security", "cvss": 8.2},
    "bias": {"severity": "Medium", "category": "bias", "cvss": 5.0},
    "discriminat": {"severity": "High", "category": "bias", "cvss": 6.5},
    "stereotyp": {"severity": "Medium", "category": "bias", "cvss": 5.5},
    "unfair": {"severity": "Low", "category": "bias", "cvss": 3.5},
    "copyright": {"severity": "Medium", "category": "compliance", "cvss": 4.5},
    "proprietary": {"severity": "Low", "category": "compliance", "cvss": 3.0},
    "confidential": {"severity": "High", "category": "compliance", "cvss": 7.0},
    "health data": {"severity": "Critical", "category": "compliance", "cvss": 9.0},
    "medical record": {"severity": "Critical", "category": "compliance", "cvss": 9.0},
}

OWASP_CATEGORY_DESCRIPTIONS = {
    "LLM01": "Prompt Injection",
    "LLM02": "Insecure Output Handling",
    "LLM03": "Training Data Poisoning",
    "LLM04": "Model Denial of Service",
    "LLM05": "Supply Chain Vulnerabilities",
    "LLM06": "Sensitive Information Disclosure",
    "LLM07": "Insecure Plugin Design",
    "LLM08": "Excessive Agency",
    "LLM09": "Overreliance",
    "LLM10": "Model Theft",
}


def keyword_scan(text: str) -> list:
    findings = []
    text_lower = text.lower()
    seen = set()

    for word, meta in SENSITIVE_KEYWORDS.items():
        if word in text_lower and word not in seen:
            seen.add(word)
            findings.append({
                "type": "Sensitive Keyword Exposure",
                "severity": meta["severity"],
                "category": meta["category"],
                "cvss": meta["cvss"],
                "title": f"Sensitive Data Pattern: '{word}'",
                "description": f"Detected sensitive keyword '{word}' in model content.",
                "impact": "Potential data leakage or security misconfiguration.",
                "recommendation": f"Remove or mask '{word}' from model inputs, outputs, and training data.",
                "owasp": "LLM06",
                "affected": "Model input/output layer",
            })

    return findings
