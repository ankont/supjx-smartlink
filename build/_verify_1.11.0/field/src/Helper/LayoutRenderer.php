<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;

final class LayoutRenderer
{
    public function __construct(private readonly string $pluginRoot)
    {
    }

    /**
     * @param   array<string, mixed>  $displayData
     */
    public function render(string $layout, array $displayData = [], string $templateName = ''): string
    {
        $path = $this->resolve($layout, $templateName);

        if ($path === null) {
            return '';
        }

        ob_start();
        include $path;

        return (string) ob_get_clean();
    }

    private function resolve(string $layout, string $templateName = ''): ?string
    {
        $relative = trim(str_replace(['\\', '.'], '/', $layout), '/') . '.php';

        foreach ($this->paths($templateName) as $basePath) {
            $candidate = rtrim($basePath, '/\\') . '/' . $relative;

            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    private function paths(string $templateName = ''): array
    {
        $paths = [];
        $template = method_exists(Factory::getApplication(), 'getTemplate') ? (string) Factory::getApplication()->getTemplate() : '';
        $templateName = trim(str_replace('\\', '/', $templateName), '/');

        if ($template !== '') {
            if ($templateName !== '') {
                $paths[] = JPATH_SITE . '/templates/' . $template . '/html/layouts/plg_fields_smartlink/templates/' . $templateName;
            }

            $paths[] = JPATH_SITE . '/templates/' . $template . '/html/layouts/plg_fields_smartlink';
        }

        if ($templateName !== '') {
            $paths[] = $this->pluginRoot . '/layouts/templates/' . $templateName;
        }

        $paths[] = $this->pluginRoot . '/layouts';

        return $paths;
    }
}
