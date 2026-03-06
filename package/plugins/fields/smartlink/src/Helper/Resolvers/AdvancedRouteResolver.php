<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class AdvancedRouteResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'advanced_route';
    }

    public function resolve(array $payload): array
    {
        $route = (string) ($payload['value'] ?? '');

        if (preg_match('#^https?://#i', $route)) {
            return $this->buildResult($payload, $route);
        }

        return $this->buildResult($payload, $this->route($route));
    }
}

