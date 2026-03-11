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
     * @param   array<string, mixed>  $context
     */
    public function render(array $payload, array $context = []): string
    {
        if (empty($payload['kind'])) {
            return '';
        }

        $kind = (string) ($payload['kind'] ?? '');
        $resolved = $this->registry->get($kind)->resolve($payload);

        if (!empty($payload['display_inside'])) {
            return $this->buildInlineViewer($payload, $resolved);
        }

        if ($kind === 'gallery') {
            return $this->buildGalleryLinks($payload);
        }

        return $this->buildStructuredOutput($payload, $resolved);
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function buildStructuredOutput(array $payload, array $resolved): string
    {
        $linked = ($payload['action'] ?? 'link_open') !== 'no_action';
        $wholeItem = $linked && empty($payload['click_individual_parts']);
        $structure = $this->normaliseStructure((string) ($payload['structure'] ?? 'inline'));
        $targets = $this->resolveClickTargets($payload);
        $inner = $this->structureInner($payload, $resolved, $targets);

        if ($structure === 'figure') {
            if ($wholeItem) {
                return $this->wrapBody(
                    $payload,
                    $resolved,
                    '<figure class="smartlink-structure smartlink-structure--figure">' . $inner . '</figure>',
                    ['smartlink-structure-link', 'smartlink-structure-link--figure']
                );
            }

            return $this->wrapStaticBody($payload, $resolved, $inner, ['smartlink-structure', 'smartlink-structure--figure'], 'figure');
        }

        if ($structure === 'block') {
            if ($wholeItem) {
                return $this->wrapBody(
                    $payload,
                    $resolved,
                    '<div class="smartlink-structure smartlink-structure--block">' . $inner . '</div>',
                    ['smartlink-structure-link', 'smartlink-structure-link--block']
                );
            }

            return $this->wrapStaticBody($payload, $resolved, $inner, ['smartlink-structure', 'smartlink-structure--block'], 'div');
        }

        if ($wholeItem) {
            return $this->wrapBody($payload, $resolved, $inner, ['smartlink-structure', 'smartlink-structure--inline']);
        }

        return $this->wrapStaticBody($payload, $resolved, $inner, ['smartlink-structure', 'smartlink-structure--inline'], 'span');
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function buildInlineViewer(array $payload, array $resolved): string
    {
        $targets = $this->resolveClickTargets($payload);
        $body = $this->viewerBody($payload, $resolved, $targets);

        if ($body === '') {
            $fallbackPayload = $payload;
            $fallbackPayload['display_inside'] = false;

            return $this->buildStructuredOutput($fallbackPayload, $resolved);
        }

        $viewPosition = $this->normaliseViewPosition((string) ($payload['view_position'] ?? 'after'));
        $structure = $this->normaliseStructure((string) ($payload['structure'] ?? 'inline'));
        $supplementPayload = $payload;
        $supplementPayload['display_inside'] = false;
        $supplement = (!empty($payload['show_icon']) || !empty($payload['show_image']) || !empty($payload['show_text']))
            ? $this->buildStructuredOutput($supplementPayload, $resolved)
            : '';
        $parts = $viewPosition === 'after'
            ? $supplement . $body
            : $body . $supplement;

        return '<div class="smartlink smartlink-embed"><div class="smartlink-inline-viewer-stack smartlink-inline-viewer-stack--'
            . htmlspecialchars($structure, ENT_COMPAT, 'UTF-8')
            . '">'
            . $parts
            . '</div></div>';
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<string, bool>   $targets
     */
    private function viewerBody(array $payload, array $resolved, array $targets): string
    {
        $kind = (string) ($payload['kind'] ?? '');

        if ($kind === 'image') {
            $src = $this->normaliseMediaHref((string) ($resolved['href'] ?? $payload['value'] ?? ''));

            if ($src === '') {
                return '';
            }

            $body = sprintf(
                '<figure class="smartlink-image"><img src="%s" alt="%s" loading="lazy"></figure>',
                htmlspecialchars($src, ENT_COMPAT, 'UTF-8'),
                htmlspecialchars($this->imageAlt($payload, $resolved), ENT_COMPAT, 'UTF-8')
            );

            return $this->wrapPart($payload, $resolved, $body, !empty($targets['view']), ['smartlink-part-link--view']);
        }

        if ($kind === 'video') {
            return (string) ($resolved['embed'] ?? '');
        }

        if ($kind === 'gallery') {
            return $this->buildGalleryGrid($payload);
        }

        $href = $this->resolvedHref($payload, $resolved);

        if ($href === '' || $href === '#') {
            return '';
        }

        return sprintf(
            '<div class="smartlink-frame-embed"><iframe src="%s" loading="lazy"></iframe></div>',
            htmlspecialchars($href, ENT_COMPAT, 'UTF-8')
        );
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<string, bool>   $targets
     */
    private function viewerSupplement(array $payload, array $resolved, array $targets, bool $skipText = false, bool $skipIcon = false): string
    {
        $icon = $skipIcon ? '' : $this->iconPart($payload, $resolved, $targets);
        $image = $this->imagePart($payload, $resolved, $targets);
        $body = $skipText ? '' : $this->textBody($payload, $resolved, $targets);

        if ($icon === '' && $image === '' && $body === '') {
            return '';
        }

        return $this->wrapViewerSupplement((string) ($payload['structure'] ?? 'inline'), $image . $icon . $body);
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<string, bool>   $targets
     */
    private function structureInner(array $payload, array $resolved, array $targets): string
    {
        $icon = $this->iconPart($payload, $resolved, $targets);
        $image = $this->imagePart($payload, $resolved, $targets);
        $body = $this->textBody($payload, $resolved, $targets);
        $figureBody = $this->figureBody($icon, $body);

        if (($payload['structure'] ?? 'inline') === 'figure' && !empty($payload['figure_caption_text']) && $body !== '') {
            return $image . '<figcaption class="smartlink-structure__caption">' . $figureBody . '</figcaption>';
        }

        if (($payload['structure'] ?? 'inline') === 'figure') {
            return $image . $figureBody;
        }

        return $image . $icon . $body;
    }

    private function figureBody(string $icon, string $body): string
    {
        if ($icon !== '' && $body !== '') {
            return '<span class="smartlink-structure__caption-body">' . $icon . $body . '</span>';
        }

        return $body !== '' ? $body : $icon;
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<string, bool>   $targets
     */
    private function iconPart(array $payload, array $resolved, array $targets): string
    {
        if (empty($payload['show_icon'])) {
            return '';
        }

        return $this->wrapPart(
            $payload,
            $resolved,
            $this->iconMarkup((string) ($payload['icon_class'] ?? ''), (string) ($payload['kind'] ?? '')),
            !empty($targets['icon']),
            ['smartlink-part-link--icon']
        );
    }

    private function iconMarkup(string $iconClass, string $kind = ''): string
    {
        $iconClass = trim($iconClass) !== '' ? trim($iconClass) : $this->defaultIconClass($kind);

        return '<span class="smartlink-structure__icon ' . htmlspecialchars($iconClass, ENT_COMPAT, 'UTF-8') . '" aria-hidden="true"></span>';
    }

    private function defaultIconClass(string $kind): string
    {
        return match ($kind) {
            'anchor' => 'fa-solid fa-anchor',
            'email' => 'fa-solid fa-envelope',
            'phone' => 'fa-solid fa-phone',
            'com_content_article' => 'fa-regular fa-newspaper',
            'com_content_category' => 'fa-regular fa-folder-open',
            'menu_item' => 'fa-solid fa-bars',
            'com_tags_tag' => 'fa-solid fa-tags',
            'com_contact_contact', 'user_profile' => 'fa-regular fa-user',
            'media_file' => 'fa-regular fa-file',
            'image' => 'fa-regular fa-image',
            'video' => 'fa-solid fa-video',
            'gallery' => 'fa-regular fa-images',
            'advanced_route' => 'fa-solid fa-route',
            'external_url' => 'fa-solid fa-arrow-up-right-from-square',
            'relative_url' => 'fa-solid fa-link',
            default => 'fa-solid fa-link',
        };
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<string, bool>   $targets
     */
    private function imagePart(array $payload, array $resolved, array $targets): string
    {
        if (empty($payload['show_image'])) {
            return '';
        }

        $markup = $this->imageMarkup($payload, $resolved);

        if ($markup === '') {
            return '';
        }

        return $this->wrapPart($payload, $resolved, $markup, !empty($targets['thumbnail']), ['smartlink-part-link--thumbnail']);
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function imageMarkup(array $payload, array $resolved): string
    {
        $src = $this->imageSource($payload, $resolved);

        if ($src === '') {
            return '';
        }

        return sprintf(
            '<span class="smartlink-structure__image"><img src="%s" alt="%s" loading="lazy"></span>',
            htmlspecialchars($src, ENT_COMPAT, 'UTF-8'),
            htmlspecialchars($this->imageAlt($payload, $resolved), ENT_COMPAT, 'UTF-8')
        );
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<string, bool>   $targets
     */
    private function textBody(array $payload, array $resolved, array $targets): string
    {
        $parts = [];

        if (!empty($payload['show_type_label'])) {
            $parts[] = '<span class="smartlink-structure__type">' . htmlspecialchars($this->kindTypeLabel((string) ($payload['kind'] ?? '')), ENT_COMPAT, 'UTF-8') . '</span>';
        }

        if (!empty($payload['show_text'])) {
            $title = $this->primaryText($payload, $resolved);

            if ($title !== '') {
                $parts[] = '<span class="smartlink-structure__title">' . htmlspecialchars($title, ENT_COMPAT, 'UTF-8') . '</span>';
            }
        }

        if (!empty($payload['show_summary'])) {
            $summary = $this->summaryText($payload, $resolved);

            if ($summary !== '') {
                $parts[] = '<span class="smartlink-structure__summary">' . htmlspecialchars($summary, ENT_COMPAT, 'UTF-8') . '</span>';
            }
        }

        if ($parts === []) {
            return '';
        }

        $body = '<span class="smartlink-structure__body">' . implode('', $parts) . '</span>';

        return $this->wrapPart($payload, $resolved, $body, !empty($targets['text']), ['smartlink-part-link--text']);
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function buildTextLink(array $payload, array $resolved): string
    {
        $text = $this->primaryText($payload, $resolved);

        return $this->wrapBody($payload, $resolved, htmlspecialchars($text, ENT_COMPAT, 'UTF-8'));
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
            $itemPayload['kind'] = (($item['type'] ?? 'image') === 'video') ? 'video' : 'image';
            $itemPayload['value'] = $href;
            $itemPayload['label'] = (string) ($item['label'] ?? '');
            $itemPayload['selection_label'] = (string) (($item['label'] ?? '') ?: basename((string) parse_url($href, PHP_URL_PATH)));

            $links[] = $this->wrapBody(
                $itemPayload,
                ['href' => $href],
                htmlspecialchars($this->primaryText($itemPayload, ['href' => $href]), ENT_COMPAT, 'UTF-8')
            );
        }

        if ($links === []) {
            return '';
        }

        return '<div class="smartlink smartlink-links">' . implode('', $links) . '</div>';
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function buildGalleryGrid(array $payload): string
    {
        $items = \is_array($payload['value'] ?? null) ? $payload['value'] : [];
        $columns = max(1, (int) (($payload['gallery']['columns'] ?? 3)));
        $gap = max(0, (int) (($payload['gallery']['gap'] ?? 16)));
        $sizeMode = (string) (($payload['gallery']['image_size_mode'] ?? 'cover'));
        $html = [];

        foreach ($items as $item) {
            if (!\is_array($item) || empty($item['src'])) {
                continue;
            }

            $href = $this->normaliseMediaHref((string) $item['src']);

            if ($href === '') {
                continue;
            }

            if (($item['type'] ?? 'image') === 'video') {
                $html[] = '<span class="smartlink-gallery__item">'
                    . (!empty($item['poster'])
                        ? '<img src="' . htmlspecialchars($this->normaliseMediaHref((string) $item['poster']), ENT_COMPAT, 'UTF-8') . '" alt="' . htmlspecialchars((string) (($item['label'] ?? '') ?: 'Video'), ENT_COMPAT, 'UTF-8') . '" loading="lazy">'
                        : '<span class="smartlink-gallery__video-label">' . htmlspecialchars((string) (($item['label'] ?? '') ?: 'Video'), ENT_COMPAT, 'UTF-8') . '</span>')
                    . '</span>';
                continue;
            }

            $html[] = '<span class="smartlink-gallery__item"><img src="' . htmlspecialchars($href, ENT_COMPAT, 'UTF-8') . '" alt="' . htmlspecialchars((string) ($item['label'] ?? ''), ENT_COMPAT, 'UTF-8') . '" loading="lazy"></span>';
        }

        if ($html === []) {
            return '';
        }

        return sprintf(
            '<div class="smartlink-gallery smartlink-gallery--%s" style="--smartlink-gallery-columns:%d;--smartlink-gallery-gap:%dpx;">%s</div>',
            htmlspecialchars($sizeMode, ENT_COMPAT, 'UTF-8'),
            $columns,
            $gap,
            implode('', $html)
        );
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<int, string>    $extraClasses
     */
    private function wrapBody(array $payload, array $resolved, string $body, array $extraClasses = [], string $fallbackTag = 'span'): string
    {
        $tag = $this->tagForAction((string) ($payload['action'] ?? ''), $fallbackTag);
        $attributes = $tag === 'a'
            ? $this->buildAttributes($payload, $resolved, $extraClasses)
            : $this->buildStaticAttributes($payload, $resolved, $extraClasses);

        return sprintf('<%1$s %2$s>%3$s</%1$s>', $tag, $this->stringifyAttributes($attributes), $body);
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<int, string>    $extraClasses
     */
    private function wrapStaticBody(array $payload, array $resolved, string $body, array $extraClasses = [], string $tag = 'div'): string
    {
        $attributes = $this->buildStaticAttributes($payload, $resolved, $extraClasses);

        return sprintf('<%1$s %2$s>%3$s</%1$s>', $tag, $this->stringifyAttributes($attributes), $body);
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<int, string>    $extraClasses
     */
    private function wrapPart(array $payload, array $resolved, string $body, bool $active, array $extraClasses = []): string
    {
        if ($body === '') {
            return '';
        }

        if (!$active || ($payload['action'] ?? 'no_action') === 'no_action') {
            return $body;
        }

        return $this->wrapBody($payload, $resolved, $body, array_merge(['smartlink-part-link'], $extraClasses));
    }

    /**
     * @param   array<string, mixed>  $payload
     *
     * @return  array<string, bool>
     */
    private function resolveClickTargets(array $payload): array
    {
        $available = [
            'icon' => !empty($payload['show_icon']),
            'text' => !empty($payload['show_text']) && ($payload['kind'] ?? '') !== 'gallery',
            'thumbnail' => !empty($payload['show_image']),
            'view' => !empty($payload['display_inside']) && $this->canClickViewOnPage((string) ($payload['kind'] ?? '')),
        ];
        $targets = [
            'whole' => false,
            'icon' => false,
            'text' => false,
            'thumbnail' => false,
            'view' => false,
        ];

        if (($payload['action'] ?? 'no_action') === 'no_action') {
            return $targets;
        }

        if (empty($payload['click_individual_parts'])) {
            if (!empty($payload['display_inside'])) {
                return [
                    'whole' => false,
                    'icon' => $available['icon'],
                    'text' => $available['text'],
                    'thumbnail' => $available['thumbnail'],
                    'view' => $available['view'],
                ];
            }

            $targets['whole'] = true;

            return $targets;
        }

        $targets['icon'] = $available['icon'] && !empty($payload['click_icon']);
        $targets['text'] = $available['text'] && !empty($payload['click_text']);
        $targets['thumbnail'] = $available['thumbnail'] && !empty($payload['click_image']);
        $targets['view'] = $available['view'] && !empty($payload['click_view']);

        if (!$targets['icon'] && !$targets['text'] && !$targets['thumbnail'] && !$targets['view']) {
            foreach (['text', 'thumbnail', 'icon', 'view'] as $key) {
                if (!empty($available[$key])) {
                    $targets[$key] = true;
                    break;
                }
            }
        }

        return $targets;
    }

    /**
     * @param   array<string, bool>  $targets
     */
    private function hasClickableTarget(array $targets): bool
    {
        return !empty($targets['whole']) || !empty($targets['icon']) || !empty($targets['text']) || !empty($targets['thumbnail']) || !empty($targets['view']);
    }

    private function canClickViewOnPage(string $kind): bool
    {
        return $kind === 'image';
    }

    private function normaliseViewPosition(string $value): string
    {
        return \in_array($value, ['before', 'after'], true) ? $value : 'after';
    }

    private function wrapViewerSupplement(string $structure, string $content): string
    {
        if ($content === '') {
            return '';
        }

        if ($this->normaliseStructure($structure) === 'inline') {
            return '<span class="smartlink-structure smartlink-structure--inline smartlink-inline-viewer__meta smartlink-inline-viewer__meta--inline">' . $content . '</span>';
        }

        return '<div class="smartlink-inline-viewer__meta">' . $content . '</div>';
    }

    private function normaliseStructure(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['inline', 'block', 'figure'], true) ? $value : 'inline';
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function primaryText(array $payload, array $resolved): string
    {
        $text = trim((string) ($payload['label'] ?? ''));

        if ($text !== '') {
            return $text;
        }

        $text = trim((string) ($payload['selection_label'] ?? ''));

        if ($text !== '') {
            return $text;
        }

        $text = trim((string) ($resolved['title'] ?? $resolved['label'] ?? ''));

        if ($text !== '') {
            return $text;
        }

        $friendlyValue = $this->friendlyValueText($payload);

        if ($friendlyValue !== '') {
            return $friendlyValue;
        }

        $href = (string) ($resolved['href'] ?? $payload['value'] ?? '');
        $path = (string) parse_url($href, PHP_URL_PATH);

        return basename($path !== '' ? $path : $href) ?: 'Open';
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function friendlyValueText(array $payload): string
    {
        $value = trim((string) ($payload['value'] ?? ''));

        return match ((string) ($payload['kind'] ?? '')) {
            'anchor' => ltrim($value, '#'),
            'email' => preg_replace('/^mailto:/i', '', $value) ?: '',
            'phone' => preg_replace('/^tel:/i', '', $value) ?: '',
            default => $value,
        };
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function summaryText(array $payload, array $resolved): string
    {
        return trim((string) ($resolved['summary'] ?? $payload['selection_summary'] ?? ''));
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function imageSource(array $payload, array $resolved): string
    {
        $kind = (string) ($payload['kind'] ?? '');
        $override = trim((string) ($payload['image_override'] ?? ''));

        if ($override !== '') {
            return $this->normaliseMediaHref($override);
        }

        if ($kind === 'image') {
            return $this->normaliseMediaHref((string) ($resolved['href'] ?? $payload['value'] ?? ''));
        }

        if ($kind === 'video') {
            return $this->normaliseMediaHref((string) (($payload['video']['poster'] ?? '') ?: ($payload['preview_image'] ?? '')));
        }

        if ($kind === 'gallery') {
            $first = \is_array($payload['value'] ?? null) ? ($payload['value'][0] ?? null) : null;

            if (\is_array($first)) {
                return $this->normaliseMediaHref((string) (($first['poster'] ?? '') ?: ($first['src'] ?? '')));
            }
        }

        if (!empty($resolved['image'])) {
            return $this->normaliseMediaHref((string) $resolved['image']);
        }

        if (!empty($payload['selection_image'])) {
            return $this->normaliseMediaHref((string) $payload['selection_image']);
        }

        return $this->normaliseMediaHref((string) ($payload['preview_image'] ?? ''));
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function imageAlt(array $payload, array $resolved): string
    {
        return trim((string) (($payload['preview_alt'] ?? '') ?: ($resolved['image_alt'] ?? '') ?: ($payload['selection_image_alt'] ?? '') ?: $this->primaryText($payload, $resolved)));
    }

    private function kindTypeLabel(string $kind): string
    {
        return match ($kind) {
            'external_url' => 'External Link',
            'relative_url' => 'Relative Link',
            'anchor' => 'Anchor',
            'email' => 'Email',
            'phone' => 'Phone',
            'com_content_article' => 'Article',
            'com_content_category' => 'Category',
            'menu_item' => 'Menu Item',
            'com_tags_tag' => 'Tags',
            'com_contact_contact' => 'Contact',
            'user_profile' => 'User Profile',
            'advanced_route' => 'Advanced Route',
            'media_file' => 'Media File',
            'image' => 'Image',
            'video' => 'Video',
            'gallery' => 'Gallery',
            default => 'Item',
        };
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

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function resolvedHref(array $payload, array $resolved): string
    {
        return $this->applyPopupScope((string) ($resolved['href'] ?? '#'), $payload);
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<int, string>    $extraClasses
     *
     * @return  array<string, string>
     */
    private function buildAttributes(array $payload, array $resolved, array $extraClasses = []): array
    {
        $attributes = $this->buildBaseAttributes($payload, $resolved, $extraClasses);
        $attributes['href'] = $this->resolvedHref($payload, $resolved);

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
            $attributes['download'] = (string) (($payload['download_filename'] ?? '') ?: 'download');
        }

        if (($payload['action'] ?? '') === 'preview_modal') {
            $attributes['data-smartlink-preview'] = '1';
            $attributes['class'] = trim(($attributes['class'] ?? '') . ' js-smartlink-preview');

            if (!empty($payload['preview_image'])) {
                $attributes['data-preview-image'] = (string) $payload['preview_image'];
            }

            if (!empty($payload['preview_alt'])) {
                $attributes['data-preview-alt'] = (string) $payload['preview_alt'];
            }
        }

        return $attributes;
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<int, string>    $extraClasses
     *
     * @return  array<string, string>
     */
    private function buildStaticAttributes(array $payload, array $resolved, array $extraClasses = []): array
    {
        return $this->buildBaseAttributes($payload, $resolved, $extraClasses);
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<int, string>    $extraClasses
     *
     * @return  array<string, string>
     */
    private function buildBaseAttributes(array $payload, array $resolved, array $extraClasses = []): array
    {
        $attributes = [
            'title' => (string) ($payload['title'] ?? ''),
            'class' => trim(implode(' ', array_filter([
                'smartlink-link',
                (string) ($payload['css_class'] ?? ''),
                (string) ($resolved['class'] ?? ''),
                ...$extraClasses,
            ]))),
        ];

        foreach ((array) ($resolved['attributes'] ?? []) as $name => $value) {
            if (\in_array((string) $name, ['href', 'target', 'rel', 'download', 'data-smartlink-preview', 'data-preview-image', 'data-preview-alt'], true)) {
                continue;
            }

            if ($value !== null && $value !== '') {
                $attributes[(string) $name] = (string) $value;
            }
        }

        return $attributes;
    }

    /**
     * @param   array<string, string>  $attributes
     */
    private function stringifyAttributes(array $attributes): string
    {
        $htmlAttributes = [];

        foreach ($attributes as $name => $value) {
            if ($value === '') {
                continue;
            }

            $safeName = preg_replace('/[^A-Za-z0-9:_-]/', '', (string) $name) ?: 'data-attr';
            $htmlAttributes[] = sprintf('%s="%s"', $safeName, htmlspecialchars((string) $value, ENT_COMPAT, 'UTF-8'));
        }

        return implode(' ', $htmlAttributes);
    }

    private function tagForAction(string $action, string $fallback = 'span'): string
    {
        return $action === 'no_action' ? $fallback : 'a';
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function applyPopupScope(string $href, array $payload): string
    {
        if (($payload['action'] ?? '') !== 'preview_modal' || !\in_array((string) ($payload['kind'] ?? ''), ['com_content_article', 'com_content_category'], true)) {
            return $href;
        }

        if (($payload['popup_scope'] ?? 'component') !== 'component' || str_contains($href, 'tmpl=component')) {
            return $href;
        }

        return $href . (str_contains($href, '?') ? '&' : '?') . 'tmpl=component';
    }
}
