@echo off
echo ========================================================
echo   TRANSact Guard - Production Platform Launcher
echo ========================================================

echo [1/2] Starting Backend Server (FastAPI + ML Engine)...
start "TRANSact Guard - Backend" cmd /k "cd backend && venv\Scripts\python run.py"

echo [2/2] Starting Frontend UI (React + Vite)...
start "TRANSact Guard - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   Services Launched!
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000/docs
echo   WebSocket: ws://localhost:8000/ws/transactions
echo ========================================================
pause
