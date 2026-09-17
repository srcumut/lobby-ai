# ============================================================================
# TARGET_DESTINATION: v2/merge.ps1
# PURPOSE: PowerShell script to automatically merge v2 files into root project
# ============================================================================

param (
    [switch]$Force = $false
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Lobby AI v2 Merge Tool" -ForegroundColor Cyan
Write-Host " Merging files from: $ScriptDir" -ForegroundColor Gray
Write-Host " Into project root:  $ProjectRoot" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

$ManifestPath = Join-Path $ScriptDir "MANIFEST.json"
if (-not (Test-Path $ManifestPath)) {
    Write-Error "MANIFEST.json not found in $ScriptDir"
    exit 1
}

$Manifest = Get-Content -Raw $ManifestPath | ConvertFrom-Json

if (-not $Force) {
    $Confirmation = Read-Host "Proceed with copying $($Manifest.files.Count) files into the project? (y/n)"
    if ($Confirmation -ne 'y' -and $Confirmation -ne 'Y') {
        Write-Host "Merge aborted by user." -ForegroundColor Yellow
        exit 0
    }
}

$CopiedCount = 0

foreach ($item in $Manifest.files) {
    $SourceFile = Join-Path $ProjectRoot $item.source
    $TargetFile = Join-Path $ProjectRoot $item.target
    $TargetDir  = Split-Path -Parent $TargetFile

    if (-not (Test-Path $SourceFile)) {
        Write-Warning "Source file missing: $SourceFile"
        continue
    }

    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    }

    Copy-Item -Path $SourceFile -Destination $TargetFile -Force
    Write-Host "[$($item.action)] $($item.target)" -ForegroundColor Green
    $CopiedCount++
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Successfully merged $CopiedCount files into the project!" -ForegroundColor Green
Write-Host " You can now run 'cargo check' in backend and 'npm run build' in frontend." -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
