FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install dependencies
# We copy from the current directory context (which will be py-logic)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend logic
COPY . .

# Run the worker process with unbuffered output
CMD ["python", "-u", "worker.py"]
