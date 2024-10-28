FROM python:3.9-slim

WORKDIR /usr/src/app

COPY ./requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000


ARG ENV
ENV ENV=${ENV}

# Start Gunicorn with the number of workers equal to the available CPU cores
ENTRYPOINT ["sh", "-c"]

# Currently set to 4 workers - replace with  \"$(nproc)\" to use all available workers.
CMD ["exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app -b 0.0.0.0:8000 --forwarded-allow-ips='*' --timeout 60"]