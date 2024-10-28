FROM python:3.9-slim

WORKDIR /app

# Copy requirements first
COPY requirements.docker.txt .
RUN pip install --no-cache-dir -r requirements.docker.txt

# Copy env files
COPY .env.docker .env.docker

# Copy the rest of the code
COPY . .

RUN pip install -e .

# Explicitly set environment variables from .env.docker
ENV $(cat .env.docker | xargs)

EXPOSE 8000

CMD ["uvicorn", "src.lexiclean.main:app", "--host", "0.0.0.0", "--port", "8000"]