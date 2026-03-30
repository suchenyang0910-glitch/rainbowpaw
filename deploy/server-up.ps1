$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

$envFile = 'deploy/.env.server'
if (-not (Test-Path $envFile)) {
  throw "Missing $envFile. Run: powershell -ExecutionPolicy Bypass -File deploy\gen-env.ps1"
}

docker compose --env-file $envFile `
  -f deploy/docker-compose.server.yml `
  -f deploy/docker-compose.server.http.yml `
  up -d --build

if ($LASTEXITCODE -ne 0) {
  throw "docker compose failed (exit $LASTEXITCODE)"
}
