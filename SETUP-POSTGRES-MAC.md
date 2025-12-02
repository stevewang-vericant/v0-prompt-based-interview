# Postgres Setup Guide (Mac without Docker)

Since you don't have Docker installed, the easiest way to run PostgreSQL locally on a Mac is using **Postgres.app** or **Homebrew**.

## Option A: Postgres.app (Easiest, Recommended)

1.  **Download & Install**:
    *   Go to [https://postgresapp.com/](https://postgresapp.com/) and download the latest version.
    *   Move it to your `Applications` folder and open it.

2.  **Initialize**:
    *   Click "Initialize" to create a new server.
    *   Ensure the status says "Running" (usually on port 5432).

3.  **Create Database**:
    *   Double click one of the default databases to open the terminal (psql).
    *   Run this SQL command to create your project database:
        ```sql
        CREATE DATABASE v0_interview;
        CREATE USER postgres WITH PASSWORD 'postgres';
        ALTER USER postgres WITH SUPERUSER;
        ```

## Option B: Homebrew (Command Line)

1.  **Install**:
    ```bash
    brew install postgresql@15
    ```

2.  **Start Service**:
    ```bash
    brew services start postgresql@15
    ```

3.  **Create Database**:
    ```bash
    createdb v0_interview
    createuser -s postgres
    ```

## Next Steps

Once Postgres is running (via either method), your current `.env` configuration will work:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/v0_interview"
```

You can then verify the connection by running:

```bash
npx prisma db push
```

