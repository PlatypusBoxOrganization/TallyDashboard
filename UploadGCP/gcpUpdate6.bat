@echo off

REM Build the Docker image
docker build --no-cache -t numbersmanagerprosetdashboard .
docker tag numbersmanagerprosetdashboard gcr.io/numbersmanagerpro/numbersmanagerprosetdashboard:latest



pause
