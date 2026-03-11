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
    public static function getSubscribedEvents(): array
    {
        $events = method_exists(parent::class, 'getSubscribedEvents')
            ? parent::getSubscribedEvents()
            : [];

        $events['onAjaxSmartlink'] = 'handleAjaxSmartlink';

        return $events;
    }

    /**
     * @return array<string, mixed>
     */
    public function onAjaxSmartlink(): array
    {
        return $this->buildAjaxMetadata();
    }

    public function handleAjaxSmartlink(object $event): void
    {
        $result = $this->buildAjaxMetadata();

        if (method_exists($event, 'addResult')) {
            $event->addResult($result);

            return;
        }

        if (method_exists($event, 'setArgument')) {
            $event->setArgument('result', $result);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAjaxMetadata(): array
    {
        $input = Factory::getApplication()->input;
        $kind = (string) $input->getCmd('kind');
        $rawValue = $input->get('value', '', 'raw');
        $registry = TargetRegistry::createDefault();

        if ($kind === '' || !$registry->has($kind)) {
            return [];
        }

        $value = $kind === 'com_tags_tag'
            ? array_values(array_filter(array_map('trim', preg_split('/\s*,\s*/', (string) $rawValue, -1, PREG_SPLIT_NO_EMPTY) ?: [])))
            : $rawValue;

        try {
            $payload = Schema::sanitizePayload(
                [
                    'kind' => $kind,
                    'value' => $value,
                    'action' => 'no_action',
                ],
                [
                    'allowed_kinds' => [$kind],
                    'default_kind' => $kind,
                    'allowed_actions' => ['no_action'],
                    'default_action' => 'no_action',
                ]
            );

            $resolved = $registry->get($kind)->resolve($payload);

            return [
                'label' => (string) (($resolved['title'] ?? '') ?: ($resolved['label'] ?? '')),
                'summary' => (string) ($resolved['summary'] ?? ''),
                'image' => (string) ($resolved['image'] ?? ''),
                'image_alt' => (string) ($resolved['image_alt'] ?? ''),
            ];
        } catch (\Throwable $error) {
            return [];
        }
    }

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
        $field->value = $renderer->render(
            $payload,
            [
                'template_name' => (string) ($config['template_name'] ?? ''),
            ]
        );
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
