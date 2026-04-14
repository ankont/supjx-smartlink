<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class GalleryResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'gallery';
    }

    public function resolve(array $payload): array
    {
        $items = (array) ($payload['value'] ?? []);
        $options = (array) ($payload['gallery'] ?? []);
        $columns = max(1, (int) ($options['columns'] ?? 3));
        $gap = max(0, (int) ($options['gap'] ?? 16));
        $sizeMode = (string) ($options['image_size_mode'] ?? 'cover');
        $linkBehavior = (string) ($options['link_behavior'] ?? 'open');
        $html = [];
        $firstHref = '#';

        foreach ($items as $index => $item) {
            $src = $this->asMediaUrl((string) ($item['src'] ?? ''));

            if ($src === '') {
                continue;
            }

            if ($firstHref === '#') {
                $firstHref = $src;
            }

            $type = (string) ($item['type'] ?? 'image');
            $label = (string) ($item['label'] ?? '');
            $classes = 'smartlink-item';
            $attributes = [
                'href="' . $this->escape($src) . '"',
            ];

            if ($linkBehavior === 'lightbox-hook') {
                $classes .= ' js-smartlink-lightbox';
                $attributes[] = 'data-lightbox="1"';
            }

            if ($type === 'video') {
                $poster = $this->asMediaUrl((string) ($item['poster'] ?? ''));
                $thumb = $poster !== '' ? '<img src="' . $this->escape($poster) . '" alt="' . $this->escape($label) . '" loading="lazy">' : '<span class="smartlink-item-label">' . $this->escape($label !== '' ? $label : 'Video') . '</span>';
                $html[] = '<a class="' . $classes . '" ' . implode(' ', $attributes) . '>' . $thumb . '</a>';
                continue;
            }

            $html[] = '<a class="' . $classes . '" ' . implode(' ', $attributes) . '><img src="' . $this->escape($src) . '" alt="' . $this->escape($label) . '" loading="lazy"></a>';
        }

        $embed = sprintf(
            '<div class="smartlink-gallery smartlink-gallery--grid smartlink-gallery--%s" style="--smartlink-gallery-columns:%d;--smartlink-gallery-gap:%dpx;">%s</div>',
            $this->escape($sizeMode),
            $columns,
            $gap,
            implode('', $html)
        );

        return $this->buildResult($payload, $firstHref, ['embed' => $embed, 'label' => $payload['label'] ?: 'Gallery']);
    }
}
