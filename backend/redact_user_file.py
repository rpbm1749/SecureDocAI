import sys
import json
import os
import tempfile
from google.cloud import storage
from crypto_utils import decrypt_file_aes, derive_file_key
from pdf_redactor import redact_pdf
from dotenv import load_dotenv

load_dotenv()
BUCKET_NAME = os.getenv("BUCKET_NAME")

def main():
    if len(sys.argv) != 4:
        print("Usage: python redact_user_file.py <user_id> <filename> <save_path>")
        sys.exit(1)

    user_id = sys.argv[1]
    filename = sys.argv[2]
    save_path = sys.argv[3]

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

            # Save to temp file for redaction
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_decrypted:
                temp_decrypted.write(decrypted_data)
                temp_decrypted_path = temp_decrypted.name

            # Redact the PDF
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_redacted:
                temp_redacted_path = temp_redacted.name

            redact_pdf(
                input_pdf_path=temp_decrypted_path,
                output_pdf_path=temp_redacted_path
            )

            # Read redacted file
            with open(temp_redacted_path, 'rb') as f:
                redacted_data = f.read()

            # Save to the specified location
            with open(save_path, 'wb') as f:
                f.write(redacted_data)

            # Create output filename for GCS backup
            base_name = os.path.splitext(filename)[0]
            output_filename = f"{base_name}_redacted.pdf"
            output_blob_path = f"documents/{user_id}/{output_filename}"
            
            # Also save to GCS as backup
            output_blob = bucket.blob(output_blob_path)
            output_blob.upload_from_string(redacted_data, content_type="application/pdf")

            # Clean up temp files
            os.unlink(temp_decrypted_path)
            os.unlink(temp_redacted_path)

            print(json.dumps({
                "success": True,
                "message": f"File redacted successfully and saved to {save_path}",
                "filename": output_filename
            }))

        except Exception as e:
            # Clean up temp files on error
            if 'temp_decrypted_path' in locals() and os.path.exists(temp_decrypted_path):
                os.unlink(temp_decrypted_path)
            if 'temp_redacted_path' in locals() and os.path.exists(temp_redacted_path):
                os.unlink(temp_redacted_path)
            
            print(json.dumps({"error": f"Redaction failed: {str(e)}"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": f"Error: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
