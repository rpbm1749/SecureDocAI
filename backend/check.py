import sys
import os

from crypto_utils import (
    derive_file_key,
    encrypt_file_aes,
    decrypt_file_aes
)

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_file_encrypt_decrypt_restore.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print("❌ File does not exist")
        sys.exit(1)

    filename = os.path.basename(file_path)
    name, ext = os.path.splitext(filename)

    print(f"📄 Original file: {filename}")

    # 1️⃣ Read original file
    with open(file_path, "rb") as f:
        original_data = f.read()

    print("✅ File read")

    # 2️⃣ Derive encryption key
    key = derive_file_key(filename)
    print("🔑 Key derived")

    # 3️⃣ Encrypt
    encrypted_data, iv = encrypt_file_aes(original_data, key)
    print("🔒 Encryption done")

    # 4️⃣ Decrypt
    decrypted_data = decrypt_file_aes(encrypted_data, key, iv)
    print("🔓 Decryption done")

    # 5️⃣ Verify byte integrity
    if original_data != decrypted_data:
        print("❌ FAILURE: Decrypted data does NOT match original")
        sys.exit(1)

    print("✅ Byte-level integrity confirmed")

    # 6️⃣ Write decrypted file back to disk
    restored_path = f"{name}_RESTORED{ext}"

    with open(restored_path, "wb") as f:
        f.write(decrypted_data)

    print(f"💾 Restored file written to: {restored_path}")
    print("🎉 File encryption → decryption → restore WORKS perfectly")

if __name__ == "__main__":
    main()
