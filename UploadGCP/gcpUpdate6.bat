@echo off

REM Build the Docker image
docker build --no-cache -t numbersmanagerproSETdashboard .
docker tag numbersmanagerproSETdashboard gcr.io/numbersmanagerpro/numbersmanagerproSETdashboard:latest



pause
