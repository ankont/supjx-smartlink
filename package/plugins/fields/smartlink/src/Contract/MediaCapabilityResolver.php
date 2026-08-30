<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Contract;

\defined('_JEXEC') or die;

final class MediaCapabilityResolver
{
    /**
     * @param   array<string, mixed>  $hints
     *
     * @return array{mime_type:string,extension:string,is_file:bool,downloadable:bool}
     */
    public function resolve(string $kind, string $source, array $hints = []): array
    {
        if ($kind === 'gallery') {
            return [
                'mime_type' => '',
                'extension' => '',
                'is_file' => false,
                'downloadable' => false,
            ];
        }

        $sourceType = strtolower(trim((string) ($hints['source_type'] ?? '')));
        $provider = $sourceType === 'provider';
        $extension = $provider
            ? ''
            : ($this->normaliseExtension((string) ($hints['extension'] ?? '')) ?: $this->extension($source));
        $mimeType = $this->normaliseMimeType((string) ($hints['mime_type'] ?? ''));

        if ($mimeType === '' && !$provider) {
            $mimeType = $this->localFileMimeType($source) ?: $this->mimeTypeForExtension($extension);
        }

        $isFile = array_key_exists('is_file', $hints)
            ? (bool) $hints['is_file']
            : $this->isFileKind($kind, $provider, $mimeType);
        $downloadable = array_key_exists('downloadable', $hints)
            ? (bool) $hints['downloadable']
            : $isFile && !$provider;

        if (!$isFile) {
            $downloadable = false;
        }

        return [
            'mime_type' => $mimeType,
            'extension' => $extension,
            'is_file' => $isFile,
            'downloadable' => $downloadable,
        ];
    }

    private function isFileKind(string $kind, bool $provider, string $mimeType): bool
    {
        if ($provider) {
            return false;
        }

        if (\in_array($kind, ['media_file', 'image', 'video'], true)) {
            return true;
        }

        return \in_array($kind, ['external_url', 'relative_url'], true)
            && $mimeType !== ''
            && !\in_array($mimeType, ['text/html', 'application/xhtml+xml'], true);
    }

    private function extension(string $source): string
    {
        $path = (string) (parse_url($source, PHP_URL_PATH) ?: $source);
        return $this->normaliseExtension((string) pathinfo(rawurldecode($path), PATHINFO_EXTENSION));
    }

    private function normaliseExtension(string $extension): string
    {
        $extension = strtolower(ltrim(trim($extension), '.'));

        return preg_match('/^[a-z0-9]+$/', $extension) ? $extension : '';
    }

    private function normaliseMimeType(string $mimeType): string
    {
        $mimeType = strtolower(trim(explode(';', $mimeType, 2)[0]));

        return preg_match('#^[a-z0-9][a-z0-9.+-]*/[a-z0-9][a-z0-9.+-]*$#', $mimeType) ? $mimeType : '';
    }

    private function localFileMimeType(string $source): string
    {
        if (!\defined('JPATH_ROOT') || preg_match('#^[a-z][a-z0-9+.-]*://#i', $source)) {
            return '';
        }

        $markerPosition = strpos($source, '#joomlaImage://');

        if ($markerPosition !== false) {
            $source = substr($source, 0, $markerPosition);
        }

        $path = (string) (parse_url($source, PHP_URL_PATH) ?: $source);
        $root = realpath(JPATH_ROOT);

        if ($root === false) {
            return '';
        }

        $candidate = realpath($root . DIRECTORY_SEPARATOR . ltrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, rawurldecode($path)), DIRECTORY_SEPARATOR));

        if ($candidate === false || !is_file($candidate)) {
            return '';
        }

        $rootPrefix = rtrim($root, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;

        if ($candidate !== $root && !str_starts_with($candidate, $rootPrefix)) {
            return '';
        }

        if (\function_exists('finfo_open')) {
            $info = finfo_open(FILEINFO_MIME_TYPE);

            if ($info !== false) {
                try {
                    return $this->normaliseMimeType((string) finfo_file($info, $candidate));
                } finally {
                    finfo_close($info);
                }
            }
        }

        return \function_exists('mime_content_type')
            ? $this->normaliseMimeType((string) mime_content_type($candidate))
            : '';
    }

    private function mimeTypeForExtension(string $extension): string
    {
        return match ($extension) {
            'avif' => 'image/avif',
            'bmp' => 'image/bmp',
            'gif' => 'image/gif',
            'heic' => 'image/heic',
            'heif' => 'image/heif',
            'ico' => 'image/x-icon',
            'jpeg', 'jpg' => 'image/jpeg',
            'png' => 'image/png',
            'svg' => 'image/svg+xml',
            'tif', 'tiff' => 'image/tiff',
            'webp' => 'image/webp',
            'aac' => 'audio/aac',
            'flac' => 'audio/flac',
            'm4a' => 'audio/mp4',
            'mp3' => 'audio/mpeg',
            'oga', 'ogg' => 'audio/ogg',
            'wav' => 'audio/wav',
            'webm' => 'video/webm',
            'avi' => 'video/x-msvideo',
            'm4v', 'mp4' => 'video/mp4',
            'mov' => 'video/quicktime',
            'mpeg', 'mpg' => 'video/mpeg',
            'ogv' => 'video/ogg',
            '3gp' => 'video/3gpp',
            'csv' => 'text/csv',
            'md' => 'text/markdown',
            'txt' => 'text/plain',
            'css' => 'text/css',
            'html', 'htm' => 'text/html',
            'xml' => 'application/xml',
            'json' => 'application/json',
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'epub' => 'application/epub+zip',
            '7z' => 'application/x-7z-compressed',
            'gz' => 'application/gzip',
            'rar' => 'application/vnd.rar',
            'tar' => 'application/x-tar',
            'zip' => 'application/zip',
            default => '',
        };
    }
}
