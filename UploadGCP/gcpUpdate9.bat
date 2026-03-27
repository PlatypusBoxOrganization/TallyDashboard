@echo off

REM Deploy the image to Google Cloud Run
gcloud run deploy numbersmanagerproSETdashboard --image gcr.io/numbersmanagerpro/numbersmanagerproSETdashboard --platform managed --region asia-east1 --allow-unauthenticated


pause
