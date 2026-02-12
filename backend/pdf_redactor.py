import fitz  # PyMuPDF
import re
from pii_pattern import PII_PATTERNS

def redact_pdf(
    input_pdf_path: str,
    output_pdf_path: str
):
    doc = fitz.open(input_pdf_path)

    for page in doc:
        page_text = page.get_text("text")

        for label, pattern in PII_PATTERNS.items():
            matches = re.findall(pattern, page_text)

            for match in matches:
                match_str = match if isinstance(match, str) else match[0]

                # Find where this text appears on the page
                text_instances = page.search_for(match_str)

                if not text_instances:
                    continue

                for inst in text_instances:
                    page.add_redact_annot(inst, fill=(0, 0, 0))

        # Apply all redactions on this page
        page.apply_redactions()

    doc.save(output_pdf_path)
    doc.close()
