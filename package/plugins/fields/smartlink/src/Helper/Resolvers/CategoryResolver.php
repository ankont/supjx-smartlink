<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;

final class CategoryResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'com_content_category';
    }

    public function resolve(array $payload): array
    {
        $id = $this->resolveNumericId($payload['value'] ?? 0);
        $category = $this->loadCategory($id);
        $title = $category['title'] ?: ('Category #' . $id);

        return $this->buildResult(
            $payload,
            $this->route('index.php?option=com_content&view=category&id=' . $id),
            [
                'label' => $payload['label'] ?: $title,
                'title' => $title,
                'summary' => $category['summary'],
                'image' => $category['image'],
                'image_alt' => $category['image_alt'],
            ]
        );
    }

    /**
     * @return array<string, string>
     */
    private function loadCategory(int $id): array
    {
        if ($id <= 0) {
            return [
                'title' => '',
                'summary' => '',
                'image' => '',
                'image_alt' => '',
            ];
        }

        $db = Factory::getDbo();
        $query = $db->getQuery(true)
            ->select(
                [
                    $db->quoteName('title'),
                    $db->quoteName('description'),
                    $db->quoteName('params'),
                ]
            )
            ->from($db->quoteName('#__categories'))
            ->where($db->quoteName('id') . ' = ' . $id)
            ->where($db->quoteName('extension') . ' = ' . $db->quote('com_content'));

        $db->setQuery($query);
        $row = $db->loadAssoc() ?: [];
        $params = json_decode((string) ($row['params'] ?? ''), true);

        return [
            'title' => trim((string) ($row['title'] ?? '')),
            'summary' => $this->summarise((string) ($row['description'] ?? '')),
            'image' => trim((string) (($params['image'] ?? ''))),
            'image_alt' => trim((string) (($params['image_alt'] ?? '') ?: ($row['title'] ?? ''))),
        ];
    }

    private function summarise(string $html): string
    {
        $summary = trim(preg_replace('/\s+/u', ' ', strip_tags($html)) ?: '');

        if ($summary === '') {
            return '';
        }

        return function_exists('mb_substr') ? mb_substr($summary, 0, 180) : substr($summary, 0, 180);
    }
}
