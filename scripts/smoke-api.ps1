param(
    [string]$BackendUrl = "http://localhost:8421",
    [Parameter(Mandatory = $true)]
    [string]$Tournament,
    [string]$Uuid = "",
    [ValidateSet("player", "referee", "streamer", "commentator")]
    [string]$Role = "player",
    [int]$MapId = 75,
    [int]$Team = 1,
    [string]$StageName = "",
    [string]$MatchId = "",
    [switch]$RunWrite
)

$ErrorActionPreference = "Stop"

function Encode([string]$value) {
    return [uri]::EscapeDataString($value)
}

function Invoke-Api {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [string]$CookieUuid = "",
        [int[]]$ExpectedStatus = @(),
        [switch]$AllowAnyClientError
    )

    $tmp = New-TemporaryFile
    try {
        $args = @(
            "-sS",
            "-o", $tmp.FullName,
            "-w", "%{http_code}",
            "-X", $Method,
            "$BackendUrl$Path",
            "-H", "Accept: application/json"
        )

        if ($CookieUuid) {
            $args += @("-H", "Cookie: uuid=$CookieUuid")
        }

        $statusText = (& curl.exe @args).Trim()
        $status = 0
        if (-not [int]::TryParse($statusText, [ref]$status)) {
            throw "Failed to parse HTTP status for [$Name]: $statusText"
        }

        $body = ""
        if (Test-Path $tmp.FullName) {
            $body = (Get-Content -Raw $tmp.FullName)
        }

        $ok = $false
        if ($ExpectedStatus.Count -gt 0) {
            $ok = $ExpectedStatus -contains $status
        } elseif ($AllowAnyClientError) {
            $ok = $status -ge 400 -and $status -lt 500
        } else {
            $ok = $status -ge 200 -and $status -lt 500
        }

        [pscustomobject]@{
            Name   = $Name
            Method = $Method
            Path   = $Path
            Status = $status
            Ok     = $ok
            Body   = $body
        }
    }
    finally {
        Remove-Item -Path $tmp.FullName -ErrorAction SilentlyContinue
    }
}

function Print-Result($r) {
    $flag = if ($r.Ok) { "PASS" } else { "FAIL" }
    Write-Host ("[{0}] {1} {2} -> {3}" -f $flag, $r.Method, $r.Path, $r.Status)
    if (-not $r.Ok) {
        $preview = if ($r.Body.Length -gt 400) { $r.Body.Substring(0, 400) + "..." } else { $r.Body }
        Write-Host ("       body: {0}" -f $preview)
    }
}

$results = New-Object System.Collections.Generic.List[object]

Write-Host "== API Smoke Test =="
Write-Host ("Backend: {0}" -f $BackendUrl)
Write-Host ("Tournament: {0}" -f $Tournament)
Write-Host ("Has UUID: {0}" -f ([bool]$Uuid))
Write-Host ("Run Write APIs: {0}" -f ([bool]$RunWrite))

# 1) Public health/read checks
$r = Invoke-Api -Name "tournament-info" -Method "GET" -Path ("/api/tournament-info?tournament_name={0}" -f (Encode $Tournament)) -ExpectedStatus @(200)
$results.Add($r); Print-Result $r

$scheduleResp = Invoke-Api -Name "get-schedule" -Method "GET" -Path ("/api/get-schedule?tournament_name={0}" -f (Encode $Tournament)) -ExpectedStatus @(200)
$results.Add($scheduleResp); Print-Result $scheduleResp

$schedule = $null
try {
    $schedule = $scheduleResp.Body | ConvertFrom-Json
}
catch {
    Write-Host "WARN: /api/get-schedule response is not valid JSON."
}

# 2) Protected endpoints should reject unauthenticated requests
$r = Invoke-Api -Name "reg-unauth" -Method "POST" -Path ("/api/reg?tournament_name={0}" -f (Encode $Tournament)) -AllowAnyClientError
$results.Add($r); Print-Result $r

if (-not $StageName -or -not $MatchId) {
    if ($schedule) {
        foreach ($stage in @($schedule)) {
            $lobbyList = $null
            if ($null -ne $stage.lobby_info) {
                $lobbyList = @($stage.lobby_info | Where-Object { $null -ne $_ })
            }

            $matchList = $null
            if ($null -ne $stage.match_info) {
                $matchList = @($stage.match_info | Where-Object { $null -ne $_ })
            }

            if ($stage.is_lobby -and $null -ne $lobbyList -and $lobbyList.Count -gt 0) {
                if (-not $StageName) { $StageName = [string]$stage.stage_name }
                if (-not $MatchId) { $MatchId = [string]$lobbyList[0].match_id }
                break
            }
            if ((-not $stage.is_lobby) -and $null -ne $matchList -and $matchList.Count -gt 0) {
                if (-not $StageName) { $StageName = [string]$stage.stage_name }
                if (-not $MatchId) { $MatchId = [string]$matchList[0].match_id }
                break
            }
        }
    }
}

if ($StageName -and $MatchId) {
    $r = Invoke-Api -Name "signup-unauth" -Method "POST" -Path ("/api/signup-match?tournament_name={0}&stage_name={1}&match_id={2}&role={3}" -f (Encode $Tournament), (Encode $StageName), (Encode $MatchId), (Encode $Role)) -AllowAnyClientError
    $results.Add($r); Print-Result $r
}
else {
    Write-Host "WARN: No stage/match found, skipped unauth signup-match check."
}

if (-not $Uuid) {
    Write-Host ""
    Write-Host "No UUID provided. Authenticated checks skipped."
}
else {
    # 3) Authenticated checks
    $r = Invoke-Api -Name "me-auth" -Method "GET" -Path "/api/me" -CookieUuid $Uuid -ExpectedStatus @(200)
    $results.Add($r); Print-Result $r

    if ($RunWrite) {
        $r = Invoke-Api -Name "reg-auth" -Method "POST" -Path ("/api/reg?tournament_name={0}" -f (Encode $Tournament)) -CookieUuid $Uuid
        $results.Add($r); Print-Result $r

        $r = Invoke-Api -Name "del-reg-auth" -Method "DELETE" -Path ("/api/del_reg?tournament_name={0}" -f (Encode $Tournament)) -CookieUuid $Uuid
        $results.Add($r); Print-Result $r

        if ($StageName -and $MatchId) {
            $r = Invoke-Api -Name "signup-auth" -Method "POST" -Path ("/api/signup-match?tournament_name={0}&stage_name={1}&match_id={2}&role={3}" -f (Encode $Tournament), (Encode $StageName), (Encode $MatchId), (Encode $Role)) -CookieUuid $Uuid
            $results.Add($r); Print-Result $r

            $r = Invoke-Api -Name "signout-auth" -Method "DELETE" -Path ("/api/sign-out-match?tournament_name={0}&stage_name={1}&match_id={2}&role={3}" -f (Encode $Tournament), (Encode $StageName), (Encode $MatchId), (Encode $Role)) -CookieUuid $Uuid
            $results.Add($r); Print-Result $r

            $r = Invoke-Api -Name "update-warmup-auth" -Method "PATCH" -Path ("/api/update-warmup?map_id={0}&team={1}&tournament_name={2}&stage_name={3}&match_id={4}" -f $MapId, $Team, (Encode $Tournament), (Encode $StageName), (Encode $MatchId)) -CookieUuid $Uuid
            $results.Add($r); Print-Result $r

            $r = Invoke-Api -Name "get-stage-plays-auth" -Method "POST" -Path ("/api/get-stage-plays?tournament_name={0}&stage_name={1}" -f (Encode $Tournament), (Encode $StageName)) -CookieUuid $Uuid
            $results.Add($r); Print-Result $r
        }
        else {
            Write-Host "WARN: No stage/match found, skipped write checks for match endpoints."
        }
    }
    else {
        Write-Host "RunWrite not enabled. Skipped mutating endpoints."
    }
}

Write-Host ""
Write-Host "== Summary =="
$results | Select-Object Name, Status, Ok | Format-Table -AutoSize

$failed = @($results | Where-Object { -not $_.Ok })
if ($failed.Count -gt 0) {
    Write-Host ("FAILED: {0} checks failed." -f $failed.Count)
    exit 1
}

Write-Host "ALL CHECKS PASSED."
