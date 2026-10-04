param(
    [switch]$IdentityGuardOnly
)

$ErrorActionPreference = 'Stop'

$dbName = 'studyhub_lifecycle_validation_20261002'
$dbRole = 'lifecycle_validation'
$loopback = '127.0.0.1'
$dbPort = 55432
$candidate = 'C:\Users\stylish_pranav\studyhub-ame-lifecycle-rc'
$scratch = 'C:\Users\stylish_pranav\studyhub-ame-lifecycle-scratch-20261002'
$dataDir = 'C:\Users\stylish_pranav\studyhub-ame-lifecycle-cluster-20261002'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'

$pgCtl = (Resolve-Path -LiteralPath (Join-Path $pgBin 'pg_ctl.exe') -ErrorAction Stop).ProviderPath
$pgConfig = (Resolve-Path -LiteralPath (Join-Path $pgBin 'postgres.exe') -ErrorAction Stop).ProviderPath
$psql = (Resolve-Path -LiteralPath (Join-Path $pgBin 'psql.exe') -ErrorAction Stop).ProviderPath

$envNames = @('DATABASE_URL', 'DIRECT_URL', 'PGPASSWORD')
$previousEnv = @{}
foreach ($name in $envNames) {
    $previousEnv[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

$scriptExitCode = 0
$securePassword = $null
$password = $null

function Invoke-GuardedStage([string]$Name, [scriptblock]$Body) {
    Write-Host "=== STAGE START: $Name ==="
    try {
        & $Body
        Write-Host "=== STAGE EXIT CODE: $Name = 0 ==="
    } catch {
        Write-Host "=== STAGE EXIT CODE: $Name = 1 ==="
        throw
    }
}

try {
    Write-Host 'Guarded isolated lifecycle validation; no production database is targeted.'
    $securePassword = Read-Host -AsSecureString -Prompt 'Enter the lifecycle_validation password (masked; local PowerShell only)'
    if ($null -eq $securePassword -or $securePassword.Length -eq 0) {
        throw 'A non-empty database password is required.'
    }

    $passwordPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try {
        $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPtr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPtr)
    }

    $encodedPassword = [Uri]::EscapeDataString($password)
    $targetUrl = "postgresql://${dbRole}:${encodedPassword}@${loopback}:${dbPort}/${dbName}?schema=public"
    $env:DATABASE_URL = $targetUrl
    $env:DIRECT_URL = $targetUrl
    $env:PGPASSWORD = $password

    Invoke-GuardedStage 'PREFLIGHT' {
        $requiredPaths = @(
            (Join-Path $candidate 'package.json'),
            (Join-Path $candidate 'prisma\schema.prisma'),
            (Join-Path $candidate 'prisma\migrations\20260930120000_add_user_account_lifecycle\migration.sql'),
            (Join-Path $scratch 'package.json'),
            (Join-Path $scratch 'prisma\schema.prisma'),
            (Join-Path $scratch 'prisma\migrations\20260930120000_add_user_account_lifecycle\migration.sql'),
            (Join-Path $scratch 'node_modules\.bin\prisma.cmd'),
            (Join-Path $dataDir 'PG_VERSION'),
            (Join-Path $dataDir 'postmaster.pid'),
            $pgCtl,
            $pgConfig,
            $psql
        )
        foreach ($path in $requiredPaths) {
            if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
                throw "Required safety-check path is missing: $path"
            }
        }

        foreach ($executable in @($pgCtl, $pgConfig, $psql)) {
            if (-not [IO.Path]::IsPathRooted($executable) -or
                [IO.Path]::GetFullPath($executable) -ne $executable) {
                throw "PostgreSQL executable path is not fully qualified: $executable"
            }
        }

        $expectedPid = [int](Get-Content -LiteralPath (Join-Path $dataDir 'postmaster.pid') -TotalCount 1)
        $listeners = @(Get-NetTCPConnection -State Listen -LocalPort $dbPort -ErrorAction SilentlyContinue)
        if ($listeners.Count -ne 1) {
            throw "Expected exactly one listener on isolated port $dbPort; found $($listeners.Count)."
        }
        if ($listeners[0].LocalAddress -ne $loopback -or $listeners[0].OwningProcess -ne $expectedPid) {
            throw 'The isolated port listener is not the expected loopback PostgreSQL process.'
        }

        & $pgCtl -D $dataDir status
        if ($LASTEXITCODE -ne 0) {
            throw 'The isolated PostgreSQL cluster status check failed.'
        }

        $configuredAddress = (& $pgConfig -D $dataDir -C listen_addresses 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -or $configuredAddress -ne $loopback) {
            throw "Cluster listen_addresses is not exactly $loopback (observed: $configuredAddress)."
        }

        $configuredPort = (& $pgConfig -D $dataDir -C port 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -or $configuredPort -ne [string]$dbPort) {
            throw "Cluster port is not exactly $dbPort (observed: $configuredPort)."
        }

        Write-Host "Candidate: $candidate"
        Write-Host "Scratch: $scratch"
        Write-Host "Target: $dbRole@$loopback`:$dbPort/$dbName"
        Write-Host "Listener PID matches isolated cluster PID: $expectedPid"
    }

    Invoke-GuardedStage 'DATABASE IDENTITY GUARD' {
        $identityOutput = & $psql -X -A -t -F '|' -v ON_ERROR_STOP=1 -w `
            -h $loopback -p $dbPort -U $dbRole -d $dbName `
            -c 'SELECT current_database(), current_user, inet_server_addr()::text, inet_server_port();' 2>&1
        $psqlExit = $LASTEXITCODE
        if ($psqlExit -ne 0) {
            $identityOutput | ForEach-Object { Write-Host $_ }
            throw "Database identity query failed with exit code $psqlExit."
        }

        $identity = @(
            $identityOutput |
                ForEach-Object { ([string]$_).Trim() } |
                Where-Object { $_ -ne '' } |
                Select-Object -Last 1
        )
        $expectedIdentities = @(
            "$dbName|$dbRole|$loopback|$dbPort"
            "$dbName|$dbRole|$loopback/32|$dbPort"
        )
        if ($identity.Count -ne 1 -or $expectedIdentities -notcontains $identity[0]) {
            throw "Database identity mismatch. Expected '$($expectedIdentities -join "' or '")'; received '$($identity -join '')'."
        }

        Write-Host "Verified database identity: $($identity[0])"
    }

    if ($IdentityGuardOnly) {
        Write-Host 'Identity guard passed; stopping before all Prisma commands as requested.'
        return
    }

    $prisma = (Resolve-Path -LiteralPath (Join-Path $scratch 'node_modules\.bin\prisma.cmd') -ErrorAction Stop).ProviderPath
    Invoke-GuardedStage 'PRISMA MIGRATE DEPLOY (SCRATCH)' {
        Push-Location -LiteralPath $scratch
        try {
            & $prisma migrate deploy
            $prismaExit = $LASTEXITCODE
        } finally {
            Pop-Location
        }
        if ($prismaExit -ne 0) {
            throw "Prisma migrate deploy failed with exit code $prismaExit; stopping before the next stage."
        }
    }

    Invoke-GuardedStage 'PRISMA MIGRATE STATUS (SCRATCH)' {
        Push-Location -LiteralPath $scratch
        try {
            & $prisma migrate status
            $prismaExit = $LASTEXITCODE
        } finally {
            Pop-Location
        }
        if ($prismaExit -ne 0) {
            throw "Prisma migrate status failed with exit code $prismaExit."
        }
    }
} catch {
    Write-Error -ErrorRecord $_
    $scriptExitCode = 1
} finally {
    foreach ($name in $envNames) {
        if ($null -eq $previousEnv[$name]) {
            [Environment]::SetEnvironmentVariable($name, $null, 'Process')
        } else {
            [Environment]::SetEnvironmentVariable($name, $previousEnv[$name], 'Process')
        }
    }

    if ($null -ne $securePassword) {
        $securePassword.Dispose()
    }
    $password = $null
    Write-Host 'Process-scoped DATABASE_URL, DIRECT_URL, and PGPASSWORD values restored.'
}

if ($scriptExitCode -ne 0) {
    exit $scriptExitCode
}
