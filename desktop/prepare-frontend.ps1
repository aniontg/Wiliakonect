$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $PSScriptRoot "web-dist"
$pageFiles = @(
  "index.html",
  "builder.html",
  "editor.html",
  "auth.html",
  "dashboard.html",
  "services.html",
  "about.html",
  "contact.html",
  "style.css",
  "favicon.svg",
  "brand.svg",
  "site.js",
  "assistant.js",
  "auth.js",
  "builder.js",
  "editor.js",
  "website-templates.js",
  "builder-render.js",
  "supabase-config.js",
  "iliakonect.png",
  "iliakonect (1).png"
)

New-Item -ItemType Directory -Path $webRoot -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $webRoot "supabase\functions\_shared") -Force | Out-Null

foreach ($file in $pageFiles) {
  $source = Join-Path $projectRoot $file
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    throw "Required desktop app file was not found: $source"
  }

  Copy-Item -LiteralPath $source -Destination $webRoot -Force
}

$rendererSource = Join-Path $projectRoot "supabase\functions\_shared\site-renderer.js"
$rendererDestination = Join-Path $webRoot "supabase\functions\_shared\site-renderer.js"
Copy-Item -LiteralPath $rendererSource -Destination $rendererDestination -Force
$pluginSource = Join-Path $projectRoot "supabase\functions\_shared\cms-plugins.js"
$pluginDestination = Join-Path $webRoot "supabase\functions\_shared\cms-plugins.js"
Copy-Item -LiteralPath $pluginSource -Destination $pluginDestination -Force

$fontLinks = '(?s)<link\s+rel="preconnect"\s+href="https://fonts\.googleapis\.com"\s*/>\s*<link\s+rel="preconnect"\s+href="https://fonts\.gstatic\.com"\s+crossorigin\s*/>\s*<link\s+href="https://fonts\.googleapis\.com[^"]+"\s+rel="stylesheet"\s*/>'
foreach ($page in Get-ChildItem -LiteralPath $webRoot -Filter "*.html" -File) {
  $html = [System.IO.File]::ReadAllText($page.FullName)
  $html = [System.Text.RegularExpressions.Regex]::Replace($html, $fontLinks, "")
  [System.IO.File]::WriteAllText($page.FullName, $html, [System.Text.Encoding]::UTF8)
}

Write-Host "Prepared the Wiliakonect desktop app files in $webRoot"
