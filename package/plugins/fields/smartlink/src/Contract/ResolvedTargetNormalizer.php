<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Contract;

\defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;

final class ResolvedTargetNormalizer
{
    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $raw
     *
     * @return  array<string, mixed>
     */
    public function normalise(array $payload, array $raw): array
    {
        $kind = (string) ($payload['kind'] ?? '');
        $href = trim((string) ($raw['href'] ?? $payload['selection_href'] ?? ''));
        $title = trim((string) ($raw['title'] ?? ''));
        $rawLabel = trim((string) ($raw['label'] ?? ''));
        $authorLabel = trim((string) ($payload['label'] ?? ''));

        if ($rawLabel === $authorLabel) {
            $rawLabel = '';
        }

        [$displayName, $displayNameSource] = $this->displayName($payload, $kind, $title, $rawLabel, $href);
        $items = $kind === 'gallery'
            ? $this->galleryItems((array) (($raw['items'] ?? null) ?: ($payload['value'] ?? [])))
            : [];
        $image = trim((string) ($raw['image'] ?? $payload['selection_image'] ?? ''));
        $imageAlt = trim((string) ($raw['image_alt'] ?? $payload['selection_image_alt'] ?? ''));
        $media = $this->mediaDescriptor($kind, $payload, $href);

        if ($kind === 'image' && $image === '') {
            $image = $href;
        } elseif ($kind === 'video' && $image === '') {
            $image = (string) ($media['poster'] ?? '');
        } elseif ($kind === 'gallery' && $image === '' && $items !== []) {
            $image = (string) (($items[0]['poster'] ?? '') ?: ($items[0]['src'] ?? ''));
        }

        return [
            'kind' => $kind,
            'type' => $this->semanticType($kind),
            'type_label' => $this->typeLabel($kind),
            'href' => $href,
            'title' => $title,
            'display_name' => $displayName,
            'display_name_source' => $displayNameSource,
            'summary' => trim((string) ($raw['summary'] ?? $payload['selection_summary'] ?? '')),
            'image' => $image,
            'image_alt' => $imageAlt,
            'media' => $media,
            'items' => $items,
            'attributes' => \is_array($raw['attributes'] ?? null) ? $raw['attributes'] : [],
        ];
    }

    /**
     * @param   array<string, mixed>  $payload
     *
     * @return  array{0: string, 1: string}
     */
    private function displayName(array $payload, string $kind, string $title, string $rawLabel, string $href): array
    {
        if ($title !== '') {
            return [$title, 'content_title'];
        }

        if ($rawLabel !== '') {
            return [$rawLabel, 'resolved_name'];
        }

        $snapshot = trim((string) ($payload['selection_label'] ?? ''));

        if ($snapshot !== '') {
            return [$snapshot, 'selection_snapshot'];
        }

        if ($kind === 'gallery') {
            $count = \is_array($payload['value'] ?? null) ? count($payload['value']) : 0;

            return [$count > 0 ? sprintf('%d items', $count) : 'Gallery', 'target_fallback'];
        }

        $value = \is_scalar($payload['value'] ?? null) ? trim((string) $payload['value']) : '';
        $path = (string) (parse_url($href ?: $value, PHP_URL_PATH) ?: ($href ?: $value));
        $filename = basename(str_replace('\\', '/', $path));

        return [$filename !== '' ? $filename : ($value !== '' ? $value : 'Open'), 'target_fallback'];
    }

    /**
     * @param   array<int, mixed>  $items
     *
     * @return  array<int, array<string, mixed>>
     */
    private function galleryItems(array $items): array
    {
        $normalised = [];

        foreach ($items as $item) {
            if (!\is_array($item)) {
                continue;
            }

            $src = trim((string) ($item['src'] ?? ''));

            if ($src === '') {
                continue;
            }

            $type = ($item['type'] ?? 'image') === 'video' ? 'video' : 'image';
            $displayName = trim((string) (($item['display_name'] ?? '') ?: ($item['label'] ?? '')));
            $path = (string) (parse_url($src, PHP_URL_PATH) ?: $src);
            $poster = $type === 'video' ? trim((string) ($item['poster'] ?? '')) : '';

            $normalised[] = [
                'type' => $type,
                'src' => $src,
                'display_name' => $displayName !== '' ? $displayName : basename(str_replace('\\', '/', $path)),
                'poster' => $poster,
                'source_type' => trim((string) ($item['source_type'] ?? '')),
                'media' => $type === 'video'
                    ? $this->videoDescriptor($src, $poster)
                    : ['type' => 'image', 'src' => $src],
            ];
        }

        return $normalised;
    }

    /**
     * @param   array<string, mixed>  $payload
     *
     * @return  array<string, mixed>|null
     */
    private function mediaDescriptor(string $kind, array $payload, string $href): ?array
    {
        if ($kind === 'image') {
            return ['type' => 'image', 'src' => $href];
        }

        if ($kind !== 'video') {
            return null;
        }

        return $this->videoDescriptor(
            $href,
            trim((string) (($payload['video']['poster'] ?? '') ?: ($payload['selection_image'] ?? '')))
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function videoDescriptor(string $src, string $poster = ''): array
    {
        $host = strtolower((string) parse_url($src, PHP_URL_HOST));
        $provider = '';
        $embedUrl = '';

        if (str_contains($host, 'youtu.be') || str_contains($host, 'youtube.com')) {
            $provider = 'youtube';
            $id = str_contains($host, 'youtu.be')
                ? trim((string) parse_url($src, PHP_URL_PATH), '/')
                : (string) (parse_url($src, PHP_URL_QUERY) ? $this->queryValue($src, 'v') : basename((string) parse_url($src, PHP_URL_PATH)));
            $embedUrl = $id !== '' ? 'https://www.youtube.com/embed/' . rawurlencode($id) : '';
        } elseif (str_contains($host, 'vimeo.com')) {
            $provider = 'vimeo';
            $id = basename(trim((string) parse_url($src, PHP_URL_PATH), '/'));
            $embedUrl = $id !== '' ? 'https://player.vimeo.com/video/' . rawurlencode($id) : '';
        }

        return [
            'type' => $provider !== '' ? 'provider_video' : 'video',
            'provider' => $provider,
            'src' => $src,
            'embed_url' => $embedUrl,
            'poster' => $poster,
        ];
    }

    private function queryValue(string $url, string $key): string
    {
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        return trim((string) ($query[$key] ?? ''));
    }

    private function semanticType(string $kind): string
    {
        return match ($kind) {
            'com_content_article' => 'article',
            'com_content_category' => 'category',
            'menu_item' => 'menu',
            'com_tags_tag' => 'tag',
            'com_contact_contact' => 'contact',
            default => $kind,
        };
    }

    private function typeLabel(string $kind): string
    {
        $fallback = match ($kind) {
            'external_url' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_EXTERNAL_URL', 'External link'],
            'relative_url' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_RELATIVE_URL', 'Site link'],
            'anchor' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_ANCHOR', 'Anchor'],
            'email' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_EMAIL', 'Email'],
            'phone' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_PHONE', 'Phone'],
            'com_content_article' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_COM_CONTENT_ARTICLE', 'Article'],
            'com_content_category' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_COM_CONTENT_CATEGORY', 'Category'],
            'menu_item' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_MENU_ITEM', 'Menu item'],
            'com_tags_tag' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_COM_TAGS_TAG', 'Tag'],
            'com_contact_contact' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_COM_CONTACT_CONTACT', 'Contact'],
            'user_profile' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_USER_PROFILE', 'User profile'],
            'advanced_route' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_ADVANCED_ROUTE', 'Joomla route'],
            'media_file' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_MEDIA_FILE', 'Media file'],
            'image' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_IMAGE', 'Image'],
            'video' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_VIDEO', 'Video'],
            'gallery' => ['PLG_FIELDS_SMARTLINK_OPTION_KIND_GALLERY', 'Gallery'],
            default => ['', 'Link'],
        };
        $translated = $fallback[0] !== '' ? Text::_($fallback[0]) : '';

        return $translated !== '' && $translated !== $fallback[0] ? $translated : $fallback[1];
    }
}
