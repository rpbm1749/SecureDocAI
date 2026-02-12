import re

def preprocess(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def classify_document(text: str) -> str:
    text = preprocess(text)

    if not text or len(text) < 20:
        return "Miscellaneous"

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

    cert_hits = sum(kw in text for kw in certificate_keywords)
    if cert_hits >= 2:
        return "Certificate"

    legal_keywords = [
        "agreement",
        "contract",
        "party",
        "parties",
        "hereby",
        "whereas",
        "terms and conditions",
        "governed by",
        "liability",
        "jurisdiction",
        "witness"
    ]

    if any(kw in text for kw in legal_keywords):
        return "Legal Document"
    # -----------------------------
    # 3️⃣ BILLS / INVOICES
    # -----------------------------
    bill_keywords = [
        "invoice",
        "bill",
        "total amount",
        "amount due",
        "tax",
        "gst",
        "subtotal",
        "payment",
        "balance",
        "receipt"
    ]

    if any(kw in text for kw in bill_keywords):
        return "Bill"

    id_keywords = [
        "aadhaar",
        "passport",
        "identity",
        "id number",
        "date of birth",
        "dob",
        "gender",
        "issued by",
        "government of",
        "authority"
    ]

    if any(kw in text for kw in id_keywords):
        return "ID"

    return "Miscellaneous"
