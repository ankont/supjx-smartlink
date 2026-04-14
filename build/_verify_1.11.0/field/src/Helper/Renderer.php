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
    /**
     * @var array<string, mixed>
     */
    private array $context = [];
    private int $toggleViewCounter = 0;

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

        $this->context = $context;

        $kind = (string) ($payload['kind'] ?? '');
        $resolved = $this->registry->get($kind)->resolve($payload);

        if (!empty($payload['display_inside']) || ($payload['action'] ?? '') === 'toggle_view') {
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
                    '<figure>' . $inner . '</figure>',
                    ['smartlink']
                );
            }

            return $this->wrapStaticBody($payload, $resolved, $inner, ['smartlink'], 'figure');
        }

        if ($structure === 'block') {
            if ($wholeItem) {
                return '<div class="smartlink-wrapper">'
                    . $this->wrapBody(
                        $payload,
                        $resolved,
                        $inner,
                        ['smartlink']
                    )
                    . '</div>';
            }

            if (!$linked) {
                return '<div class="smartlink-wrapper">'
                    . $this->wrapStaticBody($payload, $resolved, $inner, ['smartlink'], 'span')
                    . '</div>';
            }

            return '<div class="smartlink-wrapper">'
                . $this->wrapStaticBody($payload, $resolved, $inner, ['smartlink'], 'div')
                . '</div>';
        }

        if ($wholeItem) {
            return $this->wrapBody($payload, $resolved, $inner, ['smartlink']);
        }

        return $this->wrapStaticBody($payload, $resolved, $inner, ['smartlink'], 'span');
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function buildInlineViewer(array $payload, array $resolved): string
    {
        $payload = $this->withToggleContext($payload);
        $targets = $this->resolveClickTargets($payload);
        $body = $this->viewerBody($payload, $resolved, $targets);

        if ($body === '') {
            $fallbackPayload = $payload;
            $fallbackPayload['display_inside'] = false;

            return $this->buildStructuredOutput($fallbackPayload, $resolved);
        }

        if ($this->normaliseStructure((string) ($payload['structure'] ?? 'inline')) === 'figure') {
            return $this->buildFigureInlineViewer($payload, $resolved, $body);
        }

        $viewPosition = $this->normaliseViewPosition((string) ($payload['view_position'] ?? 'after'));
        $supplement = (!empty($payload['show_icon']) || !empty($payload['show_image']) || !empty($payload['show_text']))
            ? $this->buildViewerSupplement($payload, $resolved)
            : '';
        $parts = $viewPosition === 'after'
            ? $supplement . $body
            : $body . $supplement;
        $wrapperTag = $this->normaliseStructure((string) ($payload['structure'] ?? 'inline')) === 'block' ? 'div' : 'span';

        return sprintf('<%1$s class="smartlink-wrapper">%2$s</%1$s>', $wrapperTag, $parts);
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function buildViewerSupplement(array $payload, array $resolved): string
    {
        $supplementPayload = $payload;
        $supplementPayload['display_inside'] = false;
        $targets = $this->resolveClickTargets($supplementPayload);
        $inner = $this->structureInner($supplementPayload, $resolved, $targets);
        $linked = ($supplementPayload['action'] ?? 'no_action') !== 'no_action';
        $wholeItem = $linked && empty($supplementPayload['click_individual_parts']);

        if ($wholeItem) {
            return $this->wrapBody($supplementPayload, $resolved, $inner, ['smartlink']);
        }

        return $this->wrapStaticBody($supplementPayload, $resolved, $inner, ['smartlink'], 'span');
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function buildFigureInlineViewer(array $payload, array $resolved, string $viewBody): string
    {
        $supplementPayload = $payload;
        $supplementPayload['display_inside'] = false;
        $linked = ($supplementPayload['action'] ?? 'no_action') !== 'no_action';
        $wholeItem = $linked && empty($supplementPayload['click_individual_parts']);

        if ($wholeItem && empty($supplementPayload['figure_caption_text'])) {
            $targets = $this->resolveClickTargets($supplementPayload);
            $inner = $this->structureInner($supplementPayload, $resolved, $targets);
            $supplement = $this->wrapBody($supplementPayload, $resolved, $inner, [], 'span');
        } else {
            $figurePayload = $wholeItem
                ? [
                    ...$supplementPayload,
                    'click_individual_parts' => true,
                    'click_icon' => !empty($supplementPayload['show_icon']),
                    'click_text' => !empty($supplementPayload['show_text']) || !empty($supplementPayload['show_summary']) || !empty($supplementPayload['show_type_label']),
                    'click_image' => !empty($supplementPayload['show_image']),
                ]
                : $supplementPayload;
            $targets = $this->resolveClickTargets($figurePayload);
            $supplement = $this->structureInner($figurePayload, $resolved, $targets);
        }

        $viewPosition = $this->normaliseViewPosition((string) ($payload['view_position'] ?? 'after'));
        $parts = $viewPosition === 'after'
            ? $supplement . $viewBody
            : $viewBody . $supplement;

        return $this->wrapStaticBody($payload, $resolved, $parts, ['smartlink'], 'figure');
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
                '<figure %s><img %s alt="%s"></figure>',
                $this->stringifyAttributes($this->buildViewContainerAttributes($payload, ['smartlink-image'])),
                $this->mediaSourceAttributes($src, $payload, 'img'),
                htmlspecialchars($this->imageAlt($payload, $resolved), ENT_COMPAT, 'UTF-8')
            );

            return $this->wrapPart($payload, $resolved, $body, !empty($targets['view']), ['smartlink-part--view']);
        }

        if ($kind === 'video') {
            return $this->applyToggleViewAttributes((string) ($resolved['embed'] ?? ''), $payload);
        }

        if ($kind === 'gallery') {
            return $this->buildGalleryGrid($payload);
        }

        $href = $this->resolvedHref($payload, $resolved);

        if ($href === '' || $href === '#') {
            return '';
        }

        return sprintf(
            '<div %s><iframe %s></iframe></div>',
            $this->stringifyAttributes($this->buildViewContainerAttributes($payload, ['smartlink-view'], $this->iframeViewDataAttributes($href))),
            $this->mediaSourceAttributes($href, $payload, 'iframe')
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

        return $this->wrapViewerSupplement((string) ($payload['structure'] ?? 'inline'), $this->composeStructuredContent($payload, $image, $icon, $body));
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

        return $this->composeStructuredContent(
            $payload,
            $image,
            $icon,
            $body,
            ($payload['structure'] ?? 'inline') === 'figure' && !empty($payload['figure_caption_text']) && $body !== ''
        );
    }

    private function figureBody(string $icon, string $body): string
    {
        if ($icon !== '' && $body !== '') {
            return '<span class="smartlink-caption-body">' . $this->spacedInline($icon, $body) . '</span>';
        }

        return $this->spacedInline($icon, $body);
    }

    private function spacedInline(string $icon, string $body): string
    {
        if ($icon !== '' && $body !== '') {
            return $icon . ' ' . $body;
        }

        return $body !== '' ? $body : $icon;
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function thumbnailAfterContent(array $payload): bool
    {
        return ($this->effectiveThumbnailSettings($payload)['position'] ?? 'inline') === 'bottom';
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function composeStructuredContent(array $payload, string $image, string $icon, string $body, bool $useCaption = false): string
    {
        if (($payload['structure'] ?? 'inline') === 'figure') {
            $figureText = $this->figureBody($icon, $body);
            $figureContent = $useCaption
                ? ($figureText !== '' ? '<figcaption class="smartlink-caption">' . $figureText . '</figcaption>' : '')
                : $figureText;

            return $this->thumbnailAfterContent($payload)
                ? $figureContent . $image
                : $image . $figureContent;
        }

        $inline = $this->spacedInline($icon, $body);

        return $this->thumbnailAfterContent($payload)
            ? $inline . $image
            : $image . $inline;
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
            ['smartlink-part--icon']
        );
    }

    private function iconMarkup(string $iconClass, string $kind = ''): string
    {
        $iconClass = trim($iconClass) !== '' ? trim($iconClass) : $this->defaultIconClass($kind);

        return '<span class="smartlink-icon ' . htmlspecialchars($iconClass, ENT_COMPAT, 'UTF-8') . '" aria-hidden="true">&#8203;</span>';
    }

    private function defaultIconClass(string $kind): string
    {
        return match ($kind) {
            'anchor' => 'fa-solid fa-thumbtack',
            'email' => 'fa-solid fa-envelope',
            'phone' => 'fa-solid fa-phone',
            'com_content_article' => 'fa-regular fa-newspaper',
            'com_content_category' => 'fa-regular fa-folder-open',
            'menu_item' => 'fa-solid fa-sitemap',
            'com_tags_tag' => 'fa-solid fa-tags',
            'com_contact_contact', 'user_profile' => 'fa-regular fa-user',
            'media_file' => 'fa-regular fa-file-lines',
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

        return $this->wrapPart($payload, $resolved, $markup, !empty($targets['thumbnail']), ['smartlink-part--image']);
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function imageMarkup(array $payload, array $resolved): string
    {
        $settings = $this->effectiveThumbnailSettings($payload);
        $src = $this->imageSource($payload, $resolved);
        $classes = $this->thumbnailClasses($settings, $src === '');
        if ($src !== '') {
            return sprintf(
                '<span class="%s"><img src="%s" alt="%s" loading="lazy"></span>',
                htmlspecialchars(implode(' ', $classes), ENT_COMPAT, 'UTF-8'),
                htmlspecialchars($src, ENT_COMPAT, 'UTF-8'),
                htmlspecialchars($this->imageAlt($payload, $resolved), ENT_COMPAT, 'UTF-8')
            );
        }

        if ($settings['mode'] === 'empty') {
            return sprintf(
                '<span class="%s"></span>',
                htmlspecialchars(implode(' ', $classes), ENT_COMPAT, 'UTF-8')
            );
        }

        return sprintf(
            '<span class="%s"><span class="%s" aria-hidden="true"></span></span>',
            htmlspecialchars(implode(' ', $classes), ENT_COMPAT, 'UTF-8'),
            htmlspecialchars($settings['emptyClass'], ENT_COMPAT, 'UTF-8')
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
            $parts[] = '<span class="smartlink-type">' . htmlspecialchars($this->kindTypeLabel((string) ($payload['kind'] ?? '')), ENT_COMPAT, 'UTF-8') . '</span>';
        }

        if (!empty($payload['show_text'])) {
            $title = $this->primaryText($payload, $resolved);

            if ($title !== '') {
                $parts[] = htmlspecialchars($title, ENT_COMPAT, 'UTF-8');
            }
        }

        if (!empty($payload['show_summary'])) {
            $summary = $this->summaryText($payload, $resolved);

            if ($summary !== '') {
                $parts[] = '<span class="smartlink-summary">' . htmlspecialchars($summary, ENT_COMPAT, 'UTF-8') . '</span>';
            }
        }

        if ($parts === []) {
            return '';
        }

        $body = implode('', $parts);

        return $this->wrapPart($payload, $resolved, $body, !empty($targets['text']), ['smartlink-part--text']);
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
                $html[] = '<span class="smartlink-item">'
                    . (!empty($item['poster'])
                        ? '<img ' . $this->mediaSourceAttributes($this->normaliseMediaHref((string) $item['poster']), $payload, 'img') . ' alt="' . htmlspecialchars((string) (($item['label'] ?? '') ?: 'Video'), ENT_COMPAT, 'UTF-8') . '">'
                        : '<span class="smartlink-item-label">' . htmlspecialchars((string) (($item['label'] ?? '') ?: 'Video'), ENT_COMPAT, 'UTF-8') . '</span>')
                    . '</span>';
                continue;
            }

            $html[] = '<span class="smartlink-item"><img ' . $this->mediaSourceAttributes($href, $payload, 'img') . ' alt="' . htmlspecialchars((string) ($item['label'] ?? ''), ENT_COMPAT, 'UTF-8') . '"></span>';
        }

        if ($html === []) {
            return '';
        }

        return sprintf(
            '<div %s>%s</div>',
            $this->stringifyAttributes($this->buildViewContainerAttributes(
                $payload,
                ['smartlink-view', 'smartlink-gallery', 'smartlink-gallery--' . $sizeMode],
                ['style' => sprintf('--smartlink-gallery-columns:%d;--smartlink-gallery-gap:%dpx;', $columns, $gap)]
            )),
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
            : ($tag === 'button'
                ? $this->buildButtonAttributes($payload, $resolved, $extraClasses)
                : $this->buildStaticAttributes($payload, $resolved, $extraClasses));

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

        return $this->wrapBody($payload, $resolved, $body, array_merge(['smartlink-part'], $extraClasses));
    }

    /**
     * @param   array<string, mixed>  $payload
     *
     * @return  array<string, bool>
     */
    private function resolveClickTargets(array $payload): array
    {
        $toggleAction = ($payload['action'] ?? 'no_action') === 'toggle_view';
        $available = [
            'icon' => !empty($payload['show_icon']),
            'text' => !empty($payload['show_text']) && ($payload['kind'] ?? '') !== 'gallery',
            'thumbnail' => !empty($payload['show_image']),
            'view' => !$toggleAction && !empty($payload['display_inside']) && $this->canClickViewOnPage((string) ($payload['kind'] ?? '')),
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
            return '<span class="smartlink-inline-viewer__meta smartlink-inline-viewer__meta--inline">' . $content . '</span>';
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
            'external_url' => preg_replace('/^https?:\/\//i', '', $value) ?: '',
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

    /**
     * @return array{mode:string,emptyClass:string,position_raw:string,ratio_raw:string,fit_raw:string,size_raw:string,position:string,ratio:string,fit:string,size:string}
     */
    private function thumbnailDefaults(): array
    {
        $positionRaw = $this->normaliseConfiguredThumbnailPosition((string) ($this->context['thumbnail_position'] ?? 'inline'));
        $ratioRaw = $this->normaliseConfiguredThumbnailRatio((string) ($this->context['thumbnail_ratio'] ?? 'auto'));
        $fitRaw = $this->normaliseConfiguredThumbnailFit((string) ($this->context['thumbnail_fit'] ?? 'cover'));
        $sizeRaw = $this->normaliseConfiguredThumbnailSize((string) ($this->context['thumbnail_size'] ?? 'md'));

        return [
            'mode' => $this->normaliseThumbnailEmptyMode((string) ($this->context['thumbnail_empty_mode'] ?? 'generic')),
            'emptyClass' => $this->normaliseConfiguredThumbnailEmptyClass((string) ($this->context['thumbnail_empty_class'] ?? 'smartlink-image-empty')),
            'position_raw' => $positionRaw,
            'ratio_raw' => $ratioRaw,
            'fit_raw' => $fitRaw,
            'size_raw' => $sizeRaw,
            'position' => $positionRaw === 'inherit' ? 'inline' : $positionRaw,
            'ratio' => $ratioRaw === 'inherit' ? 'auto' : $ratioRaw,
            'fit' => $fitRaw === 'inherit' ? 'cover' : $fitRaw,
            'size' => $sizeRaw === 'inherit' ? 'md' : $sizeRaw,
        ];
    }

    /**
     * @param   array<string, mixed>  $payload
     *
     * @return array{mode:string,emptyClass:string,override:bool,position:string,ratio:string,fit:string,size:string,emitPosition:bool,emitRatio:bool,emitFit:bool,emitSize:bool}
     */
    private function effectiveThumbnailSettings(array $payload): array
    {
        $defaults = $this->thumbnailDefaults();
        $allowSpecificOverride = $defaults['mode'] === 'specific';
        $positionOverride = $this->normaliseOptionalThumbnailPosition((string) ($payload['thumbnail_position'] ?? ''));
        $ratioOverride = $this->normaliseOptionalThumbnailRatio((string) ($payload['thumbnail_ratio'] ?? ''));
        $fitOverride = $this->normaliseOptionalThumbnailFit((string) ($payload['thumbnail_fit'] ?? ''));
        $sizeOverride = $this->normaliseOptionalThumbnailSize((string) ($payload['thumbnail_size'] ?? ''));
        $override = $this->normaliseBoolean($payload['thumbnail_override'] ?? false, false)
            || $positionOverride !== ''
            || $ratioOverride !== ''
            || $fitOverride !== ''
            || $sizeOverride !== '';

        return [
            'mode' => $defaults['mode'],
            'emptyClass' => $allowSpecificOverride
                ? $this->normaliseConfiguredThumbnailEmptyClass((string) ($payload['thumbnail_empty_class'] ?? $defaults['emptyClass']))
                : $defaults['emptyClass'],
            'override' => $override,
            'position' => $override ? ($positionOverride !== '' ? $positionOverride : 'inline') : $defaults['position'],
            'ratio' => $override ? ($ratioOverride !== '' ? $ratioOverride : 'auto') : $defaults['ratio'],
            'fit' => $override ? ($fitOverride !== '' ? $fitOverride : 'cover') : $defaults['fit'],
            'size' => $override ? ($sizeOverride !== '' ? $sizeOverride : 'md') : $defaults['size'],
            'emitPosition' => $override ? $positionOverride !== '' : $defaults['position'] !== 'inline',
            'emitRatio' => $override ? $ratioOverride !== '' : $defaults['ratio'] !== 'auto',
            'emitFit' => $override ? $fitOverride !== '' : $defaults['fit'] !== 'cover',
            'emitSize' => $override ? $sizeOverride !== '' : $defaults['size'] !== 'md',
        ];
    }

    /**
     * @param   array{mode:string,emptyClass:string,position:string,ratio:string,fit:string,size:string}  $settings
     *
     * @return  array<int, string>
     */
    private function thumbnailClasses(array $settings, bool $empty): array
    {
        return array_values(array_filter([
            'smartlink-thumb',
            ...($settings['emitSize'] ? $this->mappedThumbnailClasses('size', $settings['size']) : []),
            ...($settings['emitPosition'] ? $this->mappedThumbnailClasses('position', $settings['position']) : []),
            ...($settings['emitRatio'] ? $this->mappedThumbnailClasses('ratio', $settings['ratio']) : []),
            ...($settings['emitFit'] ? $this->mappedThumbnailClasses('fit', $settings['fit']) : []),
            $empty ? 'smartlink-thumb--empty' : '',
        ]));
    }

    private function normaliseThumbnailEmptyMode(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['empty', 'generic', 'specific'], true) ? $value : 'generic';
    }

    private function normaliseConfiguredThumbnailEmptyClass(string $value): string
    {
        $value = trim($value);

        return $value !== '' ? $value : 'smartlink-image-empty';
    }

    private function normaliseThumbnailRatio(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['auto', '1-1', '4-3', '16-9'], true) ? $value : 'auto';
    }

    private function normaliseThumbnailFit(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['cover', 'contain', 'fill', 'none', 'scale-down'], true) ? $value : 'cover';
    }

    private function normaliseThumbnailPosition(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['inline', 'top', 'bottom', 'left', 'right'], true) ? $value : 'inline';
    }

    private function normaliseThumbnailSize(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['sm', 'md', 'lg'], true) ? $value : 'md';
    }

    private function normaliseOptionalThumbnailRatio(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? '' : $this->normaliseThumbnailRatio($value);
    }

    private function normaliseOptionalThumbnailFit(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? '' : $this->normaliseThumbnailFit($value);
    }

    private function normaliseOptionalThumbnailPosition(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? '' : $this->normaliseThumbnailPosition($value);
    }

    private function normaliseOptionalThumbnailSize(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? '' : $this->normaliseThumbnailSize($value);
    }

    private function normaliseConfiguredThumbnailRatio(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? 'inherit' : $this->normaliseThumbnailRatio($value);
    }

    private function normaliseConfiguredThumbnailFit(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? 'inherit' : $this->normaliseThumbnailFit($value);
    }

    private function normaliseConfiguredThumbnailPosition(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? 'inherit' : $this->normaliseThumbnailPosition($value);
    }

    private function normaliseConfiguredThumbnailSize(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? 'inherit' : $this->normaliseThumbnailSize($value);
    }

    /**
     * @param   mixed  $value
     */
    private function normaliseBoolean($value, bool $fallback = false): bool
    {
        if (\is_bool($value)) {
            return $value;
        }

        if (\is_int($value) || \is_float($value)) {
            return (bool) $value;
        }

        if (\is_string($value)) {
            $value = strtolower(trim($value));

            if (\in_array($value, ['1', 'true', 'yes', 'on'], true)) {
                return true;
            }

            if (\in_array($value, ['0', 'false', 'no', 'off', ''], true)) {
                return false;
            }
        }

        return $fallback;
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function thumbnailClassMappings(): array
    {
        $defaults = [
            'position' => [
                'inline' => 'smartlink-thumb--inline',
                'top' => 'smartlink-thumb--top',
                'bottom' => 'smartlink-thumb--bottom',
                'left' => 'smartlink-thumb--left',
                'right' => 'smartlink-thumb--right',
            ],
            'ratio' => [
                'auto' => 'smartlink-thumb--ratio-auto',
                '1-1' => 'smartlink-thumb--ratio-1-1',
                '4-3' => 'smartlink-thumb--ratio-4-3',
                '16-9' => 'smartlink-thumb--ratio-16-9',
            ],
            'fit' => [
                'cover' => 'smartlink-thumb--fit-cover',
                'contain' => 'smartlink-thumb--fit-contain',
                'fill' => 'smartlink-thumb--fit-fill',
                'none' => 'smartlink-thumb--fit-none',
                'scale-down' => 'smartlink-thumb--fit-scale-down',
            ],
            'size' => [
                'sm' => 'smartlink-thumb--sm',
                'md' => 'smartlink-thumb--md',
                'lg' => 'smartlink-thumb--lg',
            ],
        ];

        if ($this->normaliseBoolean($this->context['use_smartlink_styles'] ?? true, true)) {
            return $defaults;
        }

        return [
            'position' => [
                'inline' => trim((string) ($this->context['thumbnail_position_class_inline'] ?? $defaults['position']['inline'])),
                'top' => trim((string) ($this->context['thumbnail_position_class_top'] ?? $defaults['position']['top'])),
                'bottom' => trim((string) ($this->context['thumbnail_position_class_bottom'] ?? $defaults['position']['bottom'])),
                'left' => trim((string) ($this->context['thumbnail_position_class_left'] ?? $defaults['position']['left'])),
                'right' => trim((string) ($this->context['thumbnail_position_class_right'] ?? $defaults['position']['right'])),
            ],
            'ratio' => [
                'auto' => trim((string) ($this->context['thumbnail_ratio_class_auto'] ?? $defaults['ratio']['auto'])),
                '1-1' => trim((string) ($this->context['thumbnail_ratio_class_1_1'] ?? $defaults['ratio']['1-1'])),
                '4-3' => trim((string) ($this->context['thumbnail_ratio_class_4_3'] ?? $defaults['ratio']['4-3'])),
                '16-9' => trim((string) ($this->context['thumbnail_ratio_class_16_9'] ?? $defaults['ratio']['16-9'])),
            ],
            'fit' => [
                'cover' => trim((string) ($this->context['thumbnail_fit_class_cover'] ?? $defaults['fit']['cover'])),
                'contain' => trim((string) ($this->context['thumbnail_fit_class_contain'] ?? $defaults['fit']['contain'])),
                'fill' => trim((string) ($this->context['thumbnail_fit_class_fill'] ?? $defaults['fit']['fill'])),
                'none' => trim((string) ($this->context['thumbnail_fit_class_none'] ?? $defaults['fit']['none'])),
                'scale-down' => trim((string) ($this->context['thumbnail_fit_class_scale_down'] ?? $defaults['fit']['scale-down'])),
            ],
            'size' => [
                'sm' => trim((string) ($this->context['thumbnail_size_class_sm'] ?? $defaults['size']['sm'])),
                'md' => trim((string) ($this->context['thumbnail_size_class_md'] ?? $defaults['size']['md'])),
                'lg' => trim((string) ($this->context['thumbnail_size_class_lg'] ?? $defaults['size']['lg'])),
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function mappedThumbnailClasses(string $group, string $value): array
    {
        $raw = (string) ($this->thumbnailClassMappings()[$group][$value] ?? '');

        return array_values(array_filter(preg_split('/\s+/', trim($raw)) ?: []));
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
            'advanced_route' => 'Joomla Path',
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

        $marker = '#joomlaImage://';
        $markerPosition = strpos($value, $marker);

        if ($markerPosition !== false) {
            $value = trim(substr($value, 0, $markerPosition));
        }

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
            $attributes['data-preview'] = '1';
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
    private function buildButtonAttributes(array $payload, array $resolved, array $extraClasses = []): array
    {
        $attributes = $this->buildBaseAttributes($payload, $resolved, $extraClasses);
        $buttonClasses = $this->linkButtonClasses();
        $attributes['class'] = trim(implode(' ', array_filter([
            (string) ($attributes['class'] ?? ''),
            ...$buttonClasses,
        ])));
        $attributes['type'] = 'button';

        if (($payload['action'] ?? '') === 'toggle_view') {
            $attributes['data-toggle-view'] = '1';
            $attributes['aria-expanded'] = !empty($payload['display_inside']) ? 'true' : 'false';

            $targetId = trim((string) ($payload['_toggle_id'] ?? ''));

            if ($targetId !== '') {
                $attributes['aria-controls'] = $targetId;
            }
        }

        return $attributes;
    }

    /**
     * @return array<int, string>
     */
    private function linkButtonClasses(): array
    {
        if ($this->normaliseBoolean($this->context['use_smartlink_styles'] ?? true, true)) {
            return ['smartlink-actionbtn'];
        }

        $raw = trim((string) ($this->context['link_button_class'] ?? 'smartlink-actionbtn'));

        return array_values(array_filter(preg_split('/\s+/', $raw !== '' ? $raw : 'smartlink-actionbtn') ?: []));
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
                (string) ($payload['css_class'] ?? ''),
                (string) ($resolved['class'] ?? ''),
                ...$extraClasses,
            ]))),
        ];

        foreach ((array) ($resolved['attributes'] ?? []) as $name => $value) {
            if (\in_array((string) $name, ['href', 'target', 'rel', 'download', 'data-preview', 'data-preview-image', 'data-preview-alt', 'type', 'data-toggle-view', 'aria-controls', 'aria-expanded'], true)) {
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
        if ($action === 'toggle_view') {
            return 'button';
        }

        return $action === 'no_action' ? $fallback : 'a';
    }

    /**
     * @param   array<string, mixed>  $payload
     *
     * @return  array<string, mixed>
     */
    private function withToggleContext(array $payload): array
    {
        if (($payload['action'] ?? '') !== 'toggle_view' || !empty($payload['_toggle_id'])) {
            return $payload;
        }

        $payload['_toggle_id'] = 'smartlink-view-' . ++$this->toggleViewCounter;

        return $payload;
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function shouldDeferViewMedia(array $payload): bool
    {
        return ($payload['action'] ?? '') === 'toggle_view' && empty($payload['display_inside']);
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function mediaSourceAttributes(string $src, array $payload, string $tag = 'iframe'): string
    {
        $src = trim($src);

        if ($src === '') {
            return '';
        }

        if ($this->shouldDeferViewMedia($payload)) {
            return 'data-src="' . htmlspecialchars($src, ENT_COMPAT, 'UTF-8') . '"';
        }

        return ($tag === 'img'
            ? 'src="' . htmlspecialchars($src, ENT_COMPAT, 'UTF-8') . '" loading="lazy"'
            : 'src="' . htmlspecialchars($src, ENT_COMPAT, 'UTF-8') . '"');
    }

    /**
     * @return array<string, string>
     */
    private function iframeViewDataAttributes(string $src, bool $allowFullscreen = false): array
    {
        $src = trim($src);

        if ($src === '') {
            return [];
        }

        $attributes = [
            'data-src' => $src,
            'data-embed' => 'iframe',
        ];

        if ($allowFullscreen) {
            $attributes['data-allowfullscreen'] = '1';
        }

        return $attributes;
    }

    /**
     * @param   array<string, mixed>   $payload
     * @param   array<int, string>     $classes
     * @param   array<string, string>  $extra
     *
     * @return  array<string, string>
     */
    private function buildViewContainerAttributes(array $payload, array $classes, array $extra = []): array
    {
        $attributes = [
            'class' => trim(implode(' ', array_filter($classes))),
        ];

        $targetId = trim((string) ($payload['_toggle_id'] ?? ''));

        if ($targetId !== '') {
            $attributes['id'] = $targetId;
        }

        if (($payload['action'] ?? '') === 'toggle_view' && empty($payload['display_inside'])) {
            $attributes['hidden'] = 'hidden';
        }

        foreach ($extra as $name => $value) {
            if ($value !== '') {
                $attributes[$name] = $value;
            }
        }

        return $attributes;
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function applyToggleViewAttributes(string $embed, array $payload): string
    {
        $embed = trim($embed);

        if ($embed === '' || ($payload['action'] ?? '') !== 'toggle_view') {
            return $embed;
        }

        $targetId = trim((string) ($payload['_toggle_id'] ?? ''));

        if ($targetId === '') {
            return $embed;
        }

        if ($this->shouldDeferViewMedia($payload)) {
            $embed = preg_replace_callback(
                '/<iframe\b([^>]*)\bsrc=(["\'])(.*?)\2([^>]*)>/i',
                static function (array $matches): string {
                    $attributes = trim(($matches[1] ?? '') . ' ' . ($matches[4] ?? ''));
                    $attributes = preg_replace('/\sloading=(["\']).*?\1/i', '', ' ' . $attributes) ?: (' ' . $attributes);
                    $attributes = preg_replace('/\sdata-src=(["\']).*?\1/i', '', $attributes) ?: $attributes;

                    return sprintf(
                        '<iframe%s data-src="%s">',
                        rtrim($attributes),
                        htmlspecialchars((string) ($matches[3] ?? ''), ENT_COMPAT, 'UTF-8')
                    );
                },
                $embed,
                1
            ) ?: $embed;
        }

        if (preg_match('/^<div\b[^>]*\bclass=(["\'])(?:(?!\1).)*\bsmartlink-view\b(?:(?!\1).)*\1/i', $embed)) {
            return preg_replace(
                '/^<div\b([^>]*)>/i',
                '<div$1 id="' . htmlspecialchars($targetId, ENT_COMPAT, 'UTF-8') . '"' . (!empty($payload['display_inside']) ? '' : ' hidden') . '>',
                $embed,
                1
            ) ?: $embed;
        }

        return sprintf(
            '<div %s>%s</div>',
            $this->stringifyAttributes($this->buildViewContainerAttributes($payload, ['smartlink-view'])),
            $embed
        );
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function applyPopupScope(string $href, array $payload): string
    {
        if (!\in_array((string) ($payload['kind'] ?? ''), ['com_content_article', 'com_content_category', 'menu_item', 'com_tags_tag', 'com_contact_contact', 'user_profile', 'advanced_route', 'relative_url'], true)
            || (($payload['action'] ?? '') !== 'preview_modal' && ($payload['action'] ?? '') !== 'toggle_view' && empty($payload['display_inside']))) {
            return $href;
        }

        $scope = trim((string) ($payload['popup_scope'] ?? 'component'));
        $uri = new Uri($href);
        $allowsContentOnly = ($payload['kind'] ?? '') === 'com_content_article';

        if ($scope === 'component' || $scope === 'content') {
            $uri->setVar('tmpl', 'component');
        } elseif ($uri->getVar('tmpl') === 'component') {
            $uri->delVar('tmpl');
        }

        if ($scope === 'content' && $allowsContentOnly) {
            $uri->setVar('smartlink', 'content');
        } elseif ($uri->getVar('smartlink') === 'content') {
            $uri->delVar('smartlink');
        }

        if (preg_match('#^(?:https?:)?//#i', $href)) {
            return $uri->toString();
        }

        return $uri->toString(['path', 'query', 'fragment']);
    }
}
