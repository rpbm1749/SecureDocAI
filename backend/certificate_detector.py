def looks_like_certificate(text: str) -> bool:
    if not text:
        return False

    text_lower = text.lower()

    certificate_keywords = [
        "certificate",
        "this is to certify",
        "has successfully completed",
        "is hereby awarded",
        "date of issue",
        "authorized by",
        "issued on",
        "seal",
        "signature"
    ]

    matches = sum(1 for kw in certificate_keywords if kw in text_lower)

    # Strong assumption we agreed on
    return matches >= 2
