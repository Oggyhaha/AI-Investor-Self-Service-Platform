# Migrating AURA Database from SQLite to PostgreSQL

Thanks to the domain-driven repository pattern and SQLAlchemy 2.0 ORM abstraction, migrating the AURA self-service platform database from SQLite to PostgreSQL is simple and can be completed in a few steps.

## Step 1: Install PostgreSQL Client Libraries

Open a terminal in the `backend` folder, activate the virtual environment, and install `asyncpg` (for async execution) and `psycopg2-binary`:

```bash
# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install PostgreSQL drivers
pip install asyncpg psycopg2-binary
```

Add these to your `requirements.txt` to keep it updated:
```
asyncpg
psycopg2-binary
```

## Step 2: Create a PostgreSQL Database

Create a fresh database in your PostgreSQL instance (e.g., using pgAdmin or psql command line):

```sql
CREATE DATABASE aura_platform;
```

## Step 3: Update Environment Variables

Modify the `backend/.env` file. Replace the SQLite connection string with your PostgreSQL async connection URL:

```ini
# From (SQLite):
# APP_DATABASE_URL=sqlite+aiosqlite:///./aura_platform.db

# To (PostgreSQL):
APP_DATABASE_URL=postgresql+asyncpg://<username>:<password>@localhost:5432/aura_platform
```

Make sure to replace `<username>` and `<password>` with your actual PostgreSQL credentials.

## Step 4: Create Tables and Seed Demo Data

Because AURA uses SQLAlchemy's metadata model mapping, the application automatically handles table creations on database startup.

To recreate the schema and seed all the realistic demo datasets in your PostgreSQL database, simply run the database seed script:

```bash
python seed_data.py
```

You will see logging outputs detailing the `CREATE TABLE` statements executing on PostgreSQL, followed by the insertion logs:
```
Database successfully seeded with realistic mutual fund datasets.
```

## Step 5: Start the API Server

Run Uvicorn as normal:
```bash
uvicorn src.main:app --reload
```

AURA is now completely powered by PostgreSQL!
