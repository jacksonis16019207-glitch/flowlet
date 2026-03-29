param(
    [string]$FrontendDistPath = "..\\..\\frontend\\dist",
    [string]$BackendStaticPath = "..\\..\\backend\\flowlet\\src\\main\\resources\\static"
)

$resolvedFrontendDistPath = Resolve-Path -LiteralPath $FrontendDistPath -ErrorAction Stop

if (-not (Test-Path -LiteralPath $BackendStaticPath)) {
    New-Item -ItemType Directory -Path $BackendStaticPath -Force | Out-Null
}

Copy-Item -Path (Join-Path $resolvedFrontendDistPath.Path "*") -Destination $BackendStaticPath -Recurse -Force
