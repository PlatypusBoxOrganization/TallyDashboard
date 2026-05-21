@echo off

REM Build the Docker image
docker build --no-cache -t numbersmanagerpromssdashboard .
docker tag numbersmanagerpromssdashboard gcr.io/numbersmanagerpro/numbersmanagerpromssdashboard:latest



pause
