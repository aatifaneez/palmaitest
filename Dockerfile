# Use the official Python slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies including gunicorn
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy the rest of the application code
COPY . .

# Add a non-root user and switch to it for better security
RUN adduser --disabled-password --gecos "" appuser
USER appuser

# Set environment variable for Flask port
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Run the app with gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
