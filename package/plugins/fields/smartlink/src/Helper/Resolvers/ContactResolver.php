<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class ContactResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'com_contact_contact';
    }

    public function resolve(array $payload): array
    {
        $id = $this->resolveNumericId($payload['value'] ?? 0);

        return $this->buildResult(
            $payload,
            $this->route('index.php?option=com_contact&view=contact&id=' . $id),
            ['label' => $payload['label'] ?: 'Contact #' . $id]
        );
    }
}

