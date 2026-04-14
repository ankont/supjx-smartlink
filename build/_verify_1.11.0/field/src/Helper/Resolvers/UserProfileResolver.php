<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class UserProfileResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'user_profile';
    }

    public function resolve(array $payload): array
    {
        $userId = $this->resolveNumericId($payload['value'] ?? 0);

        return $this->buildResult(
            $payload,
            $this->route('index.php?option=com_users&view=profile&user_id=' . $userId),
            ['label' => $payload['label'] ?: 'User #' . $userId]
        );
    }
}

