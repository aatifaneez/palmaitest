# Use the official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy app code and requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set environment variable for Flask
ENV PORT=8080

# Expose the port Cloud Run expects
EXPOSE 8080

# Run the app
CMD ["python", "app.py"]
