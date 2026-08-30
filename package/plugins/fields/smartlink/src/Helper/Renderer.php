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

    /**
     * @param   array<string, mixed>  $contract
     * @param   array<string, mixed>  $context
     */
    public function render(array $contract, array $context = []): string
    {
        if (!\is_array($contract['resolved'] ?? null) || !\is_array($contract['presentation'] ?? null)) {
            return '';
        }

        $this->context = $context;
        $resolved = $contract['resolved'];
        $payload = $this->rendererPayload($contract);
        $kind = (string) ($resolved['kind'] ?? '');

        if (
            !empty($payload['display_inside'])
            || ($payload['action'] ?? '') === 'toggle_view'
            || ($kind === 'gallery' && ($payload['action'] ?? '') === 'preview_modal')
        ) {
            return $this->buildInlineViewer($payload, $resolved);
        }

        return $this->buildStructuredOutput($payload, $resolved);
    }

    /**
     * Adapt the public effective state to the renderer's composition helpers.
     * No defaults or resolver logic are applied here.
     *
     * @param   array<string, mixed>  $contract
     *
     * @return  array<string, mixed>
     */
    private function rendererPayload(array $contract): array
    {
        $resolved = (array) ($contract['resolved'] ?? []);
        $presentation = (array) ($contract['presentation'] ?? []);
        $thumbnail = (array) ($presentation['thumbnail'] ?? []);
        $linkedParts = (array) ($presentation['linked_parts'] ?? []);
        $gallery = (array) ($presentation['gallery'] ?? []);

        return [
            'kind' => (string) ($resolved['kind'] ?? ''),
            'value' => (string) ($resolved['href'] ?? ''),
            'action' => (string) ($presentation['action'] ?? 'no_action'),
            'label' => (string) ($presentation['visible_text'] ?? ''),
            'selection_label' => (string) ($resolved['display_name'] ?? ''),
            'title' => (string) ($presentation['html_title'] ?? ''),
            'target' => (string) ($presentation['target'] ?? ''),
            'rel' => (string) ($presentation['rel'] ?? ''),
            'css_class' => (string) ($presentation['css_class'] ?? ''),
            'icon_class' => (string) ($presentation['icon_class'] ?? ''),
            'download_filename' => (string) ($presentation['download_filename'] ?? ''),
            'popup_scope' => (string) ($presentation['popup_scope'] ?? 'component'),
            'preview_image' => (string) ($presentation['popup_image'] ?? ''),
            'image_override' => (string) ($presentation['image'] ?? ''),
            'preview_alt' => (string) ($presentation['image_alt'] ?? ''),
            'show_icon' => !empty($presentation['show_icon']),
            'show_image' => !empty($presentation['show_image']),
            'show_text' => !empty($presentation['show_text']),
            'display_inside' => !empty($presentation['display_inside']),
            'click_individual_parts' => !empty($linkedParts['enabled']),
            'click_icon' => !empty($linkedParts['icon']),
            'click_text' => !empty($linkedParts['text']),
            'click_image' => !empty($linkedParts['thumbnail']),
            'click_view' => !empty($linkedParts['view']),
            'structure' => (string) ($presentation['structure'] ?? 'inline'),
            'view_position' => (string) ($presentation['view_position'] ?? 'after'),
            'show_summary' => !empty($presentation['show_summary']),
            'show_type_label' => !empty($presentation['show_type_label']),
            'figure_caption_text' => !empty($presentation['figure_caption_text']),
            'thumbnail_empty_mode' => (string) ($thumbnail['empty_mode'] ?? 'generic'),
            'thumbnail_empty_class' => (string) ($thumbnail['empty_class'] ?? ''),
            'thumbnail_position' => (string) ($thumbnail['position'] ?? 'inline'),
            'thumbnail_ratio' => (string) ($thumbnail['ratio'] ?? 'auto'),
            'thumbnail_fit' => (string) ($thumbnail['fit'] ?? 'cover'),
            'thumbnail_size' => (string) ($thumbnail['size'] ?? 'md'),
            'video' => (array) ($presentation['video'] ?? []),
            'gallery' => [
                'mode' => (string) ($gallery['mode'] ?? 'grid'),
                'columns' => (int) ($gallery['columns'] ?? 3),
                'gap' => (int) ($gallery['gap'] ?? 16),
                'image_size_mode' => (string) ($gallery['fit'] ?? 'cover'),
            ],
        ];
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
                htmlspecialchars($this->imageAlt($payload), ENT_COMPAT, 'UTF-8')
            );

            return $this->wrapPart($payload, $resolved, $body, !empty($targets['view']), ['smartlink-part--view']);
        }

        if ($kind === 'video') {
            return $this->buildVideoViewer($payload, $resolved);
        }

        if ($kind === 'gallery') {
            return $this->buildGallery($payload, $resolved);
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
        $src = $this->imageSource($payload);
        $classes = $this->thumbnailClasses($settings, $src === '');
        if ($src !== '') {
            return sprintf(
                '<span class="%s"><img src="%s" alt="%s" loading="lazy"></span>',
                htmlspecialchars(implode(' ', $classes), ENT_COMPAT, 'UTF-8'),
                htmlspecialchars($src, ENT_COMPAT, 'UTF-8'),
                htmlspecialchars($this->imageAlt($payload), ENT_COMPAT, 'UTF-8')
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
            $typeLabel = trim((string) ($resolved['type_label'] ?? ''));
            $parts[] = '<span class="smartlink-type">' . htmlspecialchars($typeLabel, ENT_COMPAT, 'UTF-8') . '</span>';
        }

        if (!empty($payload['show_text'])) {
            $title = $this->primaryText($payload);

            if ($title !== '') {
                $parts[] = htmlspecialchars($title, ENT_COMPAT, 'UTF-8');
            }
        }

        if (!empty($payload['show_summary'])) {
            $summary = $this->summaryText($resolved);

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
        $text = $this->primaryText($payload);

        return $this->wrapBody($payload, $resolved, htmlspecialchars($text, ENT_COMPAT, 'UTF-8'));
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function buildGallery(array $payload, array $resolved): string
    {
        $items = \is_array($resolved['items'] ?? null) ? $resolved['items'] : [];
        $mode = (string) ($payload['gallery']['mode'] ?? 'grid');

        if ($mode === 'viewer' || $mode === 'viewer_with_strip') {
            return $this->buildGalleryViewer($payload, $items, $mode === 'viewer_with_strip');
        }

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
                        ? '<img ' . $this->mediaSourceAttributes($this->normaliseMediaHref((string) $item['poster']), $payload, 'img') . ' alt="' . htmlspecialchars((string) (($item['display_name'] ?? '') ?: 'Video'), ENT_COMPAT, 'UTF-8') . '">'
                        : '<span class="smartlink-item-label">' . htmlspecialchars((string) (($item['display_name'] ?? '') ?: 'Video'), ENT_COMPAT, 'UTF-8') . '</span>')
                    . '</span>';
                continue;
            }

            $html[] = '<span class="smartlink-item"><img ' . $this->mediaSourceAttributes($href, $payload, 'img') . ' alt="' . htmlspecialchars((string) ($item['display_name'] ?? ''), ENT_COMPAT, 'UTF-8') . '"></span>';
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
     * @param   array<string, mixed>              $payload
     * @param   array<int, array<string, mixed>>  $items
     */
    private function buildGalleryViewer(array $payload, array $items, bool $withStrip): string
    {
        if ($items === []) {
            return '';
        }

        $encodedItems = (string) json_encode($items, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $first = $items[0];
        $stage = $this->galleryItemMarkup($payload, $first, true);
        $strip = '';

        if ($withStrip) {
            $buttons = [];

            foreach ($items as $index => $item) {
                $buttons[] = sprintf(
                    '<button type="button" class="smartlink-gallery__thumb%s" data-gallery-index="%d" aria-label="%s">%s</button>',
                    $index === 0 ? ' is-active' : '',
                    $index,
                    htmlspecialchars((string) ($item['display_name'] ?? ''), ENT_COMPAT, 'UTF-8'),
                    $this->galleryItemMarkup($payload, $item, false)
                );
            }

            $strip = '<div class="smartlink-gallery__strip">' . implode('', $buttons) . '</div>';
        }

        $body = '<button type="button" class="smartlink-gallery__previous" data-gallery-previous aria-label="Previous">&#8249;</button>'
            . '<div class="smartlink-gallery__stage" data-gallery-stage>' . $stage . '</div>'
            . '<button type="button" class="smartlink-gallery__next" data-gallery-next aria-label="Next">&#8250;</button>'
            . $strip;

        return sprintf(
            '<div %s>%s</div>',
            $this->stringifyAttributes($this->buildViewContainerAttributes(
                $payload,
                ['smartlink-view', 'smartlink-gallery', 'smartlink-gallery--viewer'],
                ['data-smartlink-gallery' => '1', 'data-gallery-items' => $encodedItems]
            )),
            $body
        );
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $item
     */
    private function galleryItemMarkup(array $payload, array $item, bool $full): string
    {
        $src = $this->normaliseMediaHref((string) ($item['src'] ?? ''));
        $poster = $this->normaliseMediaHref((string) ($item['poster'] ?? ''));
        $label = htmlspecialchars((string) ($item['display_name'] ?? ''), ENT_COMPAT, 'UTF-8');
        $media = \is_array($item['media'] ?? null) ? $item['media'] : [];

        if (($item['type'] ?? 'image') === 'video') {
            if (!$full && $poster !== '') {
                return '<img src="' . htmlspecialchars($poster, ENT_COMPAT, 'UTF-8') . '" alt="' . $label . '" loading="lazy">';
            }

            if (($media['type'] ?? '') === 'provider_video' && !empty($media['embed_url'])) {
                return '<iframe src="' . htmlspecialchars((string) $media['embed_url'], ENT_COMPAT, 'UTF-8')
                    . '" allowfullscreen title="' . $label . '"></iframe>';
            }

            return '<video src="' . htmlspecialchars($src, ENT_COMPAT, 'UTF-8') . '"'
                . ($poster !== '' ? ' poster="' . htmlspecialchars($poster, ENT_COMPAT, 'UTF-8') . '"' : '')
                . ' controls aria-label="' . $label . '"></video>';
        }

        return '<img src="' . htmlspecialchars($src, ENT_COMPAT, 'UTF-8') . '" alt="' . $label . '" loading="lazy">';
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     */
    private function buildVideoViewer(array $payload, array $resolved): string
    {
        $media = \is_array($resolved['media'] ?? null) ? $resolved['media'] : [];
        $src = trim((string) (($media['embed_url'] ?? '') ?: ($media['src'] ?? '')));

        if ($src === '') {
            return '';
        }

        if (($media['type'] ?? '') === 'provider_video') {
            $options = (array) ($payload['video'] ?? []);
            $query = ($media['provider'] ?? '') === 'youtube'
                ? [
                    'controls' => !empty($options['controls']) ? '1' : '0',
                    'autoplay' => !empty($options['autoplay']) ? '1' : '0',
                    'loop' => !empty($options['loop']) ? '1' : '0',
                    'mute' => !empty($options['muted']) ? '1' : '0',
                ]
                : [
                    'autoplay' => !empty($options['autoplay']) ? '1' : '0',
                    'loop' => !empty($options['loop']) ? '1' : '0',
                    'muted' => !empty($options['muted']) ? '1' : '0',
                ];
            $src .= (str_contains($src, '?') ? '&' : '?') . http_build_query($query);
            $embed = '<div class="smartlink-video"><iframe src="'
                . htmlspecialchars($src, ENT_COMPAT, 'UTF-8')
                . '" allowfullscreen title="'
                . htmlspecialchars((string) ($resolved['display_name'] ?? 'Video'), ENT_COMPAT, 'UTF-8')
                . '"></iframe></div>';

            return $this->applyToggleViewAttributes($embed, $payload);
        }

        $options = (array) ($payload['video'] ?? []);
        $sourceAttribute = $this->shouldDeferViewMedia($payload) ? 'data-src' : 'src';
        $attributes = [$sourceAttribute . '="' . htmlspecialchars($src, ENT_COMPAT, 'UTF-8') . '"'];

        foreach (['controls', 'autoplay', 'loop', 'muted'] as $attribute) {
            if (!empty($options[$attribute])) {
                $attributes[] = $attribute;
            }
        }

        if (!empty($options['poster'])) {
            $attributes[] = 'poster="' . htmlspecialchars((string) $options['poster'], ENT_COMPAT, 'UTF-8') . '"';
        }

        return $this->applyToggleViewAttributes(
            '<div class="smartlink-video"><video ' . implode(' ', $attributes) . '></video></div>',
            $payload
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
     */
    private function primaryText(array $payload): string
    {
        return trim((string) ($payload['label'] ?? ''));
    }

    /**
     * @param   array<string, mixed>  $resolved
     */
    private function summaryText(array $resolved): string
    {
        return trim((string) ($resolved['summary'] ?? ''));
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function imageSource(array $payload): string
    {
        return $this->normaliseMediaHref((string) ($payload['image_override'] ?? ''));
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private function imageAlt(array $payload): string
    {
        return trim((string) ($payload['preview_alt'] ?? ''));
    }

    /**
     * @param   array<string, mixed>  $payload
     *
     * @return array{mode:string,emptyClass:string,override:bool,position:string,ratio:string,fit:string,size:string,emitPosition:bool,emitRatio:bool,emitFit:bool,emitSize:bool}
     */
    private function effectiveThumbnailSettings(array $payload): array
    {
        $position = $this->normaliseThumbnailPosition((string) ($payload['thumbnail_position'] ?? 'inline'));
        $ratio = $this->normaliseThumbnailRatio((string) ($payload['thumbnail_ratio'] ?? 'auto'));
        $fit = $this->normaliseThumbnailFit((string) ($payload['thumbnail_fit'] ?? 'cover'));
        $size = $this->normaliseThumbnailSize((string) ($payload['thumbnail_size'] ?? 'md'));

        return [
            'mode' => $this->normaliseThumbnailEmptyMode((string) ($payload['thumbnail_empty_mode'] ?? 'generic')),
            'emptyClass' => $this->normaliseConfiguredThumbnailEmptyClass((string) ($payload['thumbnail_empty_class'] ?? 'smartlink-image-empty')),
            'override' => false,
            'position' => $position,
            'ratio' => $ratio,
            'fit' => $fit,
            'size' => $size,
            'emitPosition' => $position !== 'inline',
            'emitRatio' => $ratio !== 'auto',
            'emitFit' => $fit !== 'cover',
            'emitSize' => $size !== 'md',
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
