<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;

final class MenuResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'menu_item';
    }

    public function resolve(array $payload): array
    {
        $itemId = $this->resolveNumericId($payload['value'] ?? 0);
        $title = $this->loadTitle($itemId);

        return $this->buildResult(
            $payload,
            $this->route('index.php?Itemid=' . $itemId),
            [
                'label' => $payload['label'] ?: ($title ?: ('Menu item #' . $itemId)),
                'title' => $title,
            ]
        );
    }

    private function loadTitle(int $id): string
    {
        if ($id <= 0) {
            return '';
        }

        $db = Factory::getDbo();
        $query = $db->getQuery(true)
            ->select($db->quoteName('title'))
            ->from($db->quoteName('#__menu'))
            ->where($db->quoteName('id') . ' = ' . $id);

        $db->setQuery($query);

        return trim((string) $db->loadResult());
    }
}
