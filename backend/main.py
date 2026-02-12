import sys
sys.stdout.reconfigure(line_buffering=True)
from auth_utils import save_metadata
import os
from datetime import datetime
from google.cloud import storage
from google.oauth2 import service_account
from crypto_utils import (
    generate_dh_keys,
    derive_file_key,
    encrypt_file_aes,
    encrypt_metadata_fields,
    serialize_public_key
)
from dotenv import load_dotenv
from ocr_utils import extract_text_from_bytes, extract_text_from_pdf_gcs
from classifier import classify_document

load_dotenv()
BUCKET_NAME = os.getenv("BUCKET_NAME")
creds = service_account.Credentials.from_service_account_file(
     os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
)

storage_client = storage.Client(
    credentials=creds,
    project=creds.project_id
)
bucket = storage_client.bucket(BUCKET_NAME)

def main():
    print("ENTRY: main() started", flush=True)
    if len(sys.argv) != 3:
        print("Usage: python app.py <file_path> <user_id>")
        sys.exit(1)

    file_path = sys.argv[1]
    user_id = sys.argv[2]

    print("STEP 1: args received", flush=True)

    if not os.path.exists(file_path):
        print("File does not exist:", file_path)
        sys.exit(1)

    filename = os.path.basename(file_path)
    filename_lower = filename.lower()

    with open(file_path, "rb") as f:
        raw_data = f.read()

    print("STEP 2: file read", flush=True)
    client_private, client_public = generate_dh_keys()

    if filename_lower.endswith((".png", ".jpg", ".jpeg")):
        extracted_text = extract_text_from_bytes(raw_data)

    elif filename_lower.endswith(".pdf"):
        # TEMP upload
        temp_blob = bucket.blob(f"temp/{filename}")
        temp_blob.upload_from_string(raw_data, content_type="application/pdf")

        extracted_text = extract_text_from_pdf_gcs(
            f"gs://{BUCKET_NAME}/temp/{filename}"
        )

        # Delete temp immediately
        temp_blob.delete()

    else:
        extracted_text = ""

    print("STEP 3: OCR done", flush=True)

    category = classify_document(extracted_text)

    encrypted_metadata, meta_iv = encrypt_metadata_fields(
        filename=filename,
        category=category,
        user_id=user_id
    )

    aes_key = derive_file_key(filename)
    encrypted_data, file_iv = encrypt_file_aes(raw_data, aes_key)

    encrypted_filename = f"{filename}.enc"
    client_pub_bytes = serialize_public_key(client_public)

    print("STEP 4: Encryption done", flush=True)

    file_blob = bucket.blob(
        f"documents/{user_id}/{encrypted_filename}"
    )

    file_blob.metadata = {
        "iv": file_iv.hex(),
        "client_pub": client_pub_bytes.decode()
    }

    file_blob.upload_from_string(encrypted_data, if_generation_match=0)
    file_blob.patch()
    print("STEP 5: Uploading to GCS...", flush=True)


    save_metadata(
        filename=filename,
        category=category,
        text=extracted_text[:1000],
        user_id = user_id
    )

    meta_blob = bucket.blob(
        f"documents/{user_id}/meta/{encrypted_filename}"
    )

    meta_blob.metadata = {
    "iv": meta_iv.hex()
    }

    meta_blob.upload_from_string(encrypted_metadata)
    meta_blob.patch()

    print("STEP 6: Upload complete", flush=True)

    print("SUCCESS: File and metadata encrypted and uploaded", flush=True)

    sys.exit(0)

if __name__ == "__main__":
    main()