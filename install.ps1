<#
.SYNOPSIS
    One-click universal installer and setup script for Skillz on Windows.
.DESCRIPTION
    Installs the `skills` and `skillz` CLI globally, registers it in PATH,
    and installs 162 production skills into Claude Code, Cursor, Antigravity,
    Codex, Windsurf, OpenHands, Cline, Roo, and all AI coding agents.
    Supports running locally or remotely via:
    irm https://raw.githubusercontent.com/aktonay/skillz/main/install.ps1 | iex
.EXAMPLE
    irm https://raw.githubusercontent.com/aktonay/skillz/main/install.ps1 | iex
    .\install.ps1
    .\install.ps1 -Target claude
    .\install.ps1 -Category design -Target cursor
#>

[CmdletBinding()]
param (
    [string]$Target = "all",
    [switch]$All = $true,
    [string]$Category = "",
    [switch]$Force,
    [switch]$Copy,
    [switch]$GlobalCLI = $true
)

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

# Display ASCII banner
Write-Host @"

  ======================================================================
    ____  _  _______ _     _     ______ 
   / ___|| |/ /_   _| |   | |   |__  /  
   \___ \| ' /  | | | |   | |     / /   
    ___) | . \  | | | |___| |___ / /_   
   |____/|_|\_\ |_| |_____|_____/____|  
   
   ⚡ SKILLZ — UNIVERSAL AGENT SKILLS & RUNTIME HARNESS ⚡
   162 Production Skills • Multi-Agent Symlinking • Zero-Drift Pipeline
  ======================================================================

"@ -ForegroundColor Cyan

# 1. Resolve Script & Repository Directory (handles local execution and remote iex pipe)
$ScriptDir = if ($MyInvocation.MyCommand.Path) { 
    Split-Path -Parent $MyInvocation.MyCommand.Path 
} else { 
    $null 
}

if (-not $ScriptDir -or -not (Test-Path (Join-Path $ScriptDir "registry.json"))) {
    $installDir = Join-Path $HOME ".skillz"
    Write-Host "[0/4] Remote execution detected. Setting up Skillz repository in $installDir..." -ForegroundColor Yellow
    if (Test-Path (Join-Path $installDir ".git")) {
        try {
            git -C $installDir pull --ff-only 2>$null
        } catch {
            Write-Host "  -> Notice: Using existing local clone in $installDir" -ForegroundColor DarkGray
        }
    } elseif (Test-Path $installDir) {
        # Already exists
    } else {
        Write-Host "  -> Cloning latest Skillz repository..." -ForegroundColor Cyan
        git clone --depth 1 https://github.com/aktonay/skillz.git $installDir
    }
    $ScriptDir = $installDir
}

# 2. Register CLI globally via npm link
if ($GlobalCLI) {
    Write-Host "[1/4] Registering 'skills' and 'skillz' CLI commands globally..." -ForegroundColor Yellow
    try {
        Push-Location $ScriptDir
        npm link 2>&1 | Out-Null
        Pop-Location
        Write-Host "  -> Global CLI linked! You can run 'skills' from any terminal." -ForegroundColor Green
    } catch {
        Write-Host "  -> npm link note: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}

# 3. Add bin directory to User PATH
$binDir = Join-Path $ScriptDir "bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$binDir*") {
    Write-Host "[2/4] Adding $binDir to User PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$binDir", "User")
    $env:Path += ";$binDir"
    Write-Host "  -> Added to PATH!" -ForegroundColor Green
} else {
    Write-Host "[2/4] CLI bin directory already present in PATH." -ForegroundColor Green
}

# 4. Build & update registry
Write-Host "[3/4] Validating skill registry..." -ForegroundColor Yellow
node "$ScriptDir\scripts\build-registry.js"

# 5. Perform skill installation with deduplication & skip handling
Write-Host "[4/4] Deploying skills to agents (Target: $Target)..." -ForegroundColor Yellow
$cliScript = Join-Path $ScriptDir "bin\skills.js"
$installArgs = @("install", "--target", $Target)

if ($Copy) { $installArgs += "--copy" }
if ($Force) { $installArgs += "--force" }

if ($Category -ne "") {
    $installArgs += @("--category", $Category)
} else {
    $installArgs += "--all"
}

node $cliScript @installArgs

Write-Host @"

========================================================================
   SKILLZ SETUP COMPLETED! 162 Skills Active Across All Agents
========================================================================
Quick Commands:
  skills status                     # View detected agents and linked skills
  skills update                     # Sync & update all skills to latest
  skills search "animation"         # Search skills by keyword
  skills ui                         # Launch local browser dashboard

For AI Coding Agents:
  Prompt: "Install all skills across all agents by running: skills install"
========================================================================
"@ -ForegroundColor Green
