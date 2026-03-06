<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

use Joomla\CMS\Router\Route;
use Joomla\CMS\Uri\Uri;
use SuperSoft\Plugin\Fields\Smartlink\Helper\ResolverInterface;

abstract class AbstractResolver implements ResolverInterface
{
    /**
     * @param   array<string, mixed>  $payload
     * @param   array<string, mixed>  $extra
     *
     * @return  array<string, mixed>
     */
    protected function buildResult(array $payload, string $href, array $extra = []): array
    {
        return array_merge(
            [
                'href' => $href,
                'label' => (string) ($payload['label'] ?? ''),
                'attributes' => [],
                'embed' => '',
            ],
            $extra
        );
    }

    protected function route(string $internalRoute): string
    {
        return Route::_($internalRoute);
    }

    protected function asMediaUrl(string $path): string
    {
        if ($path === '') {
            return '';
        }

        if (preg_match('#^(https?:)?//#i', $path)) {
            return $path;
        }

        if ($path[0] === '/') {
            return Uri::root(false) . ltrim($path, '/');
        }

        return Uri::root(false) . ltrim($path, '/');
    }

    protected function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_COMPAT, 'UTF-8');
    }

    protected function resolveNumericId($value): int
    {
        if (\is_numeric($value)) {
            return (int) $value;
        }

        if (\is_string($value) && preg_match('/\d+/', $value, $matches)) {
            return (int) $matches[0];
        }

        return 0;
    }
}

