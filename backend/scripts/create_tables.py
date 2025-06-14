from sqlalchemy import inspect
import sys
import os

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import engine, Base, SessionLocal
from app.db.init_db import init_db

# Import all models to ensure they're registered with the Base metadata
from app.models.product import Product
from app.models.user import User
# Import any other model files here

def create_tables():
    # Print current tables in database
    inspector = inspect(engine)
    print("Current tables in database:")
    for table_name in inspector.get_table_names():
        print(f"  - {table_name}")

    # Create all tables
    print("\nCreating missing tables...")
    Base.metadata.create_all(bind=engine)

    # Check tables after creation
    inspector = inspect(engine)
    print("\nTables after creation:")
    for table_name in inspector.get_table_names():
        print(f"  - {table_name}")

    # Initialize database with default data
    print("\nInitializing database with default data...")
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()

    print("\nDatabase setup complete!")

if __name__ == "__main__":
    create_tables()
