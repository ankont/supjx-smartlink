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
        $internalRoute = trim($internalRoute);

        if ($internalRoute === '') {
            return '';
        }

        if (preg_match('#^(?:https?:)?//#i', $internalRoute)) {
            return $internalRoute;
        }

        try {
            return Route::_($internalRoute);
        } catch (\Throwable $error) {
        }

        return $this->rootRelativeInternalRoute($internalRoute);
    }

    protected function rootRelativeInternalRoute(string $internalRoute): string
    {
        $internalRoute = trim($internalRoute);

        if ($internalRoute === '') {
            return '';
        }

        if (preg_match('#^(?:https?:)?//#i', $internalRoute)) {
            return $internalRoute;
        }

        $base = rtrim((string) Uri::root(true), '/');
        $path = '/' . ltrim($internalRoute, '/');

        return ($base !== '' ? $base : '') . $path;
    }

    protected function asMediaUrl(string $path): string
    {
        $path = $this->normaliseMediaReference($path);

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

    protected function normaliseMediaReference(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            return '';
        }

        $marker = '#joomlaImage://';
        $markerPosition = strpos($value, $marker);

        if ($markerPosition !== false) {
            $value = trim(substr($value, 0, $markerPosition));
        }

        return $value;
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
