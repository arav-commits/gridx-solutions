FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source code (including the joblib model if needed later)
COPY price_data.py .
COPY worker.py .
COPY main.py .

# The worker reads env vars at runtime. Pass them via:
#   docker run -e NEXT_PUBLIC_SUPABASE_URL=... -e SUPABASE_SERVICE_ROLE_KEY=...
# Or use a .env file:
#   docker run --env-file ../.env.local ...

# Unbuffered output for real-time logging in Docker
ENV PYTHONUNBUFFERED=1

CMD ["python", "-u", "worker.py"]
