# Bump cache-bust id across portal pages + SW + build.json
# Usage: powershell -File scripts/bump-cache.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$id = Get-Date -Format 'yyyyMMddHHmm'
Write-Host "BUILD = $id"

$pages = @(
  'index.html', 'archive.html', 'article.html', 'map.html', 'chat.html',
  'video.html', 'audio.html', 'radio.html', 'photostock.html', 'sections.html',
  'library.html', 'book.html', 'church.html', 'spiritual-life.html',
  'authors.html', 'author.html'
)

foreach ($f in $pages) {
  if (-not (Test-Path $f)) { continue }
  $path = (Resolve-Path $f).Path
  $c = [System.IO.File]::ReadAllText($path)
  $c = $c -replace '\?v=\d+', "?v=$id"
  if ($c -match 'YAK_BUILD') {
    $c = $c -replace "window\.YAK_BUILD\s*=\s*'[^']*'", "window.YAK_BUILD = '$id'"
  } else {
    $inject = "<script>window.YAK_BUILD = '$id';</script>"
    if ($c -match 'Cache-Control') {
      $c = $c -replace '(<meta http-equiv="Cache-Control"[^>]*>)', ('$1' + "`n    " + $inject)
    } else {
      $c = $c -replace '(<meta name="theme-color"[^>]*>)', ('$1' + "`n    " + $inject)
    }
  }
  if ($c -notmatch 'cache-bust\.js') {
    $c = $c -replace '</body>', ("    <script src=`"js/cache-bust.js?v=$id`"></script>`r`n  </body>")
  } else {
    $c = $c -replace 'js/cache-bust\.js\?v=[^"]+', "js/cache-bust.js?v=$id"
  }
  [System.IO.File]::WriteAllText($path, $c)
}

$swPath = (Resolve-Path 'sw.js').Path
$sw = [System.IO.File]::ReadAllText($swPath)
$sw = $sw -replace "var BUILD = '[^']*'", "var BUILD = '$id'"
[System.IO.File]::WriteAllText($swPath, $sw)

$bj = "{`r`n  `"id`": `"$id`",`r`n  `"note`": `"Bump this id on every deploy; clients reload when it changes.`"`r`n}`r`n"
[System.IO.File]::WriteAllText((Join-Path $root 'build.json'), $bj)

$manifestPath = Join-Path $root 'site.webmanifest'
if (Test-Path $manifestPath) {
  $m = [System.IO.File]::ReadAllText($manifestPath)
  $m = $m -replace 'index\.html\?b=[^"]+', "index.html?b=$id"
  if ($m -notmatch 'index\.html\?b=') {
    $m = $m -replace '"start_url":\s*"[^"]*"', "`"start_url`": `"./index.html?b=$id`""
  }
  [System.IO.File]::WriteAllText($manifestPath, $m)
}

Write-Host "Done. Commit and push."
