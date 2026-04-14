<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper;

\defined('_JEXEC') or die;

use InvalidArgumentException;
use Joomla\Registry\Registry;

final class Schema
{
    /**
     * @var array<int, string>
     */
    public const BASIC_KINDS = [
        'external_url',
        'anchor',
        'email',
        'phone',
        'com_content_article',
        'com_content_category',
        'menu_item',
        'com_tags_tag',
        'com_contact_contact',
    ];

    /**
     * @var array<int, string>
     */
    public const ADVANCED_KINDS = [
        'relative_url',
        'user_profile',
        'advanced_route',
    ];

    /**
     * @var array<int, string>
     */
    public const MEDIA_KINDS = [
        'media_file',
        'image',
        'video',
        'gallery',
    ];

    /**
     * @var array<int, string>
     */
    public const ACTIONS = [
        'no_action',
        'link_open',
        'link_download',
        'preview_modal',
        'toggle_view',
    ];

    /**
     * @var array<int, string>
     */
    private const LEGACY_DEFAULT_ACTIONS = [
        'no_action',
        'link_open',
        'link_download',
        'preview_modal',
    ];

    /**
     * @param   mixed                 $raw     JSON string or array payload
     * @param   array<string, mixed>  $config  Field-level restrictions
     *
     * @return  array<string, mixed>
     */
    public static function sanitizePayload($raw, array $config = []): array
    {
        if ($raw === null || $raw === '') {
            return [];
        }

        if (\is_string($raw)) {
            $decoded = json_decode($raw, true);

            if (!\is_array($decoded)) {
                throw new InvalidArgumentException('SmartLink JSON is invalid.');
            }

            $payload = $decoded;
        } elseif (\is_array($raw)) {
            $payload = $raw;
        } else {
            throw new InvalidArgumentException('SmartLink payload must be a JSON string or array.');
        }

        $allowedKinds = self::normaliseStringList($config['allowed_kinds'] ?? array_merge(self::BASIC_KINDS, self::ADVANCED_KINDS, self::MEDIA_KINDS));
        $allowedActions = self::normaliseAllowedActions($config['allowed_actions'] ?? self::ACTIONS);
        $defaultKind = (string) ($config['default_kind'] ?? 'external_url');
        $defaultAction = (string) ($config['default_action'] ?? 'link_open');

        $payload['kind'] = isset($payload['kind']) && \in_array($payload['kind'], $allowedKinds, true) ? $payload['kind'] : $defaultKind;
        $payload['action'] = isset($payload['action']) && \in_array($payload['action'], $allowedActions, true) ? $payload['action'] : $defaultAction;

        $payload['value'] = self::normaliseValue($payload['value'] ?? '', $payload['kind']);
        $payload['label'] = trim((string) ($payload['label'] ?? ''));
        $payload['selection_label'] = trim((string) ($payload['selection_label'] ?? ''));
        $payload['title'] = trim((string) ($payload['title'] ?? ''));
        $payload['target'] = trim((string) ($payload['target'] ?? ''));
        $payload['rel'] = trim((string) ($payload['rel'] ?? ''));
        $payload['css_class'] = trim((string) ($payload['css_class'] ?? ''));
        $payload['icon_class'] = trim((string) ($payload['icon_class'] ?? ''));
        $payload['download_filename'] = trim((string) ($payload['download_filename'] ?? ''));
        $payload['source_type'] = self::normaliseSourceType((string) ($payload['source_type'] ?? ''), $payload['kind']);
        $payload['popup_scope'] = self::normalisePopupScope((string) ($payload['popup_scope'] ?? ''), $payload['kind']);
        $payload['preview_image'] = self::sanitizeUrl((string) ($payload['preview_image'] ?? ''));
        $payload['image_override'] = self::sanitizeUrl((string) ($payload['image_override'] ?? ''));
        $payload['selection_href'] = self::sanitizeUrl((string) ($payload['selection_href'] ?? ''));
        $payload['selection_image'] = self::sanitizeUrl((string) ($payload['selection_image'] ?? ''));
        $payload['selection_image_alt'] = trim((string) ($payload['selection_image_alt'] ?? ''));
        $payload['preview_alt'] = trim((string) ($payload['preview_alt'] ?? ''));
        $payload['thumbnail_empty_class'] = self::normaliseThumbnailEmptyClass((string) ($payload['thumbnail_empty_class'] ?? ''));
        $payload['thumbnail_override'] = self::normaliseBoolean($payload['thumbnail_override'] ?? false);
        $payload['thumbnail_position'] = self::normaliseOptionalThumbnailPosition((string) ($payload['thumbnail_position'] ?? ''));
        $payload['thumbnail_ratio'] = self::normaliseOptionalThumbnailRatio((string) ($payload['thumbnail_ratio'] ?? ''));
        $payload['thumbnail_fit'] = self::normaliseOptionalThumbnailFit((string) ($payload['thumbnail_fit'] ?? ''));
        $payload['thumbnail_size'] = self::normaliseOptionalThumbnailSize((string) ($payload['thumbnail_size'] ?? ''));
        $payload['selection_summary'] = self::sanitizeSummary((string) ($payload['selection_summary'] ?? ''));
        $payload['show_icon'] = self::normaliseToggle($payload['kind'], 'icon', $payload['show_icon'] ?? false);
        $payload['show_image'] = self::normaliseToggle($payload['kind'], 'image', $payload['show_image'] ?? false);
        $payload['show_text'] = self::normaliseToggle($payload['kind'], 'text', $payload['show_text'] ?? true);
        $payload['display_inside'] = self::normaliseToggle($payload['kind'], 'displayInside', $payload['display_inside'] ?? false);
        $payload['click_individual_parts'] = self::normaliseBoolean($payload['click_individual_parts'] ?? false);
        $payload['click_icon'] = self::normaliseBoolean($payload['click_icon'] ?? false);
        $payload['click_text'] = self::normaliseBoolean($payload['click_text'] ?? false);
        $payload['click_image'] = self::normaliseBoolean($payload['click_image'] ?? false);
        $payload['click_view'] = self::normaliseBoolean($payload['click_view'] ?? false);
        $payload['structure'] = self::normaliseStructure((string) ($payload['structure'] ?? 'inline'));
        $payload['view_position'] = self::normaliseViewPosition((string) ($payload['view_position'] ?? 'after'));
        $payload['show_summary'] = self::allowsSummary($payload['kind']) ? self::normaliseBoolean($payload['show_summary'] ?? false) : false;
        $payload['show_type_label'] = self::allowsTypeLabel($payload['kind']) ? self::normaliseBoolean($payload['show_type_label'] ?? false) : false;
        $payload['figure_caption_text'] = $payload['structure'] === 'figure' ? self::normaliseBoolean($payload['figure_caption_text'] ?? false) : false;
        $payload['video'] = self::normaliseVideoOptions($payload['video'] ?? []);
        $payload['gallery'] = self::normaliseGalleryOptions($payload['gallery'] ?? []);

        $payload = self::normaliseContentSelection($payload);

        if (($config['thumbnail_empty_mode'] ?? 'generic') !== 'specific') {
            $payload['thumbnail_empty_class'] = '';
        }

        if (!$payload['thumbnail_override']) {
            $payload['thumbnail_position'] = '';
            $payload['thumbnail_ratio'] = '';
            $payload['thumbnail_fit'] = '';
            $payload['thumbnail_size'] = '';
        }

        if (!$payload['value']) {
            throw new InvalidArgumentException('SmartLink value is required.');
        }

        if (!\in_array($payload['kind'], $allowedKinds, true)) {
            throw new InvalidArgumentException('SmartLink kind is not allowed for this field.');
        }

        if (!\in_array($payload['action'], $allowedActions, true)) {
            throw new InvalidArgumentException('SmartLink action is not allowed for this field.');
        }

        if (empty($payload['display_inside']) && empty($payload['show_icon']) && empty($payload['show_image']) && empty($payload['show_text'])) {
            throw new InvalidArgumentException('SmartLink must display at least one of icon, image, or text.');
        }

        self::validateMediaRules($payload, $config);
        self::validateProfile($payload, (string) ($config['validation_profile'] ?? 'any'));

        return $payload;
    }

    /**
     * @param   mixed  $params  Registry, JSON string, or array
     *
     * @return  array<string, mixed>
     */
    public static function fieldConfigFromParams($params): array
    {
        if ($params instanceof Registry) {
            $array = $params->toArray();
        } elseif (\is_string($params) && $params !== '') {
            $array = (new Registry($params))->toArray();
        } elseif (\is_array($params)) {
            $array = $params;
        } else {
            $array = [];
        }

        $array['allowed_kinds'] = self::normaliseStringList($array['allowed_kinds'] ?? array_merge(self::BASIC_KINDS, self::ADVANCED_KINDS, self::MEDIA_KINDS));
        $array['allowed_actions'] = self::normaliseAllowedActions($array['allowed_actions'] ?? self::ACTIONS);
        $array['default_kind'] = (string) ($array['default_kind'] ?? 'external_url');
        $array['default_action'] = (string) ($array['default_action'] ?? 'link_open');
        $array['validation_profile'] = (string) ($array['validation_profile'] ?? 'any');
        $array['allow_external_media'] = (int) ($array['allow_external_media'] ?? 1);
        $array['max_gallery_items'] = max(1, (int) ($array['max_gallery_items'] ?? 12));
        $array['icon_stylesheet_url'] = trim((string) ($array['icon_stylesheet_url'] ?? ''));
        $array['html_output_mode'] = self::normaliseHtmlOutputMode((string) ($array['html_output_mode'] ?? 'compact'));
        $array['use_smartlink_styles'] = self::normaliseBoolean($array['use_smartlink_styles'] ?? true, true);
        $array['link_button_class'] = self::configuredString($array, 'link_button_class', 'smartlink-actionbtn');
        $array['thumbnail_empty_mode'] = self::normaliseThumbnailEmptyMode((string) ($array['thumbnail_empty_mode'] ?? ''));
        $array['thumbnail_empty_class'] = self::normaliseConfiguredThumbnailEmptyClass(self::configuredString($array, 'thumbnail_empty_class', 'smartlink-image-empty'));
        $array['thumbnail_position'] = self::normaliseConfiguredThumbnailPosition((string) ($array['thumbnail_position'] ?? ''));
        $array['thumbnail_ratio'] = self::normaliseConfiguredThumbnailRatio((string) ($array['thumbnail_ratio'] ?? ''));
        $array['thumbnail_fit'] = self::normaliseConfiguredThumbnailFit((string) ($array['thumbnail_fit'] ?? ''));
        $array['thumbnail_size'] = self::normaliseConfiguredThumbnailSize((string) ($array['thumbnail_size'] ?? ''));
        $array['thumbnail_position_class_inline'] = self::configuredString($array, 'thumbnail_position_class_inline', 'smartlink-thumb--inline');
        $array['thumbnail_position_class_top'] = self::configuredString($array, 'thumbnail_position_class_top', 'smartlink-thumb--top');
        $array['thumbnail_position_class_bottom'] = self::configuredString($array, 'thumbnail_position_class_bottom', 'smartlink-thumb--bottom');
        $array['thumbnail_position_class_left'] = self::configuredString($array, 'thumbnail_position_class_left', 'smartlink-thumb--left');
        $array['thumbnail_position_class_right'] = self::configuredString($array, 'thumbnail_position_class_right', 'smartlink-thumb--right');
        $array['thumbnail_ratio_class_auto'] = self::configuredString($array, 'thumbnail_ratio_class_auto', 'smartlink-thumb--ratio-auto');
        $array['thumbnail_ratio_class_1_1'] = self::configuredString($array, 'thumbnail_ratio_class_1_1', 'smartlink-thumb--ratio-1-1');
        $array['thumbnail_ratio_class_4_3'] = self::configuredString($array, 'thumbnail_ratio_class_4_3', 'smartlink-thumb--ratio-4-3');
        $array['thumbnail_ratio_class_16_9'] = self::configuredString($array, 'thumbnail_ratio_class_16_9', 'smartlink-thumb--ratio-16-9');
        $array['thumbnail_fit_class_cover'] = self::configuredString($array, 'thumbnail_fit_class_cover', 'smartlink-thumb--fit-cover');
        $array['thumbnail_fit_class_contain'] = self::configuredString($array, 'thumbnail_fit_class_contain', 'smartlink-thumb--fit-contain');
        $array['thumbnail_fit_class_fill'] = self::configuredString($array, 'thumbnail_fit_class_fill', 'smartlink-thumb--fit-fill');
        $array['thumbnail_fit_class_none'] = self::configuredString($array, 'thumbnail_fit_class_none', 'smartlink-thumb--fit-none');
        $array['thumbnail_fit_class_scale_down'] = self::configuredString($array, 'thumbnail_fit_class_scale_down', 'smartlink-thumb--fit-scale-down');
        $array['thumbnail_size_class_sm'] = self::configuredString($array, 'thumbnail_size_class_sm', 'smartlink-thumb--sm');
        $array['thumbnail_size_class_md'] = self::configuredString($array, 'thumbnail_size_class_md', 'smartlink-thumb--md');
        $array['thumbnail_size_class_lg'] = self::configuredString($array, 'thumbnail_size_class_lg', 'smartlink-thumb--lg');
        $array['template_name'] = self::sanitizeTemplateName((string) ($array['template_name'] ?? ''));
        $array['advanced_kinds'] = array_values(array_intersect($array['allowed_kinds'], self::ADVANCED_KINDS));
        $array['metadata_required_kinds'] = array_values(array_intersect($array['allowed_kinds'], self::requiredMetadataKinds()));

        return $array;
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    public static function encode(array $payload): string
    {
        return (string) json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private static function normaliseThumbnailEmptyMode(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['empty', 'generic', 'specific'], true) ? $value : 'generic';
    }

    private static function normaliseHtmlOutputMode(string $value): string
    {
        $value = trim(strtolower($value));

        return \in_array($value, ['compact', 'pretty'], true) ? $value : 'compact';
    }

    private static function normaliseConfiguredThumbnailEmptyClass(string $value): string
    {
        $value = trim($value);

        return $value !== '' ? $value : 'smartlink-image-empty';
    }

    private static function normaliseThumbnailRatio(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['auto', '1-1', '4-3', '16-9'], true) ? $value : 'auto';
    }

    private static function normaliseThumbnailFit(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['cover', 'contain', 'fill', 'none', 'scale-down'], true) ? $value : 'cover';
    }

    private static function normaliseThumbnailPosition(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['inline', 'top', 'bottom', 'left', 'right'], true) ? $value : 'inline';
    }

    private static function normaliseThumbnailSize(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['sm', 'md', 'lg'], true) ? $value : 'md';
    }

    private static function normaliseThumbnailEmptyClass(string $value): string
    {
        return trim($value);
    }

    private static function normaliseOptionalThumbnailRatio(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? '' : self::normaliseThumbnailRatio($value);
    }

    private static function normaliseOptionalThumbnailPosition(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? '' : self::normaliseThumbnailPosition($value);
    }

    private static function normaliseOptionalThumbnailFit(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? '' : self::normaliseThumbnailFit($value);
    }

    private static function normaliseOptionalThumbnailSize(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? '' : self::normaliseThumbnailSize($value);
    }

    private static function normaliseConfiguredThumbnailRatio(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? 'inherit' : self::normaliseThumbnailRatio($value);
    }

    private static function normaliseConfiguredThumbnailFit(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? 'inherit' : self::normaliseThumbnailFit($value);
    }

    private static function normaliseConfiguredThumbnailPosition(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? 'inherit' : self::normaliseThumbnailPosition($value);
    }

    private static function normaliseConfiguredThumbnailSize(string $value): string
    {
        $value = trim($value);

        return $value === '' || $value === 'inherit' ? 'inherit' : self::normaliseThumbnailSize($value);
    }

    /**
     * @param   array<string, mixed>  $array
     */
    private static function configuredString(array $array, string $key, string $default): string
    {
        return array_key_exists($key, $array)
            ? trim((string) $array[$key])
            : $default;
    }

    /**
     * @param   mixed   $value
     * @param   string  $kind
     *
     * @return  mixed
     */
    private static function normaliseValue($value, string $kind)
    {
        if ($kind === 'gallery') {
            if (!\is_array($value)) {
                return [];
            }

            $items = [];

            foreach ($value as $item) {
                if (\is_array($item)) {
                    $items[] = [
                        'src' => self::sanitizeUrl((string) ($item['src'] ?? '')),
                        'type' => trim((string) ($item['type'] ?? 'image')),
                        'label' => trim((string) ($item['label'] ?? '')),
                        'poster' => self::sanitizeUrl((string) ($item['poster'] ?? '')),
                    ];
                    continue;
                }

                $items[] = [
                    'src' => self::sanitizeUrl((string) $item),
                    'type' => 'image',
                    'label' => '',
                    'poster' => '',
                ];
            }

            return array_values(array_filter($items, static fn (array $item): bool => $item['src'] !== ''));
        }

        if ($kind === 'com_tags_tag') {
            if (\is_string($value)) {
                $value = preg_split('/\s*,\s*/', $value, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            }

            if (!\is_array($value)) {
                return [];
            }

            $items = array_map(static fn ($item): string => trim((string) $item), $value);

            return array_values(array_filter($items, static fn (string $item): bool => $item !== ''));
        }

        if (\is_string($value)) {
            return self::sanitizeUrl(trim($value));
        }

        if (\is_array($value)) {
            $items = array_map(static fn ($item): string => self::sanitizeUrl(trim((string) $item)), $value);

            return array_values(array_filter($items, static fn (string $item): bool => $item !== ''));
        }

        return '';
    }

    private static function normaliseVideoOptions(array $options): array
    {
        return [
            'controls' => isset($options['controls']) ? (bool) $options['controls'] : true,
            'autoplay' => !empty($options['autoplay']),
            'loop' => !empty($options['loop']),
            'muted' => !empty($options['muted']),
            'poster' => self::sanitizeUrl((string) ($options['poster'] ?? '')),
        ];
    }

    private static function normaliseGalleryOptions(array $options): array
    {
        $layout = (string) ($options['layout'] ?? 'grid');
        $columns = max(1, (int) ($options['columns'] ?? 3));
        $gap = max(0, (int) ($options['gap'] ?? 16));
        $linkBehavior = (string) ($options['link_behavior'] ?? 'open');
        $sizeMode = (string) ($options['image_size_mode'] ?? 'cover');

        return [
            'layout' => \in_array($layout, ['grid'], true) ? $layout : 'grid',
            'columns' => $columns,
            'gap' => $gap,
            'link_behavior' => \in_array($linkBehavior, ['open', 'lightbox-hook'], true) ? $linkBehavior : 'open',
            'image_size_mode' => \in_array($sizeMode, ['cover', 'contain', 'stretch', 'stretch_width', 'stretch_height'], true) ? $sizeMode : 'cover',
        ];
    }

    private static function normaliseSourceType(string $value, string $kind): string
    {
        $value = trim($value);

        if ($value === '') {
            return \in_array($kind, self::MEDIA_KINDS, true) ? 'local' : '';
        }

        if (!\in_array($kind, self::MEDIA_KINDS, true)) {
            return '';
        }

        if ($kind === 'video') {
            return \in_array($value, ['local', 'external', 'provider'], true) ? $value : 'local';
        }

        return \in_array($value, ['local', 'external'], true) ? $value : 'local';
    }

    /**
     * @return array<string, mixed>
     */
    private static function kindCapabilities(string $kind): array
    {
        $base = [
            'icon' => ['mode' => 'available', 'default' => false],
            'image' => ['mode' => 'hidden', 'default' => false],
            'text' => ['mode' => 'available', 'default' => true],
            'displayInside' => ['mode' => 'available', 'default' => false],
            'summary' => false,
            'typeLabel' => false,
            'imageOverride' => false,
        ];

        switch ($kind) {
            case 'com_content_article':
            case 'com_content_category':
                $base['image'] = ['mode' => 'available', 'default' => false];
                $base['summary'] = true;
                $base['typeLabel'] = true;
                $base['imageOverride'] = true;

                return $base;

            case 'com_contact_contact':
                $base['image'] = ['mode' => 'available', 'default' => false];
                $base['summary'] = true;
                $base['typeLabel'] = true;
                $base['imageOverride'] = true;

                return $base;

            case 'anchor':
            case 'email':
            case 'phone':
                $base['displayInside'] = ['mode' => 'hidden', 'default' => false];

                return $base;

            case 'media_file':
                $base['image'] = ['mode' => 'available', 'default' => false];
                $base['icon'] = ['mode' => 'available', 'default' => true];
                $base['typeLabel'] = true;
                $base['imageOverride'] = true;

                return $base;

            case 'image':
                $base['image'] = ['mode' => 'available', 'default' => true];
                $base['icon'] = ['mode' => 'available', 'default' => false];
                $base['text'] = ['mode' => 'available', 'default' => false];
                $base['displayInside'] = ['mode' => 'available', 'default' => true];

                return $base;

            case 'video':
                $base['image'] = ['mode' => 'available', 'default' => false];
                $base['icon'] = ['mode' => 'available', 'default' => false];
                $base['text'] = ['mode' => 'available', 'default' => false];
                $base['displayInside'] = ['mode' => 'available', 'default' => false];
                $base['typeLabel'] = true;
                $base['imageOverride'] = true;

                return $base;

            case 'gallery':
                $base['icon'] = ['mode' => 'hidden', 'default' => false];
                $base['image'] = ['mode' => 'fixed', 'default' => true];
                $base['text'] = ['mode' => 'hidden', 'default' => false];
                $base['displayInside'] = ['mode' => 'fixed', 'default' => true];

                return $base;

            default:
                return $base;
        }
    }

    private static function normaliseBoolean($value, bool $fallback = false): bool
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

    private static function normaliseToggle(string $kind, string $key, $value): bool
    {
        $capabilities = self::kindCapabilities($kind);
        $definition = $capabilities[$key] ?? ['mode' => 'hidden', 'default' => false];
        $mode = (string) ($definition['mode'] ?? 'hidden');

        if ($mode === 'fixed') {
            return true;
        }

        if ($mode === 'hidden') {
            return false;
        }

        return self::normaliseBoolean($value, (bool) ($definition['default'] ?? false));
    }

    private static function normaliseStructure(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['inline', 'block', 'figure'], true) ? $value : 'inline';
    }

    private static function allowsSummary(string $kind): bool
    {
        return !empty(self::kindCapabilities($kind)['summary']);
    }

    private static function allowsTypeLabel(string $kind): bool
    {
        return !empty(self::kindCapabilities($kind)['typeLabel']);
    }

    private static function canClickViewOnPage(string $kind): bool
    {
        return $kind === 'image';
    }

    /**
     * @param   array<string, mixed>  $payload
     *
     * @return  array<string, mixed>
     */
    private static function normaliseContentSelection(array $payload): array
    {
        if (($payload['kind'] ?? '') === 'gallery') {
            $payload['show_icon'] = false;
            $payload['show_image'] = true;
            $payload['show_text'] = false;
        }

        if ((empty($payload['display_inside']) || ($payload['action'] ?? '') === 'toggle_view') && empty($payload['show_icon']) && empty($payload['show_image']) && empty($payload['show_text'])) {
            $fallbackKeys = ($payload['kind'] ?? '') === 'image' ? ['image', 'text', 'icon'] : ['text', 'image', 'icon'];

            foreach ($fallbackKeys as $key) {
                if (self::normaliseToggle((string) ($payload['kind'] ?? ''), $key, null)) {
                    $payload['show_' . $key] = true;
                    break;
                }
            }
        }

        return self::normaliseClickSelection($payload);
    }

    /**
     * @param   array<string, mixed>  $payload
     *
     * @return  array<string, mixed>
     */
    private static function normaliseClickSelection(array $payload): array
    {
        if (($payload['action'] ?? 'no_action') === 'no_action') {
            $payload['click_individual_parts'] = false;
            $payload['click_icon'] = false;
            $payload['click_text'] = false;
            $payload['click_image'] = false;
            $payload['click_view'] = false;

            return $payload;
        }

        $available = [
            'click_icon' => !empty($payload['show_icon']),
            'click_text' => !empty($payload['show_text']) && ($payload['kind'] ?? '') !== 'gallery',
            'click_image' => !empty($payload['show_image']),
            'click_view' => ($payload['action'] ?? '') !== 'toggle_view' && !empty($payload['display_inside']) && self::canClickViewOnPage((string) ($payload['kind'] ?? '')),
        ];

        if (empty($payload['click_individual_parts'])) {
            $payload['click_icon'] = false;
            $payload['click_text'] = false;
            $payload['click_image'] = false;
            $payload['click_view'] = false;

            return $payload;
        }

        foreach ($available as $key => $isAvailable) {
            $payload[$key] = $isAvailable ? self::normaliseBoolean($payload[$key] ?? false) : false;
        }

        if (!\in_array(true, $available, true)) {
            $payload['click_individual_parts'] = false;
            $payload['click_icon'] = false;
            $payload['click_text'] = false;
            $payload['click_image'] = false;
            $payload['click_view'] = false;

            return $payload;
        }

        if (empty($payload['click_icon']) && empty($payload['click_text']) && empty($payload['click_image']) && empty($payload['click_view'])) {
            foreach (['click_text', 'click_image', 'click_icon', 'click_view'] as $key) {
                if (!empty($available[$key])) {
                    $payload[$key] = true;
                    break;
                }
            }
        }

        return $payload;
    }

    private static function normalisePopupScope(string $value, string $kind): string
    {
        $value = trim($value);

        if (!\in_array($kind, ['com_content_article', 'com_content_category', 'menu_item', 'com_tags_tag', 'com_contact_contact', 'user_profile', 'advanced_route', 'relative_url'], true)) {
            return '';
        }

        $allowed = $kind === 'com_content_article'
            ? ['component', 'content', 'page']
            : ['component', 'page'];

        return \in_array($value, $allowed, true) ? $value : 'component';
    }

    private static function normaliseViewPosition(string $value): string
    {
        $value = trim($value);

        return \in_array($value, ['before', 'after'], true) ? $value : 'after';
    }

    /**
     * @param   mixed  $value
     *
     * @return  array<int, string>
     */
    private static function normaliseStringList($value): array
    {
        if (\is_string($value)) {
            $value = preg_split('/\s*,\s*/', $value, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        }

        if (!\is_array($value)) {
            return [];
        }

        $value = array_map(static fn ($item): string => trim((string) $item), $value);
        $value = array_values(array_filter(array_unique($value)));

        return $value;
    }

    /**
     * @param   mixed  $value
     *
     * @return  array<int, string>
     */
    private static function normaliseAllowedActions($value): array
    {
        $actions = self::normaliseStringList($value);

        if ($actions === []) {
            return self::ACTIONS;
        }

        if (!\in_array('toggle_view', $actions, true) && \count($actions) === \count(self::LEGACY_DEFAULT_ACTIONS)) {
            $legacyOnly = true;

            foreach (self::LEGACY_DEFAULT_ACTIONS as $action) {
                if (!\in_array($action, $actions, true)) {
                    $legacyOnly = false;
                    break;
                }
            }

            if ($legacyOnly) {
                $actions[] = 'toggle_view';
            }
        }

        return $actions;
    }

    private static function sanitizeUrl(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            return '';
        }

        if ($value[0] === '#') {
            return preg_replace('/[^A-Za-z0-9\-_:.#]/', '', $value) ?: '';
        }

        if (preg_match('#^(javascript|data|vbscript):#i', $value)) {
            throw new InvalidArgumentException('Unsafe URL scheme is not allowed.');
        }

        return $value;
    }

    private static function sanitizeSummary(string $value): string
    {
        $value = trim(strip_tags($value));
        $value = preg_replace('/\s+/u', ' ', $value) ?: '';

        return function_exists('mb_substr') ? mb_substr($value, 0, 320) : substr($value, 0, 320);
    }

    private static function sanitizeTemplateName(string $value): string
    {
        $value = trim(str_replace('\\', '/', $value));
        $value = preg_replace('#[^A-Za-z0-9/_-]#', '', $value) ?: '';
        $value = preg_replace('#/+#', '/', $value) ?: '';
        $value = trim($value, '/');

        return str_contains($value, '..') ? '' : $value;
    }

    /**
     * @return array<int, string>
     */
    private static function requiredMetadataKinds(): array
    {
        return [
            'com_content_article',
            'com_content_category',
            'menu_item',
            'com_tags_tag',
            'com_contact_contact',
            'relative_url',
            'user_profile',
            'advanced_route',
            'gallery',
        ];
    }

    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $config
     */
    private static function validateMediaRules(array $payload, array $config): void
    {
        $allowExternal = (int) ($config['allow_external_media'] ?? 1) === 1;
        $kind = (string) $payload['kind'];

        if (!\in_array($kind, self::MEDIA_KINDS, true)) {
            return;
        }

        if (!$allowExternal && \in_array((string) ($payload['source_type'] ?? 'local'), ['external', 'provider'], true)) {
            throw new InvalidArgumentException('External media is not allowed for this field.');
        }

        $items = \is_array($payload['value']) ? $payload['value'] : [['src' => (string) $payload['value']]];

        foreach ($items as $item) {
            $src = \is_array($item) ? (string) ($item['src'] ?? '') : (string) $item;

            if (!$allowExternal && preg_match('#^https?://#i', $src)) {
                throw new InvalidArgumentException('External media is not allowed for this field.');
            }
        }

        if ($kind === 'gallery') {
            $maxGalleryItems = max(1, (int) ($config['max_gallery_items'] ?? 12));

            if (\count($items) > $maxGalleryItems) {
                throw new InvalidArgumentException('Gallery exceeds the configured item limit.');
            }
        }
    }

    /**
     * @param   array<string, mixed>  $payload
     */
    private static function validateProfile(array $payload, string $profile): void
    {
        $kind = (string) $payload['kind'];
        $value = $payload['value'];

        switch ($profile) {
            case 'images_only':
                if ($kind !== 'image' && $kind !== 'gallery') {
                    throw new InvalidArgumentException('This field only accepts images.');
                }

                if ($kind === 'gallery') {
                    foreach ((array) $value as $item) {
                        if (($item['type'] ?? 'image') !== 'image') {
                            throw new InvalidArgumentException('This gallery accepts image items only.');
                        }
                    }
                }
                break;

            case 'files_only':
                if ($kind !== 'media_file') {
                    throw new InvalidArgumentException('This field only accepts files.');
                }
                break;

            case 'youtube_only':
                self::assertVideoProvider($kind, (string) $value, ['youtube.com', 'youtu.be']);
                break;

            case 'video_providers':
                self::assertVideoProvider($kind, (string) $value, ['youtube.com', 'youtu.be', 'vimeo.com']);
                break;
        }
    }

    /**
     * @param   array<int, string>  $allowedHosts
     */
    private static function assertVideoProvider(string $kind, string $value, array $allowedHosts): void
    {
        if ($kind !== 'video') {
            throw new InvalidArgumentException('This field only accepts video links.');
        }

        $host = strtolower((string) parse_url($value, PHP_URL_HOST));

        if ($host === '') {
            throw new InvalidArgumentException('A valid hosted video URL is required.');
        }

        foreach ($allowedHosts as $allowedHost) {
            if ($host === $allowedHost || str_ends_with($host, '.' . $allowedHost)) {
                return;
            }
        }

        throw new InvalidArgumentException('This video provider is not allowed.');
    }
}
