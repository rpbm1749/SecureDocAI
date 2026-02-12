from flask import Flask, render_template, request
from google.cloud import storage
from crypto_utils import generate_dh_keys, derive_shared_key, encrypt_file_aes, decrypt_file_aes , serialize_public_key , deserialize_public_key , derive_file_key
from flask import send_file
import io
from functools import wraps
from flask import request
from auth_utils import verify_token
from ocr_utils import extract_text_from_bytes,extract_text_from_pdf_gcs
from classifier import classify_document
from db_utils import save_metadata
from dotenv import load_dotenv
import os

load_dotenv()
BUCKET_NAME = os.getenv("BUCKET_NAME")
app = Flask(__name__)


storage_client = storage.Client()  #client init()
bucket = storage_client.bucket(BUCKET_NAME)

SERVER_PRIVATE_KEY, SERVER_PUBLIC_KEY = generate_dh_keys()

def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return "Unauthorized", 401
        try:
            uid = verify_token(token)
            request.user_id = uid
        except Exception as e:
            return "Invalid or expired token", 401
        return func(*args, **kwargs)
    return wrapper

#associate files with user IDs in Firestore

# save_metadata(
#     filename=file.filename,
#     category="document",
#     text="encrypted",
#     user_id=request.user_id
# )

@app.route("/")
def index():
    return render_template("upload.html")

@app.route("/upload", methods=["POST"])
@require_auth
def upload_file():
    file = request.files["file"]
    raw_data = file.read()

    
    client_private, client_public = generate_dh_keys() #client key

    aes_key = derive_file_key(file.filename)
    encrypted_data, iv = encrypt_file_aes(raw_data, aes_key)
    decrypted_data = decrypt_file_aes(encrypted_data, aes_key, iv)
    # filename = file.filename()
    filename_lower = file.filename.lower()

    
    if filename_lower.endswith((".png", ".jpg", ".jpeg")):
       extracted_text = extract_text_from_bytes(decrypted_data)

    elif filename_lower.endswith(".pdf"):

    # 1️⃣ Upload TEMP plaintext PDF
         temp_blob = bucket.blob("temp/" + file.filename)
         temp_blob.upload_from_string(raw_data, content_type="application/pdf")

    # 2️⃣ OCR from temp GCS PDF
         extracted_text = extract_text_from_pdf_gcs(
        f"gs://{BUCKET_NAME}/temp/{file.filename}"
        )

    # 3️⃣ Delete temp PDF immediately
         temp_blob.delete()

    else:
       extracted_text = ""
    
    # try:
    #    extracted_text = extract_text_from_bytes(raw_data)
    # except Exception as e:
    #    extracted_text = ""
    
    category = classify_document(extracted_text)
    
    save_metadata(
    filename=file.filename,
    category=category,
    text=extracted_text[:1000],
    user_id=request.user_id
)
    
    client_pub_bytes = serialize_public_key(client_public)

    blob = bucket.blob(file.filename + ".enc")
    blob.metadata = {"iv": iv.hex(), "client_pub": client_pub_bytes.decode()}
    # blob.metadata = {"iv": iv.hex()}
    blob.upload_from_string(encrypted_data)
    blob.patch()

    return "File encrypted and uploaded securely"

@app.route("/download/<filename>")
def download_file(filename):

    client_private, client_public = generate_dh_keys()
    blob = bucket.get_blob(filename + ".enc") #access doc from cloud
    
    if not blob:
      return "File not found", 404
    
    metadata = blob.metadata #metadata access
    
    if not metadata or "iv" not in metadata:
        return "IV metadata missing. Please re-upload the file.", 400

    iv = bytes.fromhex(blob.metadata["iv"]) #IV from metadata
    
    # client_pub_bytes = metadata["client_pub"].encode() #required to gain access to metadata
    # client_public = deserialize_public_key(client_pub_bytes)

    # aes_key = derive_shared_key(SERVER_PRIVATE_KEY, client_public)
    
    aes_key = derive_file_key(filename)

    encrypted_data = blob.download_as_bytes()
    decrypted_data = decrypt_file_aes(encrypted_data, aes_key, iv)
       
    return send_file(
        io.BytesIO(decrypted_data),
        download_name=filename,
        as_attachment=True
    )
    

if __name__ == "__main__":
    app.run(debug=True)

