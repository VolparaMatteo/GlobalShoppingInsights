from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

MIN_PASSWORD_LENGTH = 12

# Password troppo comuni / ovvie (match case-insensitive). Lista minima,
# copre i default storici di progetti simili.
_WEAK_PASSWORDS = {
    "password",
    "passw0rd",
    "admin",
    "admin123",
    "admin1234",
    "changeme",
    "letmein",
    "welcome",
    "welcome1",
    "qwerty",
    "qwerty123",
    "123456789012",
}


def _validate_password(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    if len(value) < MIN_PASSWORD_LENGTH:
        raise ValueError(
            f"Password troppo corta: sono richiesti almeno {MIN_PASSWORD_LENGTH} caratteri"
        )
    if value.strip() != value:
        raise ValueError("La password non può iniziare o terminare con spazi")
    if value.lower() in _WEAK_PASSWORDS:
        raise ValueError("Password troppo debole / comune — scegline una meno prevedibile")
    return value


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "contributor"

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        return _validate_password(v)  # type: ignore[return-value]


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: Optional[str]) -> Optional[str]:
        return _validate_password(v)


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
