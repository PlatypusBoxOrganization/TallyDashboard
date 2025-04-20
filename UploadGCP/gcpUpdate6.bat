@echo off

REM Build the Docker image
docker build --no-cache -t numbersmanagerprotallydashboard .
docker tag numbersmanagerprotallydashboard gcr.io/numbersmanagerpro/numbersmanagerprotallydashboard:latest



pause
