# Checks every href/src in the site's pages: local files must exist, and #anchors must
# match an id on the target page. External links (http/https/mailto) are listed, not fetched.
#   powershell -ExecutionPolicy Bypass -File tools\check-links.ps1
$root = Split-Path -Parent $PSScriptRoot
$u8 = [Text.Encoding]::UTF8
$pages = Get-ChildItem $root -Filter *.html | Select-Object -ExpandProperty Name
$ids = @{}
foreach ($p in $pages) {
  $html = [IO.File]::ReadAllText((Join-Path $root $p), $u8)
  $ids[$p] = @([regex]::Matches($html, '\sid="([^"]+)"') | ForEach-Object { $_.Groups[1].Value })
}
$problems = 0; $external = @{}
foreach ($p in $pages) {
  $html = [IO.File]::ReadAllText((Join-Path $root $p), $u8)
  # skip the contents of JSON-LD and the __SITE__ placeholder used at build time
  $refs = [regex]::Matches($html, '(?:href|src)="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
  foreach ($ref in $refs) {
    if ($ref -match '^(https?:|mailto:|tel:)') { $external[$ref] = $true; continue }
    if ($ref -eq '#') { continue }  # social placeholders, reported separately
    $path, $hash = $ref -split '#', 2
    $path = ($path -split '\?')[0]
    $target = if ($path) { $path } else { $p }
    $file = Join-Path $root $target
    if (-not (Test-Path $file)) { "MISSING  $p -> $ref"; $problems++; continue }
    if ($hash -and $target -like '*.html' -and -not ($ids[$target] -contains $hash)) { "NO ANCHOR  $p -> $ref"; $problems++ }
  }
  $dead = ([regex]::Matches($html, 'href="#"')).Count
  if ($dead) { "placeholder  $p has $dead link(s) to '#' (social links awaiting URLs)" }
}
"external links found: " + ($external.Keys -join ', ')
if ($problems -eq 0) { "OK: no missing files or broken anchors across $($pages.Count) pages" } else { "$problems problem(s) found" }
