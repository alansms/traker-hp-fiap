from sqlalchemy import inspect, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Definir engine local explicitamente
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ml_tracker"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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

if __name__ == "__main__":
    create_tables()
