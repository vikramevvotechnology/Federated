# Renders the social sharing image and the phone home-screen icon from their HTML sources,
# using Microsoft Edge in headless mode. Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File tools\render-images.ps1
$root = Split-Path -Parent $PSScriptRoot
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw "Microsoft Edge was not found." }

$jobs = @(
  @{ src = "tools\og-image.html";   out = "assets\img\og-image.png";         size = "1200,630" },
  @{ src = "tools\touch-icon.html"; out = "assets\img\apple-touch-icon.png"; size = "180,180" }
)
$profile = Join-Path $env:TEMP "fo-edge-render"
foreach ($j in $jobs) {
  $url = "file:///" + ((Join-Path $root $j.src) -replace '\\', '/')
  $out = Join-Path $root $j.out
  if (Test-Path $out) { Remove-Item $out }
  & $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --user-data-dir="$profile" `
          --virtual-time-budget=6000 --window-size=$($j.size) --screenshot="$out" $url 2>$null | Out-Null
  $tries = 0; while (-not (Test-Path $out) -and $tries -lt 40) { Start-Sleep -Milliseconds 250; $tries++ }
  if (Test-Path $out) { "rendered $($j.out) ($((Get-Item $out).Length) bytes)" } else { "FAILED $($j.out)" }
}
