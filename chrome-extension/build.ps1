# build.ps1 - Packages the Chrome Extension for deployment

$ExtensionDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ZipPath = Join-Path (Split-Path $ExtensionDir -Parent) "public\qa-data-studio-extension.zip"

Write-Host "Packaging QA Data Studio Chrome Extension..." -ForegroundColor Cyan

# Ensure the public directory exists
$PublicDir = Join-Path (Split-Path $ExtensionDir -Parent) "public"
if (-not (Test-Path $PublicDir)) {
    New-Item -ItemType Directory -Force -Path $PublicDir | Out-Null
}

# Remove old zip if it exists
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

# Compress the contents of the chrome-extension directory
Compress-Archive -Path "$ExtensionDir\*" -DestinationPath $ZipPath -Force

Write-Host "Extension successfully packaged to: $ZipPath" -ForegroundColor Green
Write-Host "This file is now available for download via the Next.js public directory!" -ForegroundColor Yellow

