<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class ExternalUrlResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'external_url';
    }

    public function resolve(array $payload): array
    {
        return $this->buildResult($payload, (string) ($payload['value'] ?? ''));
    }
}

