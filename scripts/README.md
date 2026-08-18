# Git Commit Scripts

This directory contains several scripts to simplify the git commit process for the Parliament Explorer project.

## Available Scripts

### 1. `commit.ps1` - Full-Featured Commit Script

A comprehensive PowerShell script with interactive options and full control over the commit process.

**Features:**
- Interactive commit type selection
- Build verification before commit
- Git status display
- Automatic file adding
- Optional push to remote
- PowerShell-safe commit messages

**Usage:**
```powershell
# Interactive mode
.\scripts\commit.ps1

# Quick commit with all options
.\scripts\commit.ps1 -Message "Add new feature" -Type "feat" -All

# Commit with build and push
.\scripts\commit.ps1 -Message "Fix bug" -Type "fix" -Build -Push

# Quick mode (skip prompts)
.\scripts\commit.ps1 -Message "Update docs" -Type "docs" -Quick
```

**Parameters:**
- `-Message`: Commit message
- `-Type`: Commit type (feat, fix, docs, style, refactor, test, chore, perf, ci)
- `-Quick`: Skip status check and prompts
- `-Push`: Push to remote after commit
- `-Build`: Run npm build before commit
- `-All`: Add all files, commit, build, and push
- `-Help`: Show help information

### 2. `quick-commit.ps1` - Simple PowerShell Script

A streamlined PowerShell script for quick commits.

**Usage:**
```powershell
# Basic usage
.\scripts\quick-commit.ps1 -Message "Add new component"

# Specify commit type
.\scripts\quick-commit.ps1 -Message "Fix authentication" -Type "fix"

# Commit without pushing
.\scripts\quick-commit.ps1 -Message "WIP: Working on feature" -Type "feat" -NoPush
```

### 3. `quick-commit.bat` - Batch Script Alternative

A simple batch script for environments where PowerShell execution is restricted.

**Usage:**
```cmd
# Basic usage
scripts\quick-commit.bat "Add new feature"

# With commit type
scripts\quick-commit.bat "Fix authentication" fix
```

## Commit Types

The scripts use conventional commit types:

- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without functionality changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates
- **perf**: Performance improvements
- **ci**: CI/CD pipeline changes

## Examples

### Common Scenarios

```powershell
# Feature development
.\scripts\commit.ps1 -Message "Add member speech modal" -Type "feat" -Build -Push

# Bug fix with quick mode
.\scripts\quick-commit.ps1 -Message "Fix modal positioning" -Type "fix"

# Documentation update
.\scripts\commit.ps1 -Message "Update API documentation" -Type "docs" -Quick -Push

# Emergency hotfix
.\scripts\quick-commit.bat "Fix critical security issue" fix
```

### Interactive Development Workflow

```powershell
# Full interactive mode - best for complex changes
.\scripts\commit.ps1
```

This will:
1. Show current git status
2. Prompt for commit type selection
3. Ask for commit message
4. Show changed files
5. Confirm file additions
6. Option to run build
7. Option to push to remote

## Notes

- All scripts handle PowerShell-specific syntax issues that can cause commit failures
- The scripts automatically add all changed files (you can modify this behavior)
- Build verification is optional but recommended for production commits
- Push operations include error handling and status reporting

## Troubleshooting

### PowerShell Execution Policy
If you get execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Git Configuration
Ensure git is configured:
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Line Ending Warnings
The scripts handle CRLF/LF conversion warnings automatically. If you see these warnings, they're normal on Windows.