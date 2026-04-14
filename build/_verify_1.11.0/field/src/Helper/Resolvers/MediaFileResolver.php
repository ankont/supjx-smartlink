<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class MediaFileResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'media_file';
    }

    public function resolve(array $payload): array
    {
        $href = $this->asMediaUrl((string) ($payload['value'] ?? ''));

        return $this->buildResult($payload, $href, ['label' => $payload['label'] ?: basename($href)]);
    }
}

