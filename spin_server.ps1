$port=8000
$root=(Get-Location).Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Start-Process "http://localhost:$port/index.html"
Write-Host "Serving $root at http://localhost:$port/  (Ctrl+C to stop)"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.AbsolutePath.TrimStart("/")
  if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
  $file = Join-Path $root $path
  $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()
  switch ($ext) {
  ".html" { $ctx.Response.ContentType = "text/html; charset=utf-8" }
  ".css"  { $ctx.Response.ContentType = "text/css; charset=utf-8" }
  ".js"   { $ctx.Response.ContentType = "text/javascript; charset=utf-8" }
  ".mjs"  { $ctx.Response.ContentType = "text/javascript; charset=utf-8" }
  ".json" { $ctx.Response.ContentType = "application/json; charset=utf-8" }
  ".svg"  { $ctx.Response.ContentType = "image/svg+xml" }
  ".png"  { $ctx.Response.ContentType = "image/png" }
  ".jpg"  { $ctx.Response.ContentType = "image/jpeg" }
  ".jpeg" { $ctx.Response.ContentType = "image/jpeg" }
  ".wasm" { $ctx.Response.ContentType = "application/wasm" }
  default { $ctx.Response.ContentType = "application/octet-stream" }
  }

  if (!(Test-Path $file)) {
    $ctx.Response.StatusCode = 404
    $bytes = [Text.Encoding]::UTF8.GetBytes("404")
    $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
    $ctx.Response.Close()
    continue
  }

  $bytes = [IO.File]::ReadAllBytes($file)
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
  $ctx.Response.Close()
}
