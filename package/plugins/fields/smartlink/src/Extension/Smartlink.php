<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Extension;

\defined('_JEXEC') or die;

use Joomla\Component\Fields\Administrator\Plugin\FieldsPlugin;
use Joomla\CMS\Factory;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Uri\Uri;
use Joomla\Event\GenericEvent;
use Joomla\Event\SubscriberInterface;
use SuperSoft\Plugin\Fields\Smartlink\Contract\ContractFactory;
use SuperSoft\Plugin\Fields\Smartlink\Contract\ResolvedTargetNormalizer;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Renderer;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Schema;
use SuperSoft\Plugin\Fields\Smartlink\Helper\TargetRegistry;
use SuperSoft\Plugin\Fields\Smartlink\Preview\GenericPreviewAdapter;
use SuperSoft\Plugin\Fields\Smartlink\Preview\PreviewAdapterRegistry;
use SuperSoft\Plugin\Fields\Smartlink\Preview\TemplateLayoutPreviewAdapter;

final class Smartlink extends FieldsPlugin implements SubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        $events = method_exists(parent::class, 'getSubscribedEvents')
            ? parent::getSubscribedEvents()
            : [];

        $events['onAjaxSmartlink'] = 'handleAjaxSmartlink';
        $events['onBeforeCompileHead'] = 'loadFieldDefinitionAssets';

        return $events;
    }

    public function loadFieldDefinitionAssets(): void
    {
        $application = Factory::getApplication();

        if (!$application->isClient('administrator')) {
            return;
        }

        $input = $application->input;

        if ($input->getCmd('option') !== 'com_fields' || $input->getCmd('view') !== 'field') {
            return;
        }

        $document = $application->getDocument();

        if (!method_exists($document, 'addScript') || !method_exists($document, 'addStyleSheet')) {
            return;
        }

        $mediaBase = rtrim(Uri::root(true), '/') . '/media/plg_fields_smartlink';
        $document->addStyleSheet($mediaBase . '/smartlink-admin.css');
        $document->addScript($mediaBase . '/smartlink-admin.js');
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

        if ($input->getCmd('mode') === 'preview') {
            return $this->buildAjaxPreview();
        }

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

            $resolved = (new ResolvedTargetNormalizer())->normalise(
                $payload,
                $registry->get($kind)->resolve($payload)
            );

            return [
                'label' => (string) ($resolved['display_name'] ?? ''),
                'href' => (string) ($resolved['href'] ?? ''),
                'summary' => (string) ($resolved['summary'] ?? ''),
                'image' => (string) ($resolved['image'] ?? ''),
                'image_alt' => (string) ($resolved['image_alt'] ?? ''),
                'items' => isset($resolved['items']) && \is_array($resolved['items']) ? $resolved['items'] : [],
            ];
        } catch (\Throwable $error) {
            return [];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAjaxPreview(): array
    {
        if (!Session::checkToken('post')) {
            return ['html' => '', 'error' => 'Invalid token.'];
        }

        $input = Factory::getApplication()->input;
        $rawPayload = (string) $input->get('payload', '', 'raw');
        $rawConfig = (string) $input->get('config', '', 'raw');
        $decodedConfig = json_decode($rawConfig, true);
        $config = Schema::fieldConfigFromParams(\is_array($decodedConfig) ? $decodedConfig : []);

        try {
            $payload = Schema::sanitizePayload($rawPayload, $config);
            $storedIntent = Schema::applyAuthoringProfile($payload, $config);
            $effectivePayload = Schema::sanitizePayload($storedIntent, $config);
            $contract = (new ContractFactory(TargetRegistry::createDefault()))->create($effectivePayload, $config);
            $context = [
                'preview' => true,
                'field' => trim((string) $input->get('field', '', 'raw')),
                'html_output_mode' => (string) ($config['html_output_mode'] ?? 'compact'),
                'use_smartlink_styles' => !empty($config['use_smartlink_styles']),
                'thumbnail_empty_mode' => (string) ($config['thumbnail_empty_mode'] ?? 'generic'),
                'thumbnail_empty_class' => (string) ($config['thumbnail_empty_class'] ?? 'smartlink-image-empty'),
                'thumbnail_position' => (string) ($config['thumbnail_position'] ?? 'inline'),
                'thumbnail_ratio' => (string) ($config['thumbnail_ratio'] ?? 'auto'),
                'thumbnail_fit' => (string) ($config['thumbnail_fit'] ?? 'cover'),
                'thumbnail_size' => (string) ($config['thumbnail_size'] ?? 'md'),
            ];

            return [
                'html' => $this->previewAdapters($context)->render($contract, $context),
            ];
        } catch (\Throwable $error) {
            return ['html' => '', 'error' => $error->getMessage()];
        }
    }

    /**
     * @param   array<string, mixed>  $context
     */
    private function previewAdapters(array $context): PreviewAdapterRegistry
    {
        $registry = (new PreviewAdapterRegistry())
            ->register(new TemplateLayoutPreviewAdapter(), 100)
            ->register(new GenericPreviewAdapter(), -100);
        $event = new GenericEvent('onSmartlinkRegisterPreviewAdapters', ['registry' => $registry, 'context' => $context]);

        try {
            Factory::getApplication()->getDispatcher()->dispatch($event->getName(), $event);
        } catch (\Throwable $error) {
        }

        return $registry;
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

        $contract = (new ContractFactory(TargetRegistry::createDefault()))->create($payload, $config);
        $presentation = (array) ($contract['presentation'] ?? []);
        $this->loadAssets(!empty($config['use_smartlink_styles']), ($presentation['action'] ?? '') === 'toggle_view');

        $renderer = new Renderer();
        $field->value = $renderer->render(
            $contract,
            [
                'html_output_mode' => (string) ($config['html_output_mode'] ?? 'compact'),
                'use_smartlink_styles' => !empty($config['use_smartlink_styles']),
                'thumbnail_empty_mode' => (string) ($config['thumbnail_empty_mode'] ?? 'generic'),
                'thumbnail_empty_class' => (string) ($config['thumbnail_empty_class'] ?? 'smartlink-image-empty'),
                'thumbnail_position' => (string) ($config['thumbnail_position'] ?? 'inline'),
                'thumbnail_ratio' => (string) ($config['thumbnail_ratio'] ?? 'auto'),
                'thumbnail_fit' => (string) ($config['thumbnail_fit'] ?? 'cover'),
                'thumbnail_size' => (string) ($config['thumbnail_size'] ?? 'md'),
                'thumbnail_position_class_inline' => (string) ($config['thumbnail_position_class_inline'] ?? 'smartlink-thumb--inline'),
                'thumbnail_position_class_top' => (string) ($config['thumbnail_position_class_top'] ?? 'smartlink-thumb--top'),
                'thumbnail_position_class_bottom' => (string) ($config['thumbnail_position_class_bottom'] ?? 'smartlink-thumb--bottom'),
                'thumbnail_position_class_left' => (string) ($config['thumbnail_position_class_left'] ?? 'smartlink-thumb--left'),
                'thumbnail_position_class_right' => (string) ($config['thumbnail_position_class_right'] ?? 'smartlink-thumb--right'),
                'thumbnail_ratio_class_auto' => (string) ($config['thumbnail_ratio_class_auto'] ?? 'smartlink-thumb--ratio-auto'),
                'thumbnail_ratio_class_1_1' => (string) ($config['thumbnail_ratio_class_1_1'] ?? 'smartlink-thumb--ratio-1-1'),
                'thumbnail_ratio_class_4_3' => (string) ($config['thumbnail_ratio_class_4_3'] ?? 'smartlink-thumb--ratio-4-3'),
                'thumbnail_ratio_class_16_9' => (string) ($config['thumbnail_ratio_class_16_9'] ?? 'smartlink-thumb--ratio-16-9'),
                'thumbnail_fit_class_cover' => (string) ($config['thumbnail_fit_class_cover'] ?? 'smartlink-thumb--fit-cover'),
                'thumbnail_fit_class_contain' => (string) ($config['thumbnail_fit_class_contain'] ?? 'smartlink-thumb--fit-contain'),
                'thumbnail_fit_class_fill' => (string) ($config['thumbnail_fit_class_fill'] ?? 'smartlink-thumb--fit-fill'),
                'thumbnail_fit_class_none' => (string) ($config['thumbnail_fit_class_none'] ?? 'smartlink-thumb--fit-none'),
                'thumbnail_fit_class_scale_down' => (string) ($config['thumbnail_fit_class_scale_down'] ?? 'smartlink-thumb--fit-scale-down'),
                'thumbnail_size_class_sm' => (string) ($config['thumbnail_size_class_sm'] ?? 'smartlink-thumb--sm'),
                'thumbnail_size_class_md' => (string) ($config['thumbnail_size_class_md'] ?? 'smartlink-thumb--md'),
                'thumbnail_size_class_lg' => (string) ($config['thumbnail_size_class_lg'] ?? 'smartlink-thumb--lg'),
            ]
        );
        $field->smartlink = $contract;
        $field->rawvalue = $rawValue;

        return $field->value;
    }

    private function loadAssets(bool $loadContentStyles = true, bool $loadContentScript = false): void
    {
        static $scriptsLoaded = false;
        static $stylesLoaded = false;
        static $contentScriptLoaded = false;

        $document = Factory::getApplication()->getDocument();
        $mediaBase = rtrim(Uri::root(true), '/') . '/media';

        if (!method_exists($document, 'addScript') || !method_exists($document, 'addStyleSheet')) {
            return;
        }

        if ($loadContentStyles && !$stylesLoaded) {
            $document->addStyleSheet($mediaBase . '/plg_fields_smartlink/smartlink-content.css');
            $stylesLoaded = true;
        }

        if ($loadContentScript && !$contentScriptLoaded) {
            $document->addScript($mediaBase . '/plg_fields_smartlink/smartlink-content.js');
            $contentScriptLoaded = true;
        }

        if ($scriptsLoaded) {
            return;
        }

        $document->addScript($mediaBase . '/plg_fields_smartlink/pickers.js');
        $document->addScript($mediaBase . '/plg_fields_smartlink/smartlink-builder.js');

        $scriptsLoaded = true;
    }
}
