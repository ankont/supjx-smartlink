<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class AnchorResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'anchor';
    }

    public function resolve(array $payload): array
    {
        $value = (string) ($payload['value'] ?? '');
        $href = $value !== '' && $value[0] === '#' ? $value : '#' . ltrim($value, '#');

        return $this->buildResult($payload, $href);
    }
}

