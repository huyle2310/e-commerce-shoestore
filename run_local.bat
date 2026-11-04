@echo off
echo ==============================================
echo STARTING LVTN SYSTEM (WITHOUT DOCKER)
echo ==============================================
echo.
echo Note: Please ensure PostgreSQL (port 5433) and Redis (port 6379) are running!
echo.

echo Starting Backend (Spring Boot)...
start "Backend - Spring Boot" cmd /k "cd backend && mvn spring-boot:run"

echo Starting Frontend (Next.js)...
start "Frontend - Next.js" cmd /k "cd frontend && npm run dev"

echo.
echo ==============================================
echo The system is starting in new windows!
echo [Frontend URL] http://localhost:3000
echo [Backend API]  http://localhost:8080/api/v1
echo.
echo To stop the system, close the opened cmd windows.
echo ==============================================
pause
