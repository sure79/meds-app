@echo off
chcp 65001 >nul
title MEDS - Marine Electrical Design Suite Setup
color 0B

echo ============================================================
echo   MEDS - Marine Electrical Design Suite
echo   선박 전기계통 설계 소프트웨어 설치 및 실행
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/5] Node.js 확인 중...
where node >nul 2>&1
if errorlevel 1 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org 에서 설치하세요.
    pause
    exit /b 1
)
node -v
npm -v

echo.
echo [2/5] 루트 의존성 설치 중...
call npm install
if errorlevel 1 (
    echo [오류] 루트 npm install 실패.
    pause
    exit /b 1
)

echo.
echo [3/5] 프론트엔드 의존성 설치 중...
cd apps\web
call npm install
if errorlevel 1 (
    echo [오류] 프론트엔드 npm install 실패.
    pause
    exit /b 1
)
cd ..\..

echo.
echo [4/5] Python 확인 중...
where python >nul 2>&1
if errorlevel 1 (
    echo [경고] Python이 없습니다. 백엔드 없이 프론트엔드만 실행합니다.
    echo 프론트엔드만 시작합니다...
    cd apps\web
    call npx vite
    pause
    exit /b 0
)
python --version

echo.
echo [5/5] 백엔드 설치 중...
cd apps\api
if not exist venv (
    python -m venv venv
)
call venv\Scripts\pip install -r requirements.txt
if errorlevel 1 (
    echo [경고] pip install 실패. 프론트엔드만 실행합니다.
    cd ..\..
    cd apps\web
    call npx vite
    pause
    exit /b 0
)
cd ..\..

echo.
echo ============================================================
echo   설치 완료! 서버를 시작합니다...
echo ============================================================
echo.

call "%~dp0run.bat"
pause
