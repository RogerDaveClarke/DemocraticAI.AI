@echo off
REM Simple batch script for git commits (alternative to PowerShell)
REM Usage: quick-commit.bat "commit message" [type]

setlocal enabledelayedexpansion

if "%1"=="" (
    echo Error: Commit message is required
    echo Usage: quick-commit.bat "commit message" [type]
    echo Example: quick-commit.bat "Add new feature" feat
    exit /b 1
)

set "message=%~1"
set "type=%2"

if not "%type%"=="" (
    set "full_message=%type%: %message%"
) else (
    set "full_message=%message%"
)

echo Adding all files...
git add .

echo Committing with message: !full_message!
git commit -m "!full_message!"

if errorlevel 1 (
    echo Commit failed!
    exit /b 1
)

echo Commit successful!

REM Ask if user wants to push
set /p push_choice="Push to remote? (y/N): "
if /i "!push_choice!"=="y" (
    echo Pushing to remote...
    git push
    if errorlevel 1 (
        echo Push failed!
        exit /b 1
    )
    echo Push successful!
)

echo Done!