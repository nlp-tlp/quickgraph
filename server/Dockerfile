FROM python:3.10-slim

WORKDIR /app

# Upgrade pip
RUN pip install --upgrade pip

# Copy requirements first
COPY requirements.txt .
# Remove any -e entries from requirements before installing
RUN grep -v '^-e' requirements.txt > requirements.cleaned.txt
RUN pip install --no-cache-dir -r requirements.cleaned.txt

# Copy env files
COPY .env.docker .env.docker

# Copy the rest of the code
COPY . .
RUN pip install -e .

# Explicitly set environment variables from .env.docker
ENV $(cat .env.docker | xargs)
EXPOSE 8000
CMD ["uvicorn", "src.quickgraph.main:app", "--host", "0.0.0.0", "--port", "8000"]
