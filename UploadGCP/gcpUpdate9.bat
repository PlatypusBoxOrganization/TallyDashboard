@echo off

REM Deploy the image to Google Cloud Run
gcloud run deploy numbersmanagerpromssdashboard --image gcr.io/numbersmanagerpro/numbersmanagerpromssdashboard:latest --platform managed --region asia-east1 --allow-unauthenticated


pause
