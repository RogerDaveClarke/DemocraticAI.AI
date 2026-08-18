# Git Commit Helper Script for Parliament Explorer
# Handles PowerShell-specific syntax issues and provides interactive commit options

param(
    [string]$Message = "",
    [string]$Type = "feat",
    [switch]$Quick = $true,
    [switch]$Push = $true,
    [switch]$Build,
    [switch]$All,
    [switch]$Interactive,
    [switch]$Help
)

function Show-Help {
    Write-Host "Git Commit Helper Script" -ForegroundColor Green
    Write-Host "========================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\commit.ps1 [-Message 'commit message'] [-Type 'commit type'] [-Interactive] [-Build] [-Help]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Message      : Commit message (if not provided, auto-generates based on changes)"
    Write-Host "  -Type         : Commit type (default: 'feat') - feat, fix, docs, style, refactor, test, chore"
    Write-Host "  -Interactive  : Enable interactive mode with prompts (default: non-interactive)"
    Write-Host "  -Push         : Push to remote after commit (default: true)"
    Write-Host "  -Build        : Run build before commit (default: false)"
    Write-Host "  -All          : Add all files, commit, build, and push"
    Write-Host "  -Help         : Show this help message"
    Write-Host ""
    Write-Host "Default Behavior (No Questions Asked):"
    Write-Host "  - Automatically adds all files"
    Write-Host "  - Uses 'feat' as commit type"
    Write-Host "  - Auto-generates commit message based on changes"
    Write-Host "  - Commits and pushes to remote"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\commit.ps1                                          # Quick commit with auto-generated message"
    Write-Host "  .\commit.ps1 -Message 'Add new feature'              # Quick commit with custom message"
    Write-Host "  .\commit.ps1 -Message 'Fix bug' -Type 'fix'          # Quick commit with type and message"
    Write-Host "  .\commit.ps1 -Interactive                            # Interactive mode with prompts"
    Write-Host "  .\commit.ps1 -Build -All                             # Build, commit, and push everything"
    exit
}

function Get-CommitType {
    Write-Host "Select commit type:" -ForegroundColor Yellow
    Write-Host "1. feat     - New feature"
    Write-Host "2. fix      - Bug fix"
    Write-Host "3. docs     - Documentation"
    Write-Host "4. style    - Code style changes"
    Write-Host "5. refactor - Code refactoring"
    Write-Host "6. test     - Adding tests"
    Write-Host "7. chore    - Maintenance tasks"
    Write-Host "8. perf     - Performance improvements"
    Write-Host "9. ci       - CI/CD changes"
    
    do {
        $choice = Read-Host "Enter choice (1-9)"
        switch ($choice) {
            "1" { return "feat" }
            "2" { return "fix" }
            "3" { return "docs" }
            "4" { return "style" }
            "5" { return "refactor" }
            "6" { return "test" }
            "7" { return "chore" }
            "8" { return "perf" }
            "9" { return "ci" }
            default { Write-Host "Invalid choice. Please enter 1-9." -ForegroundColor Red }
        }
    } while ($true)
}

function Test-GitRepository {
    if (-not (Test-Path ".git")) {
        Write-Host "Error: Not a git repository. Please run this script from the project root." -ForegroundColor Red
        exit 1
    }
}

function Show-GitStatus {
    Write-Host "Current git status:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
}

function Run-Build {
    Write-Host "Running build..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed! Do you want to continue? (y/N)" -ForegroundColor Red
        $continue = Read-Host
        if ($continue.ToLower() -ne "y") {
            exit 1
        }
    } else {
        Write-Host "Build successful!" -ForegroundColor Green
    }
}

function Add-Files {
    param([switch]$All)
    
    if ($All -or $Quick -or -not $Interactive) {
        Write-Host "Adding all files..." -ForegroundColor Yellow
        git add .
    } else {
        Show-GitStatus
        Write-Host "Add all files? (Y/n)" -ForegroundColor Yellow
        $addAll = Read-Host
        if ($addAll.ToLower() -ne "n") {
            git add .
        } else {
            Write-Host "Please add files manually with 'git add <file>' then run this script again."
            exit
        }
    }
}

function Get-CommitMessage {
    param([string]$Type)
    
    if ([string]::IsNullOrEmpty($Message)) {
        if ($Interactive) {
            if ([string]::IsNullOrEmpty($Type)) {
                $Type = Get-CommitType
            }
            
            Write-Host "Enter commit message (without type prefix):" -ForegroundColor Yellow
            $userMessage = Read-Host
            
            if ([string]::IsNullOrEmpty($userMessage)) {
                Write-Host "Commit message cannot be empty!" -ForegroundColor Red
                exit 1
            }
            
            return "${Type}: $userMessage"
        } else {
            # Auto-generate message based on git status
            $status = git status --porcelain
            $newFiles = ($status | Where-Object { $_ -match "^A " }).Count
            $modifiedFiles = ($status | Where-Object { $_ -match "^M " }).Count
            $deletedFiles = ($status | Where-Object { $_ -match "^D " }).Count
            
            if ($newFiles -gt 0 -and $modifiedFiles -eq 0 -and $deletedFiles -eq 0) {
                $autoMessage = "Add new files and features"
            } elseif ($modifiedFiles -gt 0 -and $newFiles -eq 0 -and $deletedFiles -eq 0) {
                $autoMessage = "Update existing functionality"
            } elseif ($deletedFiles -gt 0) {
                $autoMessage = "Remove and cleanup files"
            } else {
                $autoMessage = "Update project files"
            }
            
            return "${Type}: $autoMessage"
        }
    } else {
        if (-not [string]::IsNullOrEmpty($Type)) {
            return "${Type}: $Message"
        }
        return $Message
    }
}

function Commit-Changes {
    param([string]$CommitMessage)
    
    Write-Host "Committing with message: $CommitMessage" -ForegroundColor Yellow
    
    # Use simple commit message to avoid PowerShell parsing issues
    git commit -m $CommitMessage
    
    if ($LASTEXITCODE -eq 0) {
        $commitHash = git rev-parse --short HEAD
        Write-Host "Commit successful! Hash: $commitHash" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Commit failed!" -ForegroundColor Red
        return $false
    }
}

function Push-Changes {
    Write-Host "Pushing to remote..." -ForegroundColor Yellow
    git push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Push successful!" -ForegroundColor Green
    } else {
        Write-Host "Push failed!" -ForegroundColor Red
        exit 1
    }
}

# Main script execution
if ($Help) {
    Show-Help
}

# Verify we're in a git repository
Test-GitRepository

Write-Host "Parliament Explorer - Git Commit Helper" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Handle -All flag
if ($All) {
    $Quick = $true
    $Build = $true
    $Push = $true
    $Interactive = $false
}

# Set non-interactive mode unless explicitly requested
if (-not $Interactive) {
    $Quick = $true
}

# Run build if requested
if ($Build) {
    Run-Build
}

# Show status unless quick mode
if (-not $Quick -and $Interactive) {
    Show-GitStatus
}

# Add files
Add-Files -All:$Quick

# Get commit message
$commitMessage = Get-CommitMessage -Type $Type

# Commit changes
$commitSuccess = Commit-Changes -CommitMessage $commitMessage

if ($commitSuccess -and $Push) {
    Push-Changes
}

Write-Host ""
Write-Host "Git operations completed!" -ForegroundColor Green

# Show final status
if (-not $Quick -and $Interactive) {
    Write-Host ""
    Write-Host "Final status:" -ForegroundColor Cyan
    git status --short
}