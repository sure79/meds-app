@echo off
chcp 65001 >nul
title MEDS - Running Tests
color 0E

cd /d "%~dp0"

echo ============================================================
echo   MEDS - 백엔드 테스트 실행
echo ============================================================
echo.

cd apps\api
call venv\Scripts\activate
python -m pytest tests/ -v --tb=short

echo.
echo ============================================================
echo   테스트 완료
echo ============================================================
pause
