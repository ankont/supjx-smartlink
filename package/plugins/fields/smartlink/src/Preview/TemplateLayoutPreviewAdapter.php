<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Preview;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;

final class TemplateLayoutPreviewAdapter implements PreviewAdapterInterface
{
    public function render(array $contract, array $context = []): ?string
    {
        if (!\defined('JPATH_SITE')) {
            return null;
        }

        try {
            $template = Factory::getApplication()->getTemplate(true);
            $templateName = trim((string) ($template->template ?? ''));
        } catch (\Throwable $error) {
            return null;
        }

        if ($templateName === '') {
            return null;
        }

        $path = JPATH_SITE . '/templates/' . $templateName . '/html/plg_fields_smartlink/preview.php';

        if (!is_file($path)) {
            return null;
        }

        $displayData = ['smartlink' => $contract, 'context' => $context];
        ob_start();

        try {
            include $path;
        } catch (\Throwable $error) {
            ob_end_clean();

            return null;
        }

        return (string) ob_get_clean();
    }
}
