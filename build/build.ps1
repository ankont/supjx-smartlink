Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$packageRoot = Join-Path $repoRoot 'package'
$packageManifestPath = Join-Path $packageRoot 'pkg_smartlink.xml'
$fieldsPluginRoot = Join-Path $packageRoot 'plugins\fields\smartlink'
$editorPluginRoot = Join-Path $packageRoot 'plugins\editors-xtd\smartlink'
$systemPluginRoot = Join-Path $packageRoot 'plugins\system\smartlinkassets'
$buildRoot = Join-Path $repoRoot 'build'
$stageRoot = Join-Path $buildRoot 'stage'
$outputRoot = Join-Path $buildRoot 'output'

function Ensure-CleanDirectory {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    if (Test-Path $Path) {
        Remove-Item -Path $Path -Recurse -Force
    }

    New-Item -ItemType Directory -Path $Path | Out-Null
}

function New-ZipFromDirectoryContents {
    param(
        [Parameter(Mandatory = $true)]
        [string] $SourceDirectory,

        [Parameter(Mandatory = $true)]
        [string] $DestinationZip
    )

    if (Test-Path $DestinationZip) {
        Remove-Item -Path $DestinationZip -Force
    }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $destinationStream = [System.IO.File]::Open($DestinationZip, [System.IO.FileMode]::Create)

    try {
        $archive = New-Object System.IO.Compression.ZipArchive(
            $destinationStream,
            [System.IO.Compression.ZipArchiveMode]::Create,
            $false
        )

        try {
            $rootPath = [System.IO.Path]::GetFullPath($SourceDirectory)

            Get-ChildItem -Path $SourceDirectory -Recurse -File | ForEach-Object {
                $filePath = [System.IO.Path]::GetFullPath($_.FullName)
                $entryPath = $filePath.Substring($rootPath.Length).TrimStart('\', '/').Replace('\', '/')
                [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                    $archive,
                    $filePath,
                    $entryPath,
                    [System.IO.Compression.CompressionLevel]::Optimal
                ) | Out-Null
            }
        }
        finally {
            $archive.Dispose()
        }
    }
    finally {
        $destinationStream.Dispose()
    }
}

function Get-ManifestVersion {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ManifestPath
    )

    if (-not (Test-Path $ManifestPath)) {
        throw "Manifest not found: $ManifestPath"
    }

    [xml]$manifest = Get-Content $ManifestPath -Raw
    $versionNode = $manifest.SelectSingleNode('/extension/version')
    $version = if ($null -ne $versionNode) { $versionNode.InnerText.Trim() } else { '' }

    if ([string]::IsNullOrWhiteSpace($version)) {
        throw "Version element not found in $ManifestPath"
    }

    return $version
}

$requiredPaths = @(
    $packageRoot,
    $fieldsPluginRoot,
    $editorPluginRoot,
    $systemPluginRoot
)

foreach ($requiredPath in $requiredPaths) {
    if (-not (Test-Path $requiredPath)) {
        throw "Required source path not found: $requiredPath"
    }
}

$manifestVersions = @(
    [pscustomobject]@{
        Name = 'Package'
        Path = $packageManifestPath
        Version = Get-ManifestVersion -ManifestPath $packageManifestPath
    }
    [pscustomobject]@{
        Name = 'Fields plugin'
        Path = Join-Path $fieldsPluginRoot 'smartlink.xml'
        Version = Get-ManifestVersion -ManifestPath (Join-Path $fieldsPluginRoot 'smartlink.xml')
    }
    [pscustomobject]@{
        Name = 'Editors XTD plugin'
        Path = Join-Path $editorPluginRoot 'smartlink.xml'
        Version = Get-ManifestVersion -ManifestPath (Join-Path $editorPluginRoot 'smartlink.xml')
    }
    [pscustomobject]@{
        Name = 'System plugin'
        Path = Join-Path $systemPluginRoot 'smartlinkassets.xml'
        Version = Get-ManifestVersion -ManifestPath (Join-Path $systemPluginRoot 'smartlinkassets.xml')
    }
)

$packageVersion = ($manifestVersions | Where-Object { $_.Name -eq 'Package' } | Select-Object -First 1).Version
$mismatchedManifests = @($manifestVersions | Where-Object { $_.Version -ne $packageVersion })

if ($mismatchedManifests.Count -gt 0) {
    $details = ($manifestVersions | ForEach-Object { '{0}: {1}' -f $_.Path, $_.Version }) -join '; '
    throw "Manifest versions must stay in sync. Expected $packageVersion. Found: $details"
}

Ensure-CleanDirectory -Path $outputRoot
Ensure-CleanDirectory -Path $stageRoot

$pluginsStageRoot = Join-Path $stageRoot 'plugins'
New-Item -ItemType Directory -Path $pluginsStageRoot | Out-Null

$fieldsZip = Join-Path $pluginsStageRoot 'plg_fields_smartlink.zip'
$editorZip = Join-Path $pluginsStageRoot 'plg_editors_xtd_smartlink.zip'
$systemZip = Join-Path $pluginsStageRoot 'plg_system_smartlinkassets.zip'
New-ZipFromDirectoryContents -SourceDirectory $fieldsPluginRoot -DestinationZip $fieldsZip
New-ZipFromDirectoryContents -SourceDirectory $editorPluginRoot -DestinationZip $editorZip
New-ZipFromDirectoryContents -SourceDirectory $systemPluginRoot -DestinationZip $systemZip

$packageStage = Join-Path $stageRoot 'package'
New-Item -ItemType Directory -Path $packageStage | Out-Null
$packageFilesStage = Join-Path $packageStage 'packages'
New-Item -ItemType Directory -Path $packageFilesStage | Out-Null

Copy-Item -Path $packageManifestPath -Destination $packageStage -Force
Copy-Item -Path $fieldsZip -Destination $packageFilesStage -Force
Copy-Item -Path $editorZip -Destination $packageFilesStage -Force
Copy-Item -Path $systemZip -Destination $packageFilesStage -Force

$packageLanguageSource = Join-Path $packageRoot 'language'
if (Test-Path $packageLanguageSource) {
    Copy-Item -Path $packageLanguageSource -Destination $packageStage -Recurse -Force
}

$packageZip = Join-Path $outputRoot ("pkg_smartlink_v{0}.zip" -f $packageVersion)
New-ZipFromDirectoryContents -SourceDirectory $packageStage -DestinationZip $packageZip

Write-Host ('Created: {0}' -f $packageZip)
