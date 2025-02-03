from sqlalchemy import create_engine, text
import os

# TODO: Load database URL from environment or replace with actual connection string
DATABASE_URL = "postgresql+psycopg2://postgres:vibhas69@34.71.48.54:5432/user_ratings_db"

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

query = text("""
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'embeddings';
""")

with engine.connect() as connection:
    result = connection.execute(query).fetchall()
    print(result)