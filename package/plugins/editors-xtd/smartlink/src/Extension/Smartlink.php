<?php
/**
 * @package     SmartLink
 * @subpackage  plg_editors-xtd_smartlink
 */

namespace SuperSoft\Plugin\EditorsXtd\Smartlink\Extension;

\defined('_JEXEC') or die;

use Joomla\CMS\Editor\Button\Button;
use Joomla\CMS\Event\Editor\EditorButtonsSetupEvent;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Uri\Uri;
use Joomla\Event\SubscriberInterface;
use SuperSoft\Plugin\EditorsXtd\Smartlink\Helper\Insert;

final class Smartlink extends CMSPlugin implements SubscriberInterface
{
    protected $autoloadLanguage = true;

    public static function getSubscribedEvents(): array
    {
        return [
            'onEditorButtonsSetup' => 'onEditorButtonsSetup',
        ];
    }

    public function onEditorButtonsSetup(EditorButtonsSetupEvent $event): void
    {
        if (!Factory::getApplication()->isClient('administrator')) {
            return;
        }

        $registry = $event->getButtonsRegistry();
        $disabled = $event->getDisabledButtons();

        if (\in_array('smartlink', $disabled, true)) {
            return;
        }

        $this->loadLanguage();
        $this->loadAssets();

        $button = new Button(
            'smartlink',
            [
                'text' => Text::_('PLG_EDITORS-XTD_SMARTLINK_BUTTON'),
                'icon' => 'link',
                'action' => 'supersoft-smartlink',
            ],
            [
                'editorId' => $event->getEditorId(),
                'config' => Insert::defaultConfig(),
            ]
        );

        $registry->add($button);
    }

    private function loadAssets(): void
    {
        static $loaded = false;

        if ($loaded) {
            return;
        }

        $document = Factory::getApplication()->getDocument();
        $mediaBase = rtrim(Uri::root(true), '/') . '/media';

        if (!method_exists($document, 'addScript') || !method_exists($document, 'addStyleSheet') || !method_exists($document, 'addCustomTag')) {
            return;
        }

        $document->addStyleSheet($mediaBase . '/plg_fields_smartlink/smartlink-builder.css');
        $document->addScript($mediaBase . '/plg_fields_smartlink/pickers.js');
        $document->addScript($mediaBase . '/plg_fields_smartlink/smartlink-builder.js');
        $document->addCustomTag(
            '<script type="module" src="'
            . htmlspecialchars($mediaBase . '/plg_editors-xtd_smartlink/smartlink-editor.js', ENT_COMPAT, 'UTF-8')
            . '"></script>'
        );

        $loaded = true;
    }
}
