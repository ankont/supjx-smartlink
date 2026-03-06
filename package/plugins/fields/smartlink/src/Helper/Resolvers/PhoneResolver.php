<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class PhoneResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'phone';
    }

    public function resolve(array $payload): array
    {
        $phone = preg_replace('/[^0-9+]/', '', (string) ($payload['value'] ?? '')) ?: '';

        return $this->buildResult($payload, 'tel:' . $phone, ['label' => $payload['label'] ?: $phone]);
    }
}

