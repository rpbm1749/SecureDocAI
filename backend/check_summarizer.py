from summarizer import summarize_text
import os
from ocr_utils import extract_text_from_bytes, extract_text_from_pdf_gcs
from dotenv import load_dotenv
from google.cloud import storage
from google.oauth2 import service_account

load_dotenv()
BUCKET_NAME = os.getenv("BUCKET_NAME")
creds = service_account.Credentials.from_service_account_file(
     os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
)
file_path = "C:\\Users\\ragha\\Downloads\\overnight-hackathon (A4).pdf"
filename = os.path.basename(file_path)
filename_lower = filename.lower()
storage_client = storage.Client(
    credentials=creds,
    project=creds.project_id
)
bucket = storage_client.bucket(BUCKET_NAME)
with open(file_path, "rb") as f:
    raw_data = f.read()

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

summary = summarize_text(extracted_text, max_sentences=3)
print("SUMMARY:")
print(summary)