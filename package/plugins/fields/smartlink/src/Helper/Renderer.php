<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper;

\defined('_JEXEC') or die;

use Joomla\CMS\Uri\Uri;

final class Renderer
{
    public function __construct(private readonly TargetRegistry $registry)
    {
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    public function render(array $payload): string
    {
        if (empty($payload['kind'])) {
            return '';
        }

        if (($payload['kind'] ?? '') === 'gallery' && ($payload['action'] ?? 'link_open') !== 'embed') {
            return $this->buildGalleryLinks($payload);
        }

        $resolved = $this->registry->get((string) $payload['kind'])->resolve($payload);
        $link = $this->buildLink($payload, $resolved);

        if (($payload['action'] ?? 'link_open') !== 'embed') {
            return $link;
        }

        $embedMarkup = (string) ($resolved['embed'] ?? '');

        if ($embedMarkup === '') {
            return $link;
        }

        return '<div class="smartlink smartlink-embed">' . $embedMarkup . '<div class="smartlink-fallback">' . $link . '</div></div>';
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function buildLink(array $payload, array $resolved): string
    {
        $text = $payload['label'] ?: ($resolved['label'] ?? $resolved['href'] ?? '');
        $href = (string) ($resolved['href'] ?? '#');
        $attributes = [
            'href' => $href,
            'title' => (string) ($payload['title'] ?? ''),
            'class' => trim('smartlink-link ' . (string) ($payload['css_class'] ?? '') . ' ' . (string) ($resolved['class'] ?? '')),
        ];

        if (!empty($payload['target'])) {
            $attributes['target'] = (string) $payload['target'];
        }

        $rel = trim((string) ($payload['rel'] ?? ''));

        if (($attributes['target'] ?? '') === '_blank') {
            $rel = trim($rel . ' noopener noreferrer');
        }

        if ($rel !== '') {
            $attributes['rel'] = implode(' ', array_values(array_unique(array_filter(preg_split('/\s+/', $rel) ?: []))));
        }

        if (($payload['action'] ?? '') === 'link_download') {
            $attributes['download'] = (string) ($payload['download_filename'] ?: 'download');
        }

        if (($payload['action'] ?? '') === 'preview_modal') {
            $attributes['data-smartlink-preview'] = '1';
            $attributes['class'] = trim($attributes['class'] . ' js-smartlink-preview');

            if (!empty($payload['preview_image'])) {
                $attributes['data-preview-image'] = (string) $payload['preview_image'];
                $attributes['data-preview-alt'] = (string) ($payload['preview_alt'] ?? '');
            }
        }

        foreach ((array) ($resolved['attributes'] ?? []) as $name => $value) {
            if ($value !== null && $value !== '') {
                $attributes[(string) $name] = (string) $value;
            }
        }

        $htmlAttributes = [];

        foreach ($attributes as $name => $value) {
            if ($value === '') {
                continue;
            }

            $safeName = preg_replace('/[^A-Za-z0-9:_-]/', '', (string) $name) ?: 'data-attr';
            $htmlAttributes[] = sprintf('%s="%s"', $safeName, htmlspecialchars((string) $value, ENT_COMPAT, 'UTF-8'));
        }

        return sprintf(
            '<a %s>%s</a>',
            implode(' ', $htmlAttributes),
            htmlspecialchars((string) $text, ENT_COMPAT, 'UTF-8')
        );
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function buildGalleryLinks(array $payload): string
    {
        $items = \is_array($payload['value'] ?? null) ? $payload['value'] : [];
        $links = [];

        foreach ($items as $item) {
            if (!\is_array($item) || empty($item['src'])) {
                continue;
            }

            $href = $this->normaliseMediaHref((string) $item['src']);

            if ($href === '') {
                continue;
            }

            $itemPayload = $payload;
            $itemPayload['value'] = $href;
            $itemPayload['label'] = (string) ($item['label'] ?? '');

            if (($itemPayload['action'] ?? '') === 'preview_modal' && ($itemPayload['preview_image'] ?? '') === '' && (($item['type'] ?? 'image') === 'image')) {
                $itemPayload['preview_image'] = $href;
                $itemPayload['preview_alt'] = (string) ($item['label'] ?? '');
            }

            $links[] = $this->buildLink(
                $itemPayload,
                [
                    'href' => $href,
                    'label' => (string) ($item['label'] ?: basename((string) parse_url($href, PHP_URL_PATH))),
                ]
            );
        }

        if ($links === []) {
            return '';
        }

        return '<div class="smartlink smartlink-links">' . implode('', $links) . '</div>';
    }

    private function normaliseMediaHref(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            return '';
        }

        if (preg_match('#^(https?:)?//#i', $value)) {
            return $value;
        }

        return Uri::root(false) . ltrim($value, '/');
    }
}
