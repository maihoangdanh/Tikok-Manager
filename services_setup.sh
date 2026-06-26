#!/bin/bash
set -e
cd ~/dm-manager

cat > backend/app/services/crypto.py << 'PYEOF'
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
PYEOF

cat > backend/app/middleware/auth.py << 'PYEOF'
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
PYEOF

echo "Services done"
