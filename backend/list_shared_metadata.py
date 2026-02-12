import sys
import os
import json
import traceback
from pathlib import Path
from google.cloud import storage
from dotenv import load_dotenv

def die(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)

def main():
    if len(sys.argv) != 2:
        die("Usage: python list_shared_metadata.py <user_id>")

    user_id = sys.argv[1]

    base_dir = Path(__file__).resolve().parent
    load_dotenv(base_dir / ".env")

    BUCKET_NAME = os.getenv("BUCKET_NAME")
    if not BUCKET_NAME:
        die("BUCKET_NAME not set")

    try:
        client = storage.Client()
        bucket = client.bucket(BUCKET_NAME)

        prefix = f"documents/{user_id}/meta/shared/"
        blobs = bucket.list_blobs(prefix=prefix)

        results = []

        for blob in blobs:
            filename = blob.name.split("/")[-1].replace(".enc", "")

            # NO DECRYPTION
            # metadata content is ignored intentionally
            results.append({
                "filename": filename,
                "category": "Shared"
            })

        print(json.dumps(results))

    except Exception:
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
