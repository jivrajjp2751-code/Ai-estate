@echo off
echo Starting AI Estate Agent System...

:: Start Backend in a new window
start "Backend Server" cmd /k "cd server && npm run dev"

:: Wait a few seconds for backend to initialize
timeout /t 5

:: Start Frontend in a new window
start "Frontend App" cmd /k "npm run dev"

echo System started! 
echo Backend running on http://localhost:5000
echo Frontend running on http://localhost:8080
pause
