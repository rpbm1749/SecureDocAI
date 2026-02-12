import sys
import json
import os
from google.cloud import storage
from dotenv import load_dotenv

load_dotenv()
BUCKET_NAME = os.getenv("BUCKET_NAME")

def main():
    if len(sys.argv) != 3:
        print("Usage: python delete_user_file.py <user_id> <filename>")
        sys.exit(1)

    user_id = sys.argv[1]
    filename = sys.argv[2]

    try:
        # Initialize GCS client
        client = storage.Client()
        bucket = client.bucket(BUCKET_NAME)

        # Delete encrypted file
        file_blob_path = f"documents/{user_id}/{filename}.enc"
        file_blob = bucket.blob(file_blob_path)
        
        if not file_blob.exists():
            print(json.dumps({"error": f"File not found: {filename}"}))
            sys.exit(1)

        # Delete metadata file
        meta_blob_path = f"documents/{user_id}/meta/{filename}.enc"
        meta_blob = bucket.blob(meta_blob_path)

        try:
            # Delete both files
            file_blob.delete()
            meta_blob.delete()

            print(json.dumps({
                "success": True,
                "message": f"File '{filename}' deleted successfully"
            }))

        except Exception as e:
            print(json.dumps({"error": f"Deletion failed: {str(e)}"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": f"Error: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
