<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class RelativeUrlResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'relative_url';
    }

    public function resolve(array $payload): array
    {
        $path = trim((string) ($payload['value'] ?? ''));
        $path = $path !== '' && $path[0] !== '/' ? '/' . $path : $path;

        return $this->buildResult($payload, $path);
    }
}

