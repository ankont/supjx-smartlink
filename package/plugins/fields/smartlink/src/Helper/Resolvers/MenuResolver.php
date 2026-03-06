<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class MenuResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'menu_item';
    }

    public function resolve(array $payload): array
    {
        $itemId = $this->resolveNumericId($payload['value'] ?? 0);

        return $this->buildResult(
            $payload,
            $this->route('index.php?Itemid=' . $itemId),
            ['label' => $payload['label'] ?: 'Menu item #' . $itemId]
        );
    }
}

