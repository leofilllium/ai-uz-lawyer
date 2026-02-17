"""
Migration script to add validation_data column to generated_contracts table.
This column stores ultra mode validation details (hidden_risks, ambiguities, etc.)
"""

import os
import sys
from sqlalchemy import create_engine, text
from app.config import get_settings


def migrate_generated_contracts():
    """Add validation_data column to generated_contracts table if it doesn't exist."""
    print("Starting generated_contracts table migration...")

    settings = get_settings()
    engine = create_engine(settings.database_url)

    with engine.connect() as conn:
        print("Adding validation_data column...")

        try:
            # Add validation_data JSON column
            conn.execute(text(
                "ALTER TABLE generated_contracts ADD COLUMN IF NOT EXISTS validation_data JSON DEFAULT '{}'"
            ))
            print("✓ Successfully added/verified 'validation_data' column.")
        except Exception as e:
            print(f"Error adding 'validation_data': {e}")

        conn.commit()

    print("Migration complete!")


if __name__ == "__main__":
    # Ensure app directory is in python path
    sys.path.append(os.getcwd())
    migrate_generated_contracts()
