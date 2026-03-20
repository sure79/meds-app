@echo off
chcp 65001 >nul
title MEDS - Running Dev Servers
color 0A

cd /d "%~dp0"

echo ============================================================
echo   MEDS - Marine Electrical Design Suite
echo   개발 서버 실행 중...
echo ============================================================
echo.
echo   프론트엔드: http://localhost:5173
echo   백엔드 API: http://localhost:8000/docs
echo.
echo   종료하려면 Ctrl+C 를 누르세요
echo ============================================================
echo.

REM 백엔드 시작 (별도 창)
if exist apps\api\venv\Scripts\activate.bat (
    start "MEDS-API" cmd /k "cd /d %~dp0apps\api && call venv\Scripts\activate.bat && python -m uvicorn main:app --reload --port 8000"
) else (
    echo [경고] Python 백엔드 없이 프론트엔드만 실행합니다.
)

REM 2초 대기
timeout /t 2 /nobreak >nul

REM 브라우저 열기
start http://localhost:5173

REM 프론트엔드 시작 (이 창에서 직접 실행 - 닫히지 않음)
cd apps\web
call npx vite

pause
