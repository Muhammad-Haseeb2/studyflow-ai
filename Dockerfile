FROM python:3.10

WORKDIR /app

# Copy backend
COPY backend/ /app/

# Install Python dependencies
RUN pip install -r requirements.txt
RUN pip install gunicorn

# Copy frontend and build it
COPY frontend/ /app/frontend/
WORKDIR /app/frontend
RUN apt-get update && apt-get install -y nodejs npm
RUN npm install
RUN npm run build

# Move build to Django static
WORKDIR /app
RUN mkdir -p /app/static
RUN cp -r /app/frontend/build/* /app/static/

ENV PORT=8080

CMD exec gunicorn backend.wsgi:application --bind 0.0.0.0:8080
