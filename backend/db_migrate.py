"""
Safe incremental migration — adds columns that exist in SQLAlchemy models
but may be missing from an existing database.

Run this instead of init_db.py when you want to keep existing data:

    cd backend
    python db_migrate.py

Each ALTER TABLE uses IF NOT EXISTS so the script is idempotent (safe to
run multiple times).
"""
from sqlalchemy import text
from app.database import engine


MIGRATIONS = [
    # requirements table
    "ALTER TABLE requirements ADD COLUMN IF NOT EXISTS custom_start_date TIMESTAMP",
    "ALTER TABLE requirements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE",

    # messages table
    "ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE messages ADD COLUMN IF NOT EXISTS requirement_id INTEGER REFERENCES requirements(id) ON DELETE SET NULL",
    "ALTER TABLE messages ADD COLUMN IF NOT EXISTS resource_id INTEGER REFERENCES resources(id) ON DELETE SET NULL",

    # resources table
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS availability_days INTEGER",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS experience_years INTEGER",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS resume_url VARCHAR(500)",

    # contracts table
    "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS description TEXT",

    # notifications table
    "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE",

    # subscriptions table
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE",
]


def run_migrations():
    with engine.connect() as conn:
        for sql in MIGRATIONS:
            try:
                conn.execute(text(sql))
                print(f"  OK : {sql[:70]}")
            except Exception as e:
                print(f"  SKIP ({e.__class__.__name__}): {sql[:70]}")
        conn.commit()
    print("\nMigration complete.")


if __name__ == "__main__":
    run_migrations()
