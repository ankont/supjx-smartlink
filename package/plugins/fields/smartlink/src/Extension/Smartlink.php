<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Extension;

\defined('_JEXEC') or die;

use Joomla\Component\Fields\Administrator\Plugin\FieldsPlugin;
use Joomla\CMS\Factory;
use Joomla\CMS\Uri\Uri;
use Joomla\Event\SubscriberInterface;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Renderer;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Schema;
use SuperSoft\Plugin\Fields\Smartlink\Helper\TargetRegistry;

final class Smartlink extends FieldsPlugin implements SubscriberInterface
{
    public function onCustomFieldsPrepareField($context, $item, $field): ?string
    {
        if (!isset($field->type) || strtolower((string) $field->type) !== 'smartlink') {
            return '';
        }

        $config = Schema::fieldConfigFromParams($field->fieldparams ?? []);
        $rawValue = $field->rawvalue ?? $field->value ?? '';

        if ($rawValue === '' || $rawValue === null) {
            $field->value = '';

            return '';
        }

        try {
            $payload = Schema::sanitizePayload($rawValue, $config);
        } catch (\Throwable $error) {
            $field->value = '';

            return '';
        }

        $this->loadAssets();

        $renderer = new Renderer(TargetRegistry::createDefault());
        $field->value = $renderer->render($payload);
        $field->rawvalue = $rawValue;

        return $field->value;
    }

    private function loadAssets(): void
    {
        static $loaded = false;

        if ($loaded) {
            return;
        }

        $document = Factory::getApplication()->getDocument();
        $mediaBase = rtrim(Uri::root(true), '/') . '/media';

        if (!method_exists($document, 'addScript') || !method_exists($document, 'addStyleSheet')) {
            return;
        }

        $document->addStyleSheet($mediaBase . '/plg_fields_smartlink/smartlink-builder.css');
        $document->addScript($mediaBase . '/plg_fields_smartlink/pickers.js');
        $document->addScript($mediaBase . '/plg_fields_smartlink/smartlink-builder.js');

        $loaded = true;
    }
}
