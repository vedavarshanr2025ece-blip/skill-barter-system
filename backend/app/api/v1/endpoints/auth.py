"""Auth endpoints: register and login."""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.dependencies import get_db
from app.core import security
from app.core.config import settings
from app.crud.crud import create_user, get_user_by_email, get_user_by_username
from app.schemas.schemas import Token, UserCreate, UserOut

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db = Depends(get_db)):
    """Create a new user account with a signup credit bonus."""
    if await get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered.")
    if await get_user_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="Username already taken.")
        
    user = await create_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db = Depends(get_db),
):
    """Authenticate with username + password, return JWT access token."""
    user = await get_user_by_username(db, form_data.username)
    if not user or not security.verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(
        subject=str(user["id"]),
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}
