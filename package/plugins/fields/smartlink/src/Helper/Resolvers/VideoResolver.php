<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class VideoResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'video';
    }

    public function resolve(array $payload): array
    {
        $src = $this->asMediaUrl((string) ($payload['value'] ?? ''));

        return $this->buildResult($payload, $src, ['label' => basename((string) parse_url($src, PHP_URL_PATH))]);
    }

}
