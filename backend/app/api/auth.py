from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.middleware.auth import verify_password, create_access_token, hash_password
from app.config import settings

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    hashed = hash_password(settings.admin_password)
    if req.email != settings.admin_email or not verify_password(req.password, hashed):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": req.email})
    return TokenResponse(access_token=token)
