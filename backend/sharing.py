import sys
import os
import traceback
from pathlib import Path
from google.cloud import storage
from dotenv import load_dotenv

USER_1 = "FQvHMEXmkXMWM8kAFg4gZBo8qAr1"
USER_2 = "62l7q2fMLQT5zEj4g8tVHM1GRHn2"

def die(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)

def main():
    if len(sys.argv) != 3:
        die("Usage: python sharing.py <user_id> <filename>")

    user_id = sys.argv[1]
    filename = sys.argv[2]

    # Load env safely
    base_dir = Path(__file__).resolve().parent
    load_dotenv(base_dir / ".env")

    BUCKET_NAME = os.getenv("BUCKET_NAME")
    if not BUCKET_NAME:
        die("BUCKET_NAME not set")

    # Decide source & destination users
    if user_id == USER_1:
        source_user, dest_user = USER_1, USER_2
    elif user_id == USER_2:
        source_user, dest_user = USER_2, USER_1
    else:
        die("Invalid user_id")

    try:
        client = storage.Client()
        bucket = client.bucket(BUCKET_NAME)

        # -------- COPY FILE --------
        src_file = f"documents/{source_user}/{filename}.enc"
        dst_file = f"documents/{dest_user}/shared/{filename}.enc"

        bucket.copy_blob(
            bucket.blob(src_file),
            bucket,
            dst_file
        )

        # -------- COPY METADATA --------
        src_meta = f"documents/{source_user}/meta/{filename}.enc"
        dst_meta = f"documents/{dest_user}/meta/shared/{filename}.enc"

        bucket.copy_blob(
            bucket.blob(src_meta),
            bucket,
            dst_meta
        )

        print("SUCCESS: File and metadata shared")

    except Exception:
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
