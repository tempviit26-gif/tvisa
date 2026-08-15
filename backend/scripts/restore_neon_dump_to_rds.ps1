param(
    [string]$DumpPath = ".\neondb_backup.dump",
    [string]$EnvPath = ".\.env",
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

function Read-DotEnv($Path) {
    $values = @{}
    if (Test-Path -LiteralPath $Path) {
        Get-Content -LiteralPath $Path | ForEach-Object {
            if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
            $parts = $_ -split '=', 2
            $key = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            if ($key) { $values[$key] = $value }
        }
    }
    return $values
}

$envValues = Read-DotEnv $EnvPath
$required = @("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")
foreach ($key in $required) {
    if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
        throw "Missing $key in $EnvPath"
    }
}

if (-not (Test-Path -LiteralPath $DumpPath)) {
    throw "Dump file not found: $DumpPath"
}

$pgRestore = (Get-Command pg_restore -ErrorAction Stop).Source
$env:PGPASSWORD = $envValues["DB_PASSWORD"]

$args = @(
    "--no-owner",
    "--no-acl",
    "--verbose",
    "-h", $envValues["DB_HOST"],
    "-p", $envValues["DB_PORT"],
    "-U", $envValues["DB_USER"],
    "-d", $envValues["DB_NAME"]
)

if ($Clean) {
    $args = @("--clean", "--if-exists") + $args
}

$args += $DumpPath

Write-Host "Restoring $DumpPath to RDS host $($envValues["DB_HOST"]) database $($envValues["DB_NAME"])..."
& $pgRestore @args
