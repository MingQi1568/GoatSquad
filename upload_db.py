import pandas as pd
from sqlalchemy import create_engine

# Define database connection parameters
DB_USER = 'postgres'        # Replace with your database username
DB_PASSWORD = 'PW'    # Replace with your database password
DB_HOST = '34.71.48.54'         # Replace with your database host (e.g., <instance>.cloudsql.<region>.gcp)
DB_PORT = '5432'                 # Default PostgreSQL port
DB_NAME = 'user_ratings_db'   # Replace with your database name

# Construct the database connection string
db_url = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create a database engine
engine = create_engine(db_url)

# Load the CSV file into a pandas DataFrame
# file_path = 'mlb_highlights_2019-2024.csv'  # Path to your CSV file
file_path = 'mlb_highlights_2019-2024_players.csv'
df = pd.read_csv(file_path)

# Define the table name in the database
table_name = 'mlb_highlights_players'

# Upload the DataFrame to the database
try:
    # Append data to the table, creating the table if it doesn't exist
    df.to_sql(table_name, con=engine, if_exists='replace', index=False)
    print(f"Data successfully uploaded to the '{table_name}' table in the '{DB_NAME}' database.")
except Exception as e:
    print(f"An error occurred while uploading the data: {e}")
