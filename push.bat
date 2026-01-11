@echo off
chcp 65001 >nul

echo.
echo   [1] feat     - them feature moi
echo   [2] fix      - sua bug
echo   [3] refactor - sua code khong doi logic
echo   [4] docs     - them/sua document
echo   [5] style    - sua css/ui
echo   [6] perf     - cai thien hieu nang
echo   [7] chore    - viec nho nhat khac
echo.

set /p type="Chon type (1-7): "

if "%type%"=="1" set prefix=feat
if "%type%"=="2" set prefix=fix
if "%type%"=="3" set prefix=refactor
if "%type%"=="4" set prefix=docs
if "%type%"=="5" set prefix=style
if "%type%"=="6" set prefix=perf
if "%type%"=="7" set prefix=chore

set /p desc="Mo ta ngan: "

git add .
git commit -m "%prefix%: %desc%"
git push --force

echo.
echo Done: %prefix%: %desc%
pause
