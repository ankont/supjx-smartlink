<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Contract;

\defined('_JEXEC') or die;

final class TextResolver
{
    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<string, mixed>  $config
     *
     * @return  array{visible_text: string, text_source: string}
     */
    public function resolve(array $payload, array $resolved, array $config = []): array
    {
        $authorText = trim((string) ($payload['label'] ?? ''));

        if ($authorText !== '') {
            return ['visible_text' => $authorText, 'text_source' => 'author_override'];
        }

        $defaultText = trim((string) ($config['default_text'] ?? ''));

        if ($defaultText !== '') {
            $expanded = $this->expand($defaultText, $payload, $resolved);

            if ($expanded !== '') {
                return ['visible_text' => $expanded, 'text_source' => 'field_default'];
            }
        }

        return [
            'visible_text' => trim((string) ($resolved['display_name'] ?? '')) ?: 'Open',
            'text_source' => (string) ($resolved['display_name_source'] ?? 'fallback'),
        ];
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function expand(string $pattern, array $payload, array $resolved): string
    {
        $value = $payload['value'] ?? '';
        $fullFilename = \is_scalar($value) ? trim((string) $value) : '';
        $path = (string) (parse_url($fullFilename, PHP_URL_PATH) ?: $fullFilename);
        $filename = basename(str_replace('\\', '/', $path));
        $bareFilename = pathinfo($filename, PATHINFO_FILENAME);
        $variables = [
            '{filename}' => $filename,
            '{full_filename}' => $fullFilename,
            '{bare_filename}' => $bareFilename,
            '{selection_label}' => trim((string) ($payload['selection_label'] ?? '')),
            '{resolved_title}' => trim((string) ($resolved['title'] ?? '')),
            '{type}' => trim((string) ($resolved['type_label'] ?? $resolved['type'] ?? '')),
        ];

        return trim(strtr($pattern, $variables));
    }
}
