<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;

final class ArticleResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'com_content_article';
    }

    public function resolve(array $payload): array
    {
        $id = $this->resolveNumericId($payload['value'] ?? 0);
        $article = $this->loadArticle($id);
        $title = $article['title'] ?: ('Article #' . $id);

        return $this->buildResult(
            $payload,
            $this->route('index.php?option=com_content&view=article&id=' . $id),
            [
                'label' => $payload['label'] ?: $title,
                'title' => $title,
                'summary' => $article['summary'],
                'image' => $article['image'],
                'image_alt' => $article['image_alt'],
            ]
        );
    }

    /**
     * @return array<string, string>
     */
    private function loadArticle(int $id): array
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
                    $db->quoteName('introtext'),
                    $db->quoteName('images'),
                ]
            )
            ->from($db->quoteName('#__content'))
            ->where($db->quoteName('id') . ' = ' . $id);

        $db->setQuery($query);
        $row = $db->loadAssoc() ?: [];
        $images = json_decode((string) ($row['images'] ?? ''), true);

        return [
            'title' => trim((string) ($row['title'] ?? '')),
            'summary' => $this->summarise((string) ($row['introtext'] ?? '')),
            'image' => $this->normaliseMediaReference((string) ($images['image_intro'] ?? '')),
            'image_alt' => trim((string) (($images['image_intro_alt'] ?? '') ?: ($row['title'] ?? ''))),
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
