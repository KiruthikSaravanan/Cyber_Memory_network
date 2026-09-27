from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core.security import hash_password, verify_password
from ..models import User
from ..schemas.auth import UserCreate


class DuplicateUserError(Exception):
    def __init__(self, field: str) -> None:
        self.field = field
        super().__init__(field)


def register_user(db: Session, payload: UserCreate) -> User:
    if db.scalar(
        select(User.id).where(func.lower(User.username) == payload.username)
    ):
        raise DuplicateUserError("Username")
    if db.scalar(select(User.id).where(func.lower(User.email) == payload.email)):
        raise DuplicateUserError("Email")

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateUserError("Username or email") from exc
    db.refresh(user)
    return user


def authenticate_user(
    db: Session, username_or_email: str, password: str
) -> User | None:
    identity = username_or_email.strip().lower()
    user = db.scalar(
        select(User).where(
            (func.lower(User.username) == identity)
            | (func.lower(User.email) == identity)
        )
    )
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user
