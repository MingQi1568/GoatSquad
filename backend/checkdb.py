from sqlalchemy import create_engine, text
import os

# Get the database password from the environment variable
DB_PASS = os.environ.get("DB_PASS")
if DB_PASS is None:
    raise ValueError("The DB_PASS environment variable is not set.")

# Construct the DATABASE_URL using the password from the environment variable
DATABASE_URL = f"postgresql+psycopg2://postgres:{DB_PASS}@34.71.48.54:5432/user_ratings_db"

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
