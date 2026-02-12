import re
from pii_pattern import PII_PATTERNS

REDACTION_TOKEN = "████████"

def redact_text(text: str) -> str:
    if not text:
        return text

    redacted = text

    for label, pattern in PII_PATTERNS.items():
        redacted = re.sub(pattern, REDACTION_TOKEN, redacted)

    return redacted
