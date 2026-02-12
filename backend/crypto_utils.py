from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives import serialization
import json
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
MASTER_SECRET = os.getenv("MASTER_SECRET").encode('utf-8')

def generate_dh_keys():
    private_key = ec.generate_private_key(ec.SECP384R1())
    public_key = private_key.public_key()
    return private_key, public_key

def derive_shared_key(private_key, peer_public_key):
    shared_secret = private_key.exchange(ec.ECDH(), peer_public_key)

    derived_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,   # AES-256
        salt=None,
        info=b'secure-doc-ai',
        backend=default_backend()
    ).derive(shared_secret)

    return derived_key

def serialize_public_key(public_key):
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

def deserialize_public_key(public_bytes):
    return serialization.load_pem_public_key(public_bytes)

def encrypt_file_aes(data, aes_key):
    iv = os.urandom(16)

    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(data) + padder.finalize()

    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv))
    encryptor = cipher.encryptor()

    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()

    return encrypted_data, iv

def decrypt_file_aes(encrypted_data, aes_key, iv):
    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv))
    decryptor = cipher.decryptor()

    padded_data = decryptor.update(encrypted_data) + decryptor.finalize()

    unpadder = padding.PKCS7(128).unpadder()
    data = unpadder.update(padded_data) + unpadder.finalize()

    return data

def encrypt_metadata_fields(
    filename: str,
    category: str,
    user_id: str,
):   
    metadata = {
        "filename": filename,
        "category": category,
        "user_id": user_id,
        "timestamp": datetime.now().isoformat(),
    }
    
    # Derive a stable key for metadata (per file)
    meta_key = derive_file_key(user_id)

    encrypted_metadata, iv = encrypt_file_aes(
        json.dumps(metadata).encode("utf-8"),
        meta_key
    )
    return encrypted_metadata, iv

def decrypt_metadata_fields(
    encrypted_metadata: bytes,
    user_id: str,
    iv: bytes,
):
    meta_key = derive_file_key(user_id)

    decrypted_json = decrypt_file_aes(
        encrypted_metadata,
        meta_key,
        iv
    )

    return json.loads(decrypted_json.decode("utf-8"))

def derive_file_key(filename: str) -> bytes:
    return HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=filename.encode(),
    ).derive(MASTER_SECRET)

def encrypt_metadata(metadata):
    meta_key = derive_file_key(metadata["user_id"])

    encrypted_metadata, iv = encrypt_file_aes(
        json.dumps(metadata).encode("utf-8"),
        meta_key
    )
    return encrypted_metadata, iv