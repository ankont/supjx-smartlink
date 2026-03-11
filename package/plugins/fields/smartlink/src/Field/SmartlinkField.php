<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Field;

\defined('_JEXEC') or die;

use InvalidArgumentException;
use Joomla\CMS\Factory;
use Joomla\CMS\Form\FormField;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Uri\Uri;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Schema;

class SmartlinkField extends FormField
{
    protected $type = 'Smartlink';

    protected function getInput()
    {
        $config = $this->getFieldConfig();
        $value = (string) $this->value;

        $this->loadAssets();

        $encodedConfig = htmlspecialchars((string) json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), ENT_COMPAT, 'UTF-8');
        $encodedValue = htmlspecialchars($value, ENT_COMPAT, 'UTF-8');
        $bootScript = <<<HTML
<script>
(function retrySmartLinkBoot(attempt) {
  if (window.SuperSoftSmartLinkBuilder && typeof window.SuperSoftSmartLinkBuilder.boot === "function") {
    window.SuperSoftSmartLinkBuilder.boot();
    return;
  }

  if (attempt < 30) {
    window.setTimeout(function () {
      retrySmartLinkBoot(attempt + 1);
    }, 100);
  }
})(0);
</script>
HTML;

        return sprintf(
            '<div class="smartlink-builder js-smartlink-builder" data-input-id="%s" data-config="%s"></div><input type="hidden" name="%s" id="%s" value="%s"><div class="small text-muted">%s</div>%s',
            htmlspecialchars($this->id, ENT_COMPAT, 'UTF-8'),
            $encodedConfig,
            htmlspecialchars($this->name, ENT_COMPAT, 'UTF-8'),
            htmlspecialchars($this->id, ENT_COMPAT, 'UTF-8'),
            $encodedValue,
            htmlspecialchars(Text::_('PLG_FIELDS_SMARTLINK_FIELD_HELP'), ENT_COMPAT, 'UTF-8'),
            $bootScript
        );
    }

    public function filter($value, $group = null, $input = null)
    {
        if ($value === null || $value === '') {
            return '';
        }

        try {
            return Schema::encode(Schema::sanitizePayload($value, $this->getFieldConfig()));
        } catch (\Throwable $error) {
            return (string) $value;
        }
    }

    public function validate($value, $group = null, $input = null)
    {
        if ($value === null || $value === '') {
            return true;
        }

        try {
            Schema::sanitizePayload($value, $this->getFieldConfig());

            return true;
        } catch (InvalidArgumentException $error) {
            Factory::getApplication()->enqueueMessage($error->getMessage(), 'error');

            return false;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function getFieldConfig(): array
    {
        $attributes = [
            'allowed_kinds' => (string) ($this->element['allowed_kinds'] ?? ''),
            'allowed_actions' => (string) ($this->element['allowed_actions'] ?? ''),
            'default_kind' => (string) ($this->element['default_kind'] ?? ''),
            'default_action' => (string) ($this->element['default_action'] ?? ''),
            'validation_profile' => (string) ($this->element['validation_profile'] ?? ''),
            'allow_external_media' => (string) ($this->element['allow_external_media'] ?? ''),
            'max_gallery_items' => (string) ($this->element['max_gallery_items'] ?? ''),
            'template_name' => (string) ($this->element['template_name'] ?? ''),
        ];

        return Schema::fieldConfigFromParams($attributes);
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
