@echo off

REM Deploy the image to Google Cloud Run
gcloud run deploy wavesfrontenddev --image gcr.io/waves-431708/wavesfrontenddev --platform managed --region asia-south1 --allow-unauthenticated


pause
