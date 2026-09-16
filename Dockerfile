# Multi-stage Dockerfile: Builds React frontend & runs FastAPI backend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Install poetry
RUN pip install --no-cache-dir poetry && poetry config virtualenvs.create false

# Install backend dependencies
COPY pyproject.toml README.md ./
RUN poetry install --no-root --no-interaction --no-ansi

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/client/dist ./client/dist

EXPOSE 8000
ENV PORT=8000

CMD ["python", "-m", "backend.main"]
