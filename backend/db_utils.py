from google.cloud import firestore
import os
from dotenv import load_dotenv
load_dotenv()
db = firestore.Client(project=os.getenv("GOOGLE_CLOUD_PROJECT"))

def save_metadata(filename, category, user_id):
    db.collection("documents").add({
        "filename": filename,
        "category": category,
        "user_id": user_id,
        "timestamp": firestore.SERVER_TIMESTAMP
    })
