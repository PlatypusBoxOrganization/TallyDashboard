@echo off

REM Deploy the image to Google Cloud Run
gcloud run deploy numbersmanagerprotallydashboard --image gcr.io/numbersmanagerpro/numbersmanagerprotallydashboard --platform managed --region asia-east1 --allow-unauthenticated


pause
