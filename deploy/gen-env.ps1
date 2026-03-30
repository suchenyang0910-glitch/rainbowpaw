$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$target = Join-Path $PSScriptRoot '.env.server'
$example = Join-Path $PSScriptRoot '.env.server.example'

if (Test-Path $target) {
  $existing = Get-Content -Raw -Encoding UTF8 $target
  $linesToAppend = @()
  if ($existing -notmatch '(?m)^AI_VL_MODEL=') { $linesToAppend += 'AI_VL_MODEL=' }
  if ($existing -notmatch '(?m)^AI_VOICE_MODEL=') { $linesToAppend += 'AI_VOICE_MODEL=' }
  if ($linesToAppend.Count -gt 0) {
    Add-Content -Encoding UTF8 -Path $target -Value ("`n" + ($linesToAppend -join "`n"))
  }
  Write-Output "SKIP: $target exists (ensured optional keys)"
  exit 0
}

if (-not (Test-Path $example)) {
  throw "找不到示例文件：$example"
}

function New-HexToken([int]$bytes) {
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $buffer = New-Object byte[] $bytes
  $rng.GetBytes($buffer)
  $rng.Dispose()
  return -join ($buffer | ForEach-Object { $_.ToString('x2') })
}

$internalToken = New-HexToken 32
$postgresPassword = New-HexToken 32

$content = Get-Content -Raw -Encoding UTF8 $example
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '^INTERNAL_TOKEN=.*$', "INTERNAL_TOKEN=$internalToken", [System.Text.RegularExpressions.RegexOptions]::Multiline)
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '^POSTGRES_PASSWORD=.*$', "POSTGRES_PASSWORD=$postgresPassword", [System.Text.RegularExpressions.RegexOptions]::Multiline)

[System.IO.File]::WriteAllText($target, $content, (New-Object System.Text.UTF8Encoding($false)))

$after = Get-Content -Raw -Encoding UTF8 $target
$linesToAppend = @()
if ($after -notmatch '(?m)^AI_VL_MODEL=') { $linesToAppend += 'AI_VL_MODEL=' }
if ($after -notmatch '(?m)^AI_VOICE_MODEL=') { $linesToAppend += 'AI_VOICE_MODEL=' }
if ($linesToAppend.Count -gt 0) {
  Add-Content -Encoding UTF8 -Path $target -Value ("`n" + ($linesToAppend -join "`n"))
}

Write-Output "OK: generated $target"
