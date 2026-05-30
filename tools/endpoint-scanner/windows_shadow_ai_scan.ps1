param(
    [string]$ApiUrl = "",
    [string]$ApiKey = "",
    [switch]$PostToApi
)

$ErrorActionPreference = "SilentlyContinue"

function Add-Signal {
    param(
        [System.Collections.ArrayList]$Signals,
        [string]$Type,
        [string]$Label,
        [string]$Severity,
        [string]$Evidence,
        [object]$Metadata = $null
    )

    $signal = [ordered]@{
        type = $Type
        label = $Label
        severity = $Severity
        evidence = $Evidence
    }

    if ($null -ne $Metadata) {
        $signal.metadata = $Metadata
    }

    [void]$Signals.Add($signal)
}

function Command-Exists {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

$signals = New-Object System.Collections.ArrayList

$hostInfo = [ordered]@{
    hostname = $env:COMPUTERNAME
    username = $env:USERNAME
    os = (Get-CimInstance Win32_OperatingSystem).Caption
    timestamp_utc = (Get-Date).ToUniversalTime().ToString("o")
}

# 1. Running processes
$processKeywords = @(
    "n8n",
    "ollama",
    "flowise",
    "langflow",
    "open-webui",
    "open_webui",
    "python",
    "node",
    "uvicorn",
    "docker"
)

$processes = Get-CimInstance Win32_Process | Select-Object ProcessId, Name, CommandLine

foreach ($process in $processes) {
    $text = (($process.Name + " " + $process.CommandLine) -as [string]).ToLower()

    foreach ($keyword in $processKeywords) {
        if ($text -like "*$keyword*") {
            Add-Signal `
                -Signals $signals `
                -Type "process" `
                -Label "Process signal: $keyword" `
                -Severity $(if ($keyword -in @("n8n", "ollama", "flowise", "langflow", "open-webui", "open_webui")) { "high" } else { "medium" }) `
                -Evidence "Process $($process.Name) with PID $($process.ProcessId) matches keyword '$keyword'." `
                -Metadata @{
                    pid = $process.ProcessId
                    name = $process.Name
                    keyword = $keyword
                }

            break
        }
    }
}

# 2. Listening ports often used by local AI / automation stacks
$interestingPorts = @{
    5678 = "n8n default port"
    11434 = "Ollama default port"
    7860 = "Gradio / local AI UI common port"
    3000 = "local web app common port"
    8000 = "FastAPI / local API common port"
    8080 = "local web service common port"
}

$connections = Get-NetTCPConnection -State Listen

foreach ($connection in $connections) {
    if ($interestingPorts.ContainsKey([int]$connection.LocalPort)) {
        $proc = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue

        Add-Signal `
            -Signals $signals `
            -Type "listening_port" `
            -Label $interestingPorts[[int]$connection.LocalPort] `
            -Severity $(if ([int]$connection.LocalPort -in @(5678, 11434, 7860)) { "high" } else { "medium" }) `
            -Evidence "Listening on $($connection.LocalAddress):$($connection.LocalPort), process=$($proc.ProcessName), pid=$($connection.OwningProcess)." `
            -Metadata @{
                local_address = $connection.LocalAddress
                local_port = $connection.LocalPort
                process_name = $proc.ProcessName
                pid = $connection.OwningProcess
            }
    }
}

# 3. Docker containers
if (Command-Exists "docker") {
    $dockerPs = docker ps --format "{{json .}}" 2>$null

    foreach ($line in $dockerPs) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        $container = $line | ConvertFrom-Json
        $text = ($line -as [string]).ToLower()

        if ($text -match "n8n|ollama|qdrant|weaviate|chroma|flowise|langflow|open-webui|open_webui|postgres|redis") {
            Add-Signal `
                -Signals $signals `
                -Type "docker_container" `
                -Label "AI-related Docker container detected" `
                -Severity "high" `
                -Evidence "Container detected: image=$($container.Image), names=$($container.Names), ports=$($container.Ports)." `
                -Metadata $container
        }
    }

    $dockerImages = docker images --format "{{json .}}" 2>$null

    foreach ($line in $dockerImages) {
        $text = ($line -as [string]).ToLower()

        if ($text -match "n8n|ollama|qdrant|weaviate|chroma|flowise|langflow|open-webui|open_webui") {
            Add-Signal `
                -Signals $signals `
                -Type "docker_image" `
                -Label "AI-related Docker image detected" `
                -Severity "medium" `
                -Evidence "Docker image detected: $line"
        }
    }
}

# 4. Local folders / known config locations
$knownPaths = @(
    "$env:USERPROFILE\.n8n",
    "$env:USERPROFILE\.ollama",
    "$env:USERPROFILE\.cache\huggingface",
    "$env:USERPROFILE\.cache\pip",
    "$env:USERPROFILE\AppData\Roaming\npm\n8n.cmd"
)

foreach ($path in $knownPaths) {
    if (Test-Path $path) {
        Add-Signal `
            -Signals $signals `
            -Type "local_path" `
            -Label "Known AI/automation local path detected" `
            -Severity "medium" `
            -Evidence "Path exists: $path"
    }
}

# 5. npm global packages
if (Command-Exists "npm") {
    $npmGlobal = npm list -g --depth=0 2>$null

    foreach ($line in $npmGlobal) {
        $text = ($line -as [string]).ToLower()

        if ($text -match "n8n|langchain|openai|@langchain|ai|flowise|langflow") {
            Add-Signal `
                -Signals $signals `
                -Type "npm_package" `
                -Label "AI-related npm package detected" `
                -Severity "medium" `
                -Evidence $line
        }
    }
}

# 6. Python packages
if (Command-Exists "pip") {
    $pipList = pip list 2>$null

    foreach ($line in $pipList) {
        $text = ($line -as [string]).ToLower()

        if ($text -match "openai|langchain|langgraph|crewai|autogen|llama-index|semantic-kernel|qdrant|chromadb|weaviate|ollama") {
            Add-Signal `
                -Signals $signals `
                -Type "python_package" `
                -Label "AI-related Python package detected" `
                -Severity "medium" `
                -Evidence $line
        }
    }
}

# 7. Environment variable names only, never values
$envSignals = Get-ChildItem Env: | Where-Object {
    $_.Name -match "OPENAI|AZURE_OPENAI|ANTHROPIC|MISTRAL|GEMINI|COHERE|OLLAMA|N8N"
}

foreach ($envVar in $envSignals) {
    Add-Signal `
        -Signals $signals `
        -Type "environment_variable_name" `
        -Label "AI-related environment variable name detected" `
        -Severity "medium" `
        -Evidence "Environment variable name detected: $($envVar.Name). Value was not collected."
}

$report = [ordered]@{
    schema_version = "1.0"
    collector = "windows_shadow_ai_scan"
    host = $hostInfo
    signals = $signals
    summary = [ordered]@{
        total_signals = $signals.Count
    }
}

$json = $report | ConvertTo-Json -Depth 20

if ($PostToApi) {
    if ([string]::IsNullOrWhiteSpace($ApiUrl) -or [string]::IsNullOrWhiteSpace($ApiKey)) {
        Write-Error "ApiUrl and ApiKey are required when using -PostToApi."
        exit 1
    }

    Invoke-RestMethod `
        -Uri "$ApiUrl/discovery/endpoint/report" `
        -Method Post `
        -Headers @{ "X-API-Key" = $ApiKey } `
        -ContentType "application/json" `
        -Body $json
} else {
    $json
}
