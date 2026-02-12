import sys
import os
from google.cloud import storage
from crypto_utils import derive_file_key, decrypt_file_aes
from dotenv import load_dotenv

load_dotenv()
BUCKET_NAME = os.getenv("BUCKET_NAME")

def main():
    if len(sys.argv) != 4:
        print("Usage: python download_user_file.py <user_id> <filename> <save_path>")
        sys.exit(1)

    user_id = sys.argv[1]
    filename = sys.argv[2]
    save_path = sys.argv[3]

    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)

    # 1️⃣ Download encrypted file
    file_blob = bucket.blob(f"documents/{user_id}/{filename}.enc")
    file_blob.reload()
    file_iv = bytes.fromhex(file_blob.metadata["iv"])
    encrypted_data = file_blob.download_as_bytes()

    # 2️⃣ Fetch IV from metadata blob
    meta_blob = bucket.blob(f"documents/{user_id}/meta/{filename}.enc")
    meta_blob.reload()

    if not meta_blob.metadata or "iv" not in meta_blob.metadata:
        raise Exception("IV not found in metadata")

    # 3️⃣ Decrypt
    key = derive_file_key(filename)
    decrypted = decrypt_file_aes(
        encrypted_data,
        key,
        file_iv
    )

    _, ext = os.path.splitext(filename)
    if not os.path.splitext(save_path)[1]:
        save_path = save_path + ext
    # 4️⃣ Save file
    with open(save_path, "wb") as f:
        f.write(decrypted)

    print("DOWNLOAD_SUCCESS")

if __name__ == "__main__":
    main()
