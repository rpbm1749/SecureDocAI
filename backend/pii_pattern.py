PII_PATTERNS = {
    "EMAIL": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    
    "PHONE": r"\b(\+?\d{1,3}[\s-]?)?\d{10}\b",
    
    "AADHAAR": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
    
    "PASSPORT": r"\b[A-Z]{1}[0-9]{7}\b",
    
    "DOB": r"\b(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})\b"
}
