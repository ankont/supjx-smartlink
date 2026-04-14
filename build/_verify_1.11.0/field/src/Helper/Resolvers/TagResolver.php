<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;

final class TagResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'com_tags_tag';
    }

    public function resolve(array $payload): array
    {
        $rawValue = $payload['value'] ?? 0;

        if (\is_array($rawValue)) {
            $ids = array_values(array_filter(array_map(fn ($item): int => $this->resolveNumericId($item), $rawValue)));

            if ($ids !== []) {
                $titles = $this->loadTitles($ids);
                $query = 'index.php?option=com_tags&view=tag';

                foreach ($ids as $id) {
                    $query .= '&id[]=' . $id;
                }

                return $this->buildResult(
                    $payload,
                    $this->route($query),
                    [
                        'label' => $payload['label'] ?: ($titles !== [] ? implode(', ', array_values($titles)) : 'Tags'),
                        'title' => $titles !== [] ? implode(', ', array_values($titles)) : 'Tags',
                        'items' => array_map(
                            static fn (int $id, string $title): array => ['id' => (string) $id, 'label' => $title],
                            array_keys($titles),
                            array_values($titles)
                        ),
                    ]
                );
            }
        }

        $id = $this->resolveNumericId($rawValue);
        $title = $this->loadTitle($id);

        return $this->buildResult(
            $payload,
            $this->route('index.php?option=com_tags&view=tag&id=' . $id),
            [
                'label' => $payload['label'] ?: ($title ?: 'Tag #' . $id),
                'title' => $title ?: ('Tag #' . $id),
                'items' => $id > 0 ? [['id' => (string) $id, 'label' => $title ?: ('Tag #' . $id)]] : [],
            ]
        );
    }

    /**
     * @param  array<int, int>  $ids
     * @return array<int, string>
     */
    private function loadTitles(array $ids): array
    {
        $ids = array_values(array_filter(array_map('intval', $ids)));

        if ($ids === []) {
            return [];
        }

        $db = Factory::getContainer()->get('DatabaseDriver');
        $query = $db->getQuery(true)
            ->select($db->quoteName(['id', 'title']))
            ->from($db->quoteName('#__tags'))
            ->where($db->quoteName('id') . ' IN (' . implode(',', $ids) . ')');

        $db->setQuery($query);
        $rows = (array) $db->loadAssocList();
        $titlesById = [];

        foreach ($rows as $row) {
            $titlesById[(int) ($row['id'] ?? 0)] = (string) ($row['title'] ?? '');
        }

        $ordered = [];

        foreach ($ids as $id) {
            if (!empty($titlesById[$id])) {
                $ordered[$id] = $titlesById[$id];
            }
        }

        return $ordered;
    }

    private function loadTitle(int $id): string
    {
        $titles = $this->loadTitles([$id]);

        return $titles[$id] ?? '';
    }
}
