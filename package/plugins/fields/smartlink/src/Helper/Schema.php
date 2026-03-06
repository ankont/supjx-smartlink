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
        'link_open',
        'link_download',
        'preview_modal',
        'embed',
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
        $allowedActions = self::normaliseStringList($config['allowed_actions'] ?? self::ACTIONS);
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
        $payload['download_filename'] = trim((string) ($payload['download_filename'] ?? ''));
        $payload['source_type'] = self::normaliseSourceType((string) ($payload['source_type'] ?? ''), $payload['kind']);
        $payload['preview_image'] = self::sanitizeUrl((string) ($payload['preview_image'] ?? ''));
        $payload['preview_alt'] = trim((string) ($payload['preview_alt'] ?? ''));
        $payload['video'] = self::normaliseVideoOptions($payload['video'] ?? []);
        $payload['gallery'] = self::normaliseGalleryOptions($payload['gallery'] ?? []);

        if (!$payload['value']) {
            throw new InvalidArgumentException('SmartLink value is required.');
        }

        if (!\in_array($payload['kind'], $allowedKinds, true)) {
            throw new InvalidArgumentException('SmartLink kind is not allowed for this field.');
        }

        if (!\in_array($payload['action'], $allowedActions, true)) {
            throw new InvalidArgumentException('SmartLink action is not allowed for this field.');
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
        $array['allowed_actions'] = self::normaliseStringList($array['allowed_actions'] ?? self::ACTIONS);
        $array['default_kind'] = (string) ($array['default_kind'] ?? 'external_url');
        $array['default_action'] = (string) ($array['default_action'] ?? 'link_open');
        $array['validation_profile'] = (string) ($array['validation_profile'] ?? 'any');
        $array['allow_external_media'] = (int) ($array['allow_external_media'] ?? 1);
        $array['max_gallery_items'] = max(1, (int) ($array['max_gallery_items'] ?? 12));
        $array['advanced_kinds'] = array_values(array_intersect($array['allowed_kinds'], self::ADVANCED_KINDS));
        $array['ui'] = self::uiConfig($array);
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

    /**
     * @param   array<string, mixed>  $config
     *
     * @return  array<string, mixed>
     */
    private static function uiConfig(array $config): array
    {
        $allowedKinds = self::normaliseStringList($config['allowed_kinds'] ?? array_merge(self::BASIC_KINDS, self::ADVANCED_KINDS, self::MEDIA_KINDS));
        $allowedActions = self::normaliseStringList($config['allowed_actions'] ?? self::ACTIONS);
        $kindDefinitions = self::kindUiDefinitions();
        $groups = [];

        foreach (self::groupLabels() as $groupKey => $groupLabel) {
            $groupKinds = [];

            foreach ($kindDefinitions as $kind => $definition) {
                if (($definition['group'] ?? '') !== $groupKey || !\in_array($kind, $allowedKinds, true)) {
                    continue;
                }

                $displayModes = array_values(array_filter(
                    (array) ($definition['display_modes'] ?? []),
                    static fn (array $mode): bool => \in_array((string) ($mode['action'] ?? ''), $allowedActions, true)
                ));

                $definition['display_modes'] = $displayModes;
                $groupKinds[] = $kind;
                $kindDefinitions[$kind] = $definition;
            }

            if ($groupKinds !== []) {
                $groups[] = [
                    'key' => $groupKey,
                    'label' => $groupLabel,
                    'kinds' => $groupKinds,
                ];
            }
        }

        return [
            'groups' => $groups,
            'kinds' => $kindDefinitions,
        ];
    }

    /**
     * @return array<string, string>
     */
    private static function groupLabels(): array
    {
        return [
            'simple_links' => 'Simple Links',
            'joomla_items' => 'Joomla Items',
            'media' => 'Media',
            'advanced' => 'Advanced',
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private static function kindUiDefinitions(): array
    {
        return [
            'external_url' => [
                'label' => 'External Link',
                'group' => 'simple_links',
                'uses_picker' => false,
                'allows_manual_entry' => true,
                'requires_metadata' => false,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Open link'],
                    ['action' => 'link_download', 'label' => 'Download link'],
                    ['action' => 'preview_modal', 'label' => 'Open in popup'],
                ],
            ],
            'anchor' => [
                'label' => 'Anchor',
                'group' => 'simple_links',
                'uses_picker' => false,
                'allows_manual_entry' => true,
                'requires_metadata' => false,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Jump to anchor'],
                ],
            ],
            'email' => [
                'label' => 'Email',
                'group' => 'simple_links',
                'uses_picker' => false,
                'allows_manual_entry' => true,
                'requires_metadata' => false,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Show email link'],
                ],
            ],
            'phone' => [
                'label' => 'Phone',
                'group' => 'simple_links',
                'uses_picker' => false,
                'allows_manual_entry' => true,
                'requires_metadata' => false,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Show phone link'],
                ],
            ],
            'com_content_article' => [
                'label' => 'Article',
                'group' => 'joomla_items',
                'uses_picker' => true,
                'allows_manual_entry' => false,
                'requires_metadata' => true,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Open article link'],
                    ['action' => 'preview_modal', 'label' => 'Open in popup'],
                ],
            ],
            'com_content_category' => [
                'label' => 'Category',
                'group' => 'joomla_items',
                'uses_picker' => true,
                'allows_manual_entry' => false,
                'requires_metadata' => true,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Open category link'],
                    ['action' => 'preview_modal', 'label' => 'Open in popup'],
                ],
            ],
            'menu_item' => [
                'label' => 'Menu Item',
                'group' => 'joomla_items',
                'uses_picker' => true,
                'allows_manual_entry' => false,
                'requires_metadata' => true,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Open menu item link'],
                ],
            ],
            'com_tags_tag' => [
                'label' => 'Tags',
                'group' => 'joomla_items',
                'uses_picker' => true,
                'allows_manual_entry' => false,
                'requires_metadata' => true,
                'supports_multiple' => true,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Open tags link'],
                ],
            ],
            'com_contact_contact' => [
                'label' => 'Contact',
                'group' => 'joomla_items',
                'uses_picker' => true,
                'allows_manual_entry' => false,
                'requires_metadata' => true,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Open contact link'],
                ],
            ],
            'media_file' => [
                'label' => 'Media File',
                'group' => 'media',
                'uses_picker' => true,
                'allows_manual_entry' => true,
                'requires_metadata' => false,
                'sources' => [
                    ['value' => 'local', 'label' => 'Media Library'],
                    ['value' => 'external', 'label' => 'Web address'],
                ],
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Text link'],
                    ['action' => 'link_download', 'label' => 'Download link'],
                    ['action' => 'preview_modal', 'label' => 'Open in popup'],
                ],
            ],
            'image' => [
                'label' => 'Image',
                'group' => 'media',
                'uses_picker' => true,
                'allows_manual_entry' => true,
                'requires_metadata' => false,
                'sources' => [
                    ['value' => 'local', 'label' => 'Media Library'],
                    ['value' => 'external', 'label' => 'Web address'],
                ],
                'display_modes' => [
                    ['action' => 'embed', 'label' => 'Show image'],
                    ['action' => 'preview_modal', 'label' => 'Thumbnail opens full image'],
                    ['action' => 'link_open', 'label' => 'Show text link to the image'],
                ],
            ],
            'video' => [
                'label' => 'Video',
                'group' => 'media',
                'uses_picker' => true,
                'allows_manual_entry' => true,
                'requires_metadata' => false,
                'sources' => [
                    ['value' => 'local', 'label' => 'Media Library'],
                    ['value' => 'provider', 'label' => 'YouTube or Vimeo'],
                    ['value' => 'external', 'label' => 'Direct web address'],
                ],
                'display_modes' => [
                    ['action' => 'embed', 'label' => 'Play inside the page'],
                    ['action' => 'preview_modal', 'label' => 'Show a preview image first'],
                    ['action' => 'link_open', 'label' => 'Show text link to the video'],
                ],
            ],
            'gallery' => [
                'label' => 'Gallery',
                'group' => 'media',
                'uses_picker' => true,
                'allows_manual_entry' => true,
                'requires_metadata' => true,
                'supports_multiple' => true,
                'sources' => [
                    ['value' => 'local', 'label' => 'Media Library'],
                    ['value' => 'external', 'label' => 'Web address'],
                    ['value' => 'provider', 'label' => 'YouTube or Vimeo'],
                ],
                'display_modes' => [
                    ['action' => 'embed', 'label' => 'Grid gallery'],
                    ['action' => 'link_open', 'label' => 'Link list'],
                ],
            ],
            'relative_url' => [
                'label' => 'Relative Link',
                'group' => 'advanced',
                'uses_picker' => false,
                'allows_manual_entry' => true,
                'requires_metadata' => true,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Open link'],
                    ['action' => 'link_download', 'label' => 'Download link'],
                    ['action' => 'preview_modal', 'label' => 'Open in popup'],
                ],
            ],
            'user_profile' => [
                'label' => 'User Profile',
                'group' => 'advanced',
                'uses_picker' => false,
                'allows_manual_entry' => true,
                'requires_metadata' => true,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Open profile link'],
                ],
            ],
            'advanced_route' => [
                'label' => 'Advanced Route',
                'group' => 'advanced',
                'uses_picker' => false,
                'allows_manual_entry' => true,
                'requires_metadata' => true,
                'display_modes' => [
                    ['action' => 'link_open', 'label' => 'Open link'],
                ],
            ],
        ];
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
