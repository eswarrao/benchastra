"""
Database initialisation script.
Run once to drop all tables and recreate them with fresh test data.

Usage:
    cd backend
    python init_db.py
"""
from sqlalchemy import text
from app.database import SessionLocal, engine, Base

# Import every model so SQLAlchemy's metadata is fully populated before
# drop_all / create_all — missing imports cause silent schema gaps.
from app.models import (
    OTP, Company, User, Requirement, Resource, Match,
    Contract, Invoice, Message, Notification, Subscription,
    resource_skills,
)
from app.auth import get_password_hash

# Drop all tables in the correct FK order using CASCADE so no
# foreign-key constraint errors during teardown.
with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
    conn.commit()

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    test_client = User(
        email="client@test.com",
        hashed_password=get_password_hash("BenchAstra@2025"),
        full_name="Test Client",
        phone="+91 98765 43219",
        role="client",
        is_active=True,
        is_verified=True,
    )
    db.add(test_client)

    test_vendor = User(
        email="vendor@test.com",
        hashed_password=get_password_hash("BenchAstra@2025"),
        full_name="Test Vendor",
        phone="+91 98765 43220",
        role="vendor",
        is_active=True,
        is_verified=True,
        vendor_name="Test Vendor Solutions",
    )
    db.add(test_vendor)

    db.commit()

    print("Database initialised successfully!")
    print("\nTest credentials:")
    print("  Client : client@test.com / BenchAstra@2025")
    print("  Vendor : vendor@test.com / BenchAstra@2025")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
