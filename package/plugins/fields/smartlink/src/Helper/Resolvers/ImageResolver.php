<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class ImageResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'image';
    }

    public function resolve(array $payload): array
    {
        $src = $this->asMediaUrl((string) ($payload['value'] ?? ''));
        $alt = (string) ($payload['selection_image_alt'] ?? '');

        return $this->buildResult($payload, $src, ['label' => basename($src), 'image' => $src, 'image_alt' => $alt]);
    }
}
