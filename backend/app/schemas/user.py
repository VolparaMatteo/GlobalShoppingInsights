from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

MIN_PASSWORD_LENGTH = 12

# Password troppo comuni / ovvie (match case-insensitive). Lista minima,
# copre i default storici di progetti simili. Include valori >=12 char
# così che scattino PRIMA del check lunghezza.
_WEAK_PASSWORDS = {
    # corte (vengono in realtà rigettate dal check di lunghezza — le teniamo
    # qui per documentazione)
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
    # >= 12 caratteri ma comunissime / prevedibili
    "password1234",
    "password12345",
    "123456789012",
    "1234567890123",
    "qwerty123456",
    "iloveyou1234",
    "welcome12345",
    "admin12345678",
    "changeme1234",
    "letmein12345",
}


def _validate_password(value: str | None) -> str | None:
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
    email: EmailStr | None = None
    name: str | None = None
    password: str | None = None
    role: str | None = None
    is_active: bool | None = None

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str | None) -> str | None:
        return _validate_password(v)


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    avatar_url: str | None = None
    last_login: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserSelfUpdate(BaseModel):
    """Schema per self-update via PATCH /users/me.

    - name: libero
    - email: libero (ma controllo unicità nell'endpoint)
    - current_password: obbligatorio se new_password è presente
    - new_password: opzionale; se presente, validato con policy standard
    """

    name: str | None = None
    email: EmailStr | None = None
    current_password: str | None = None
    new_password: str | None = None

    @field_validator("new_password")
    @classmethod
    def _check_new_password(cls, v: str | None) -> str | None:
        return _validate_password(v)
