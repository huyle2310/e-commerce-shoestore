@echo off
echo ================================
echo      DANG KHOI DONG VANGUARD
echo ================================
echo.
if "%1"=="build" (
    echo Dang tien hanh build va chay Docker...
    docker-compose up -d --build
) else if "%1"=="--build" (
    echo Dang tien hanh build va chay Docker...
    docker-compose up -d --build
) else (
    echo Dang tien hanh chay Docker...
    echo Neu ban muon build lai, hay chay: start.bat build
    docker-compose up -d
)

echo.
echo ==============================================
echo HE THONG DA KHOI DONG THANH CONG!
echo.
echo [Giao dien] http://localhost:3000
echo [API]       http://localhost:8080/api/v1
echo [Database]  localhost:5433
echo [Redis]     localhost:6379
echo.
echo De tat he thong, hay chay file stop.bat
echo ==============================================
pause
