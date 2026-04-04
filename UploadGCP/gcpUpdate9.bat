@echo off

REM Deploy the image to Google Cloud Run
gcloud run deploy numbersmanagerprosetdashboard --image gcr.io/numbersmanagerpro/numbersmanagerprosetdashboard --platform managed --region asia-east1 --allow-unauthenticated


pause
