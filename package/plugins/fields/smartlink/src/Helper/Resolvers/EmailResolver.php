<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class EmailResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'email';
    }

    public function resolve(array $payload): array
    {
        $email = trim((string) ($payload['value'] ?? ''));

        return $this->buildResult($payload, 'mailto:' . $email, ['label' => $payload['label'] ?: $email]);
    }
}

