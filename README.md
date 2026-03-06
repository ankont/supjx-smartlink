# SmartLink for Joomla

SmartLink is a Joomla extension suite for Joomla 5.4+ and Joomla 6.x that provides:

- A custom field plugin (`fields/smartlink`) storing typed JSON payloads.
- An editor toolbar integration (`editors-xtd/smartlink`) that inserts generated markup.
- A package installer (`pkg_smartlink`) that installs both plugins together.

## Versioning

The build script reads the package version from `package/pkg_smartlink.xml` and names the final archive `pkg_smartlink_v<version>.zip`.
Keep the plugin manifest versions in sync with the package manifest.

## Build

Run the Windows build script from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\build\build.ps1
```

The script creates:

- `build/output/plg_fields_smartlink.zip`
- `build/output/plg_editors_xtd_smartlink.zip`
- `build/output/pkg_smartlink_v1.0.0.zip`

## Installation

1. Run the build script.
2. In Joomla Administrator go to `System -> Install -> Extensions`.
3. Upload `build/output/pkg_smartlink_v<version>.zip`.
4. Ensure `Fields - SmartLink` and `Editor Button - SmartLink` are enabled.
5. Create a custom field of type `SmartLink` and configure its allowed kinds/actions as needed.

