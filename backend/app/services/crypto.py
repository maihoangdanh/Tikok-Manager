import json
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os, binascii
from app.config import settings

def _key() -> bytes:
    return binascii.unhexlify(settings.encryption_key)

def encrypt_credentials(data: dict) -> str:
    nonce = os.urandom(12)
    ct = AESGCM(_key()).encrypt(nonce, json.dumps(data).encode(), None)
    return (nonce + ct).hex()

def decrypt_credentials(hex_data: str) -> dict:
    raw = bytes.fromhex(hex_data)
    nonce, ct = raw[:12], raw[12:]
    plain = AESGCM(_key()).decrypt(nonce, ct, None)
    return json.loads(plain)
