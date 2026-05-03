FROM python:3.10-slim

WORKDIR /app

# Install system deps + node
RUN apt-get update && apt-get install -y \
    nodejs npm \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy project
COPY . .

# Install backend deps
RUN pip install --no-cache-dir -r backend/requirements.txt
RUN pip install gunicorn

# Build frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Move build into backend
WORKDIR /app
RUN mkdir -p backend/static
RUN cp -r frontend/build/* backend/static/

# Move into backend
WORKDIR /app/backend

ENV PORT=8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "backend.wsgi:application"]
