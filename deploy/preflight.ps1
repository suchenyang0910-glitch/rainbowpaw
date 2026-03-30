$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$envFile = Join-Path $PSScriptRoot '.env.server'
$exampleFile = Join-Path $PSScriptRoot '.env.server.example'

function Fail([string]$message) {
  Write-Error $message
  exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Fail 'Missing command: docker'
}

try {
  docker info 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'docker info failed'
  }
} catch {
  Fail 'Docker daemon not ready: start Docker Desktop (or start docker service on Linux)'
}

if (-not (Test-Path $envFile)) {
  if (Test-Path $exampleFile) {
    Fail "Missing $envFile. Run: powershell -ExecutionPolicy Bypass -File deploy\gen-env.ps1"
  }
  Fail "Missing $envFile and example file $exampleFile"
}

function Get-EnvValue([string]$key) {
  $pattern = "^$([Regex]::Escape($key))=(.*)$"
  $value = $null
  foreach ($line in Get-Content -Encoding UTF8 $envFile) {
    if ($line -match $pattern) {
      $value = $Matches[1]
    }
  }
  if ($null -eq $value) {
    return ''
  }
  return $value.Trim()
}

$internalToken = Get-EnvValue 'INTERNAL_TOKEN'
$aiMockMode = Get-EnvValue 'AI_MOCK_MODE'
$aiBaseUrl = Get-EnvValue 'AI_BASE_URL'
$aiApiKey = Get-EnvValue 'AI_API_KEY'
$domain = Get-EnvValue 'DOMAIN'
$publicWebBaseUrl = Get-EnvValue 'PUBLIC_WEB_BASE_URL'
$viteApiBaseUrl = Get-EnvValue 'VITE_API_BASE_URL'

if ([string]::IsNullOrWhiteSpace($internalToken) -or $internalToken -eq 'change-me') {
  Fail "INTERNAL_TOKEN is missing or still 'change-me' in $envFile"
}

if ($aiMockMode -ne 'true') {
  if ([string]::IsNullOrWhiteSpace($aiBaseUrl)) {
    Fail 'AI_BASE_URL required when AI_MOCK_MODE=false'
  }
  if ([string]::IsNullOrWhiteSpace($aiApiKey)) {
    Fail 'AI_API_KEY required when AI_MOCK_MODE=false'
  }
}

if ([string]::IsNullOrWhiteSpace($domain) -or $domain -eq 'your-domain.com') {
  Write-Warning "DOMAIN not set or still 'your-domain.com'. For HTTPS(Caddy), set DOMAIN to your real domain (e.g. rainbowpaw.org)"
}

if (-not [string]::IsNullOrWhiteSpace($publicWebBaseUrl) -and $publicWebBaseUrl -match 'your-domain\.com') {
  Write-Warning "PUBLIC_WEB_BASE_URL still contains 'your-domain.com'. Set it to your real domain (e.g. https://rainbowpaw.org)"
}

if (-not [string]::IsNullOrWhiteSpace($viteApiBaseUrl) -and $viteApiBaseUrl -match 'your-domain\.com') {
  Write-Warning "VITE_API_BASE_URL still contains 'your-domain.com'. Set it to your real domain (e.g. https://rainbowpaw.org)"
}

Write-Output 'OK: Docker daemon ready; required env vars look good'
