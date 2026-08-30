<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Contract;

\defined('_JEXEC') or die;

final class PresentationResolver
{
    public function __construct(private readonly TextResolver $textResolver = new TextResolver())
    {
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $resolved
     * @param   array<string, mixed>  $config
     *
     * @return  array<string, mixed>
     */
    public function resolve(array $payload, array $resolved, array $config = []): array
    {
        $text = $this->textResolver->resolve($payload, $resolved, $config);
        $visibleText = $text['visible_text'];
        $target = trim((string) ($payload['target'] ?? ''));
        $rel = trim((string) ($payload['rel'] ?? ''));

        if ($target === '_blank') {
            $relParts = preg_split('/\s+/', $rel) ?: [];
            $rel = implode(' ', array_values(array_unique(array_filter(array_merge($relParts, ['noopener', 'noreferrer'])))));
        }

        $image = trim((string) (
            (($payload['kind'] ?? '') === 'gallery' ? ($payload['preview_image'] ?? '') : '')
            ?: ($payload['image_override'] ?? '')
            ?: ($resolved['image'] ?? '')
        ));
        $imageAlt = trim((string) (($payload['preview_alt'] ?? '') ?: ($resolved['image_alt'] ?? '') ?: $visibleText));
        $thumbnail = $this->thumbnail($payload, $config);
        $gallery = $this->gallery((array) ($payload['gallery'] ?? []));

        return [
            'action' => (string) ($payload['action'] ?? $config['default_action'] ?? 'link_open'),
            'target' => $target,
            'rel' => $rel,
            'popup_scope' => (string) ($payload['popup_scope'] ?? 'component'),
            'download_filename' => trim((string) ($payload['download_filename'] ?? '')),
            'visible_text' => $visibleText,
            'text_source' => $text['text_source'],
            'html_title' => trim((string) ($payload['title'] ?? '')),
            'css_class' => trim((string) ($payload['css_class'] ?? '')),
            'icon_class' => trim((string) ($payload['icon_class'] ?? '')) ?: $this->defaultIconClass((string) ($payload['kind'] ?? '')),
            'show_image' => !empty($payload['show_image']),
            'show_icon' => !empty($payload['show_icon']),
            'show_text' => !empty($payload['show_text']),
            'display_inside' => !empty($payload['display_inside']),
            'image' => $image,
            'image_alt' => $imageAlt,
            'popup_image' => trim((string) ($payload['preview_image'] ?? '')),
            'structure' => (string) ($payload['structure'] ?? 'inline'),
            'view_position' => (string) ($payload['view_position'] ?? 'after'),
            'show_summary' => !empty($payload['show_summary']),
            'show_type_label' => !empty($payload['show_type_label']),
            'figure_caption_text' => !empty($payload['figure_caption_text']),
            'thumbnail' => $thumbnail,
            'linked_parts' => [
                'enabled' => !empty($payload['click_individual_parts']),
                'icon' => !empty($payload['click_icon']),
                'text' => !empty($payload['click_text']),
                'thumbnail' => !empty($payload['click_image']),
                'view' => !empty($payload['click_view']),
            ],
            'video' => $this->video((array) ($payload['video'] ?? [])),
            'gallery' => $gallery,
        ];
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $config
     *
     * @return  array<string, mixed>
     */
    private function thumbnail(array $payload, array $config): array
    {
        $override = !empty($payload['thumbnail_override']);
        $position = $override ? (string) ($payload['thumbnail_position'] ?? '') : '';
        $ratio = $override ? (string) ($payload['thumbnail_ratio'] ?? '') : '';
        $fit = $override ? (string) ($payload['thumbnail_fit'] ?? '') : '';
        $size = $override ? (string) ($payload['thumbnail_size'] ?? '') : '';
        $configuredPosition = (string) ($config['thumbnail_position'] ?? 'inline');
        $configuredRatio = (string) ($config['thumbnail_ratio'] ?? 'auto');
        $configuredFit = (string) ($config['thumbnail_fit'] ?? 'cover');
        $configuredSize = (string) ($config['thumbnail_size'] ?? 'md');

        return [
            'empty_mode' => (string) ($config['thumbnail_empty_mode'] ?? 'generic'),
            'empty_class' => trim((string) (($payload['thumbnail_empty_class'] ?? '') ?: ($config['thumbnail_empty_class'] ?? 'smartlink-image-empty'))),
            'position' => $position !== '' ? $position : ($configuredPosition === 'inherit' ? 'inline' : $configuredPosition),
            'ratio' => $ratio !== '' ? $ratio : ($configuredRatio === 'inherit' ? 'auto' : $configuredRatio),
            'fit' => $fit !== '' ? $fit : ($configuredFit === 'inherit' ? 'cover' : $configuredFit),
            'size' => $size !== '' ? $size : ($configuredSize === 'inherit' ? 'md' : $configuredSize),
        ];
    }

    /**
     * @param   array<string, mixed>  $options
     *
     * @return  array<string, mixed>
     */
    private function video(array $options): array
    {
        return [
            'controls' => array_key_exists('controls', $options) ? !empty($options['controls']) : true,
            'autoplay' => !empty($options['autoplay']),
            'loop' => !empty($options['loop']),
            'muted' => !empty($options['muted']),
            'poster' => trim((string) ($options['poster'] ?? '')),
        ];
    }

    /**
     * @param   array<string, mixed>  $options
     *
     * @return  array<string, mixed>
     */
    private function gallery(array $options): array
    {
        return [
            'mode' => (string) ($options['mode'] ?? 'grid'),
            'columns' => max(1, (int) ($options['columns'] ?? 3)),
            'gap' => max(0, (int) ($options['gap'] ?? 16)),
            'fit' => (string) ($options['image_size_mode'] ?? 'cover'),
        ];
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
            default => 'fa-solid fa-link',
        };
    }
}
