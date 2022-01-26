FROM python:3.9

COPY ./requirements.txt ./requirements.txt

RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY . .

# Executed via python app.py as uvicorn is in __main__
CMD ["python", "app.py"]
