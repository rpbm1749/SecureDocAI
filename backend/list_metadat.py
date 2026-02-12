import sys
import json
from google.cloud import storage
from crypto_utils import decrypt_metadata_fields
from dotenv import load_dotenv
import os

load_dotenv()
BUCKET_NAME = os.getenv("BUCKET_NAME")

def main():
    if len(sys.argv) != 2:
        print("Usage: python list_metadata.py <user_id>")
        sys.exit(1)

    user_id = sys.argv[1]

    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)

    prefix = f"documents/{user_id}/meta/"
    share_prefix = f"documents/{user_id}/meta/share/"

    blobs = bucket.list_blobs(prefix=prefix, delimiter="/")

    results = []

    for blob in blobs:
        # Skip share folder and any folder placeholder blobs
        if blob.name.startswith(share_prefix) or blob.name.endswith("/"):
            continue

        encrypted_metadata = blob.download_as_bytes()

        # Skip blobs without metadata or iv
        if not blob.metadata or "iv" not in blob.metadata:
            continue    

        iv_hex = blob.metadata["iv"]

        metadata = decrypt_metadata_fields(
            encrypted_metadata,
            user_id,
            bytes.fromhex(iv_hex)
        )

        results.append(metadata)

    # IMPORTANT: print JSON to stdout (Tauri reads this)
    print(json.dumps(results))

if __name__ == "__main__":
    main()
