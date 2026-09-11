@echo off
REM Secure batch script for git commits (alternative to PowerShell)
REM Usage: quick-commit.bat "commit message" [type] [--push]

setlocal enabledelayedexpansion

if "%1"=="" (
    echo Error: Commit message is required
    echo Usage: quick-commit.bat "commit message" [type]
    echo Example: quick-commit.bat "Add new feature" feat
    exit /b 1
)

set "message=%~1"
set "type=%2"
set "push=%3"

if not "%type%"=="" (
    set "full_message=%type%: %message%"
) else (
    set "full_message=%message%"
)

echo Adding all files...
git add .

echo Running repository security verification...
npm run verify:repo-security
if errorlevel 1 (
    echo Security verification failed. Commit aborted; staged files were not committed.
    exit /b 1
)

echo Committing with message: !full_message!
git commit -m "!full_message!"

if errorlevel 1 (
    echo Commit failed!
    exit /b 1
)

echo Commit successful!

if /i "%push%"=="--push" (
    echo Pushing to remote...
    git push
    if errorlevel 1 (
        echo Push failed!
        exit /b 1
    )
    echo Push successful!
)

if /i not "%push%"=="--push" (
    echo No push performed. Use --push as the third argument to push.
)

echo Done!