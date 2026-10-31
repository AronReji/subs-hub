"""
Creates the first ADMIN account.

The API cannot create admins (that would let anyone become one), so the
first admin is created here, once, from the command line:

    ADMIN_EMAIL=admin@brightloop.test ADMIN_PASSWORD='Admin#12345' python -m app.auth.seed

It is safe to run repeatedly: if the email already exists nothing changes.
"""
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.models import User
from app.auth.password import hash_password, validate_password_strength
from app.database import Base, SessionLocal, engine
from app.enums import Role


def ensure_admin(
    db: Session, email: str, password: str, full_name: str = "Administrator"
) -> User:
    """Create the admin if missing and return it. Applies the same password rules as signup."""
    email = email.strip().lower()

    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        return existing

    problems = validate_password_strength(password)
    if problems:
        raise ValueError("Admin password " + "; ".join(problems) + ".")

    admin = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=Role.ADMIN,
        customer_id=None,   # admins are not tied to a customer
    )
    db.add(admin)
    db.commit()
    return admin


def seed_from_env() -> Optional[User]:
    """Read ADMIN_EMAIL / ADMIN_PASSWORD from the environment and ensure that admin exists."""
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    if not email or not password:
        return None
    with SessionLocal() as db:
        return ensure_admin(db, email, password)


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    admin = seed_from_env()
    print(f"Admin ready: {admin.email}" if admin else "Set ADMIN_EMAIL and ADMIN_PASSWORD first.")
