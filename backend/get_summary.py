import sys
import json
import os
import tempfile
from google.cloud import storage
from crypto_utils import decrypt_file_aes, derive_file_key
from summarizer import summarize_text
from ocr_utils import extract_text_from_bytes, extract_text_from_pdf_gcs
from dotenv import load_dotenv

load_dotenv()
BUCKET_NAME = os.getenv("BUCKET_NAME")

def main():
    if len(sys.argv) != 3:
        print("Usage: python get_summary.py <user_id> <filename>")
        sys.exit(1)

    user_id = sys.argv[1]
    filename = sys.argv[2]

    try:
        # Initialize GCS client
        client = storage.Client()
        bucket = client.bucket(BUCKET_NAME)

        # Download encrypted file from GCS
        encrypted_blob_path = f"documents/{user_id}/{filename}.enc"
        blob = bucket.blob(encrypted_blob_path)
        
        if not blob.exists():
            print(json.dumps({"error": f"File not found: {filename}"}))
            sys.exit(1)

        # Get IV from blob metadata
        blob.reload()
        iv_hex = blob.metadata.get("iv") if blob.metadata else None
        if not iv_hex:
            print(json.dumps({"error": "IV not found in file metadata"}))
            sys.exit(1)

        # Download encrypted file
        encrypted_data = blob.download_as_bytes()
        file_iv = bytes.fromhex(iv_hex)

        try:
            # Decrypt file using the filename-based key
            key = derive_file_key(filename)
            decrypted_data = decrypt_file_aes(encrypted_data, key, file_iv)

            # Extract text based on file type
            filename_lower = filename.lower()
            extracted_text = ""

            if filename_lower.endswith((".png", ".jpg", ".jpeg")):
                extracted_text = extract_text_from_bytes(decrypted_data)
            
            elif filename_lower.endswith(".pdf"):
                # Save decrypted PDF to temp location
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
                    temp_pdf.write(decrypted_data)
                    temp_pdf_path = temp_pdf.name

                # Upload to GCS temp location for extraction
                temp_blob_path = f"temp/{user_id}_{filename}"
                temp_blob = bucket.blob(temp_blob_path)
                temp_blob.upload_from_string(decrypted_data, content_type="application/pdf")

                try:
                    extracted_text = extract_text_from_pdf_gcs(
                        f"gs://{BUCKET_NAME}/{temp_blob_path}"
                    )
                finally:
                    # Clean up temp blob
                    temp_blob.delete()
                    if os.path.exists(temp_pdf_path):
                        os.unlink(temp_pdf_path)
            
            else:
                print(json.dumps({"error": "Unsupported file type"}))
                sys.exit(1)

            # Generate summary
            if not extracted_text or len(extracted_text.strip()) == 0:
                print(json.dumps({"error": "Could not extract text from document"}))
                sys.exit(1)

            summary = summarize_text(extracted_text, max_sentences=3)

            print(json.dumps({
                "success": True,
                "summary": summary,
                "extracted_text": extracted_text[:500]  # First 500 chars for preview
            }))

        except Exception as e:
            print(json.dumps({"error": f"Processing failed: {str(e)}"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": f"Error: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
