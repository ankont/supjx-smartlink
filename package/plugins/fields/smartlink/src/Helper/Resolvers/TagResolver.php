<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class TagResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'com_tags_tag';
    }

    public function resolve(array $payload): array
    {
        $id = $this->resolveNumericId($payload['value'] ?? 0);

        return $this->buildResult(
            $payload,
            $this->route('index.php?option=com_tags&view=tag&id=' . $id),
            ['label' => $payload['label'] ?: 'Tag #' . $id]
        );
    }
}

