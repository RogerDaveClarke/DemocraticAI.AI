param(
    [Parameter(Mandatory = $true)]
    [string]$Destination
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    if (git status --porcelain) { throw 'Commit or stash all changes before exporting the clean tree' }
    if (git status --porcelain) { throw 'Commit or stash all changes before exporting the clean tree' }
    npm run check:clone-isolation
    if ($LASTEXITCODE -ne 0) { throw 'Clone isolation check failed' }
    if (Test-Path $Destination) { throw "Destination already exists: $Destination" }
    New-Item -ItemType Directory -Path $Destination | Out-Null
    git archive HEAD | tar -x -C $Destination
    if (Test-Path (Join-Path $Destination '.env.production')) { throw 'Export unexpectedly contains .env.production' }
    Write-Host "Clean source tree exported to $Destination"
} finally {
    Pop-Location
}
