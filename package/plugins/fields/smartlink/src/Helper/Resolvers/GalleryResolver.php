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
        $resolvedItems = [];
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
            $resolvedItems[] = [
                'type' => $type === 'video' ? 'video' : 'image',
                'src' => $src,
                'label' => trim((string) ($item['label'] ?? '')),
                'poster' => $type === 'video' ? $this->asMediaUrl((string) ($item['poster'] ?? '')) : '',
                'source_type' => trim((string) ($item['source_type'] ?? '')),
            ];
        }

        return $this->buildResult($payload, $firstHref, ['items' => $resolvedItems]);
    }
}
