# Builds the deployable site into dist\ for a given domain.
#   powershell -ExecutionPolicy Bypass -File tools\build.ps1 -Domain https://www.example.com
param(
  [Parameter(Mandatory = $true)][string]$Domain
)
$ErrorActionPreference = 'Stop'
$Domain = $Domain.TrimEnd('/')
if ($Domain -notmatch '^https?://[^/\s]+$') { throw "Domain must look like https://www.example.com (no path, no trailing slash)." }

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'
$u8 = [Text.Encoding]::UTF8
$enc = New-Object Text.UTF8Encoding $false

$pages = 'index.html','platform.html','how-it-fits.html','agentis.html','build.html','cloud.html','dc.html','ecosystem.html','use-cases.html','case-studies.html','case-study.html','faq.html','about.html','contact.html','privacy.html','cookies.html','ai-policy.html','404.html'

if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
New-Item -ItemType Directory -Force "$dist\assets\css", "$dist\assets\js", "$dist\assets\img", "$dist\assets\docs" | Out-Null
Copy-Item "$root\assets\css\main.css", "$root\assets\css\page.css" "$dist\assets\css\"
Copy-Item "$root\assets\js\main.js" "$dist\assets\js\"
Copy-Item "$root\assets\img\*" "$dist\assets\img\" -Exclude 'logo-white.svg'  # only used by the reference designs
Copy-Item "$root\assets\docs\*" "$dist\assets\docs\"

$indexable = @()
foreach ($p in $pages) {
  $html = [IO.File]::ReadAllText((Join-Path $root $p), $u8)
  $url = if ($p -eq 'index.html') { "$Domain/" } else { "$Domain/$p" }
  $noindex = $html -match 'name="robots" content="noindex"'
  $html = $html.Replace('__SITE__', $Domain)
  $html = $html.Replace('content="assets/img/og-image.png"', "content=`"$Domain/assets/img/og-image.png`"")
  if ($html -notmatch 'rel="canonical"' -and $p -ne '404.html') {
    $html = $html.Replace('<meta property="og:type" content="website" />', "<link rel=`"canonical`" href=`"$url`" />`n  <meta property=`"og:type`" content=`"website`" />`n  <meta property=`"og:url`" content=`"$url`" />")
  }
  [IO.File]::WriteAllText((Join-Path $dist $p), $html, $enc)
  if (-not $noindex -and $p -ne '404.html') { $indexable += $url }
}

$today = Get-Date -Format 'yyyy-MM-dd'
$urls = ($indexable | ForEach-Object { "  <url><loc>$_</loc><lastmod>$today</lastmod></url>" }) -join "`n"
[IO.File]::WriteAllText("$dist\sitemap.xml", "<?xml version=`"1.0`" encoding=`"UTF-8`"?>`n<urlset xmlns=`"http://www.sitemaps.org/schemas/sitemap/0.9`">`n$urls`n</urlset>`n", $enc)
[IO.File]::WriteAllText("$dist\robots.txt", "User-agent: *`nAllow: /`n`nSitemap: $Domain/sitemap.xml`n", $enc)
[IO.File]::WriteAllText("$dist\.htaccess", "ErrorDocument 404 /404.html`n", $enc)

$size = "{0:N0} KB" -f ((Get-ChildItem $dist -Recurse -File | Measure-Object Length -Sum).Sum / 1KB)
"Built dist\ for $Domain"
"  pages: $($pages.Count)   in sitemap: $($indexable.Count)   total size: $size"
"  left out of the sitemap (noindex): " + (($pages | Where-Object { $_ -ne '404.html' -and ($indexable -notcontains $(if ($_ -eq 'index.html') { "$Domain/" } else { "$Domain/$_" })) }) -join ', ')
