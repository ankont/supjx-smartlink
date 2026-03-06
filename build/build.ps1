Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$packageRoot = Join-Path $root 'package'
$buildRoot = Join-Path $root 'build'
$outputRoot = Join-Path $buildRoot 'output'
$tempRoot = Join-Path $buildRoot 'tmp'

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
        $archive = New-Object System.IO.Compression.ZipArchive($destinationStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)

        try {
            $rootPath = [System.IO.Path]::GetFullPath($SourceDirectory)

            Get-ChildItem -Path $SourceDirectory -Recurse -File | ForEach-Object {
                $filePath = [System.IO.Path]::GetFullPath($_.FullName)
                $entryPath = $filePath.Substring($rootPath.Length).TrimStart('\', '/').Replace('\', '/')
                [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $filePath, $entryPath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
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

[xml] $packageManifest = Get-Content (Join-Path $packageRoot 'pkg_smartlink.xml')
$versionNode = $packageManifest.SelectSingleNode('/extension/version')
$version = if ($versionNode) { $versionNode.InnerText } else { '' }

if ([string]::IsNullOrWhiteSpace($version)) {
    throw 'Unable to read version from package/pkg_smartlink.xml'
}

Ensure-CleanDirectory -Path $outputRoot
Ensure-CleanDirectory -Path $tempRoot

$fieldsSource = Join-Path $packageRoot 'plugins\fields\smartlink'
$editorSource = Join-Path $packageRoot 'plugins\editors-xtd\smartlink'
$fieldsZip = Join-Path $outputRoot 'plg_fields_smartlink.zip'
$editorZip = Join-Path $outputRoot 'plg_editors_xtd_smartlink.zip'

New-ZipFromDirectoryContents -SourceDirectory $fieldsSource -DestinationZip $fieldsZip
New-ZipFromDirectoryContents -SourceDirectory $editorSource -DestinationZip $editorZip

$packageStage = Join-Path $tempRoot 'pkg_smartlink'
Ensure-CleanDirectory -Path $packageStage
$packageFilesStage = Join-Path $packageStage 'packages'
New-Item -ItemType Directory -Path $packageFilesStage | Out-Null

Copy-Item -Path (Join-Path $packageRoot 'pkg_smartlink.xml') -Destination $packageStage -Force
Copy-Item -Path $fieldsZip -Destination $packageFilesStage -Force
Copy-Item -Path $editorZip -Destination $packageFilesStage -Force

$packageLanguageSource = Join-Path $packageRoot 'language'

if (Test-Path $packageLanguageSource) {
    Copy-Item -Path $packageLanguageSource -Destination $packageStage -Recurse -Force
}

$packageZip = Join-Path $outputRoot ("pkg_smartlink_v{0}.zip" -f $version)

if (Test-Path $packageZip) {
    Remove-Item -Path $packageZip -Force
}

New-ZipFromDirectoryContents -SourceDirectory $packageStage -DestinationZip $packageZip

Write-Host ('Created: {0}' -f $fieldsZip)
Write-Host ('Created: {0}' -f $editorZip)
Write-Host ('Created: {0}' -f $packageZip)
