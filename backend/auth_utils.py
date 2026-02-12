import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv
from google.cloud import firestore
load_dotenv()
# Initialize Firebase Admin ONLY ONCE
cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS_PATH"))
firebase_admin.initialize_app(cred)
db = firestore.Client(project="securedocai")
def save_metadata(filename, category, text, user_id):
    db.collection("documents").add({
        "filename": filename,
        "category": category,
        "extracted_text": text[:1000],  # limit size
        "user_id": user_id,
        "timestamp": firestore.SERVER_TIMESTAMP
    })


def verify_token(id_token):
    decoded = auth.verify_id_token(id_token)
    return decoded["uid"]
