<?php
/**
 * @package     SmartLink
 * @subpackage  plg_system_smartlinkassets
 */

namespace SuperSoft\Plugin\System\Smartlinkassets\Extension;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Uri\Uri;
use Joomla\Event\SubscriberInterface;
use Joomla\Registry\Registry;

final class Smartlinkassets extends CMSPlugin implements SubscriberInterface
{
    private const DEFAULT_ICON_STYLESHEET_URL = '/media/system/css/joomla-fontawesome.min.css';
    private const DEFAULT_CONTENT_STYLESHEET_URL = '/media/plg_fields_smartlink/smartlink-content.css';
    private const DEFAULT_CONTENT_SCRIPT_URL = '/media/plg_fields_smartlink/smartlink-content.js';

    public static function getSubscribedEvents(): array
    {
        return [
            'onAfterRender' => 'onAfterRender',
        ];
    }

    public function onAfterRender(): void
    {
        $app = Factory::getApplication();

        if (!$app->isClient('site')) {
            return;
        }

        $document = $app->getDocument();

        if (!method_exists($document, 'getType') || $document->getType() !== 'html') {
            return;
        }

        $body = (string) $app->getBody();
        $bodyChanged = false;

        if ($this->isContentOnlyRequest()) {
            $nextBody = $this->transformToContentOnly($body);

            if ($nextBody !== $body) {
                $body = $nextBody;
                $bodyChanged = true;
            }
        }

        if ($body === '' || stripos($body, 'smartlink') === false || !$this->containsSmartlinkMarkup($body)) {
            if ($bodyChanged) {
                $app->setBody($body);
            }

            return;
        }

        $config = $this->editorConfig();

        $tags = [];
        $useSmartlinkStyles = $this->normaliseBoolean($config->get('use_smartlink_styles', 1), true);

        if ($useSmartlinkStyles) {
            $contentHref = $this->absoluteAssetUrl(self::DEFAULT_CONTENT_STYLESHEET_URL);

            if ($contentHref !== '' && stripos($body, $contentHref) === false && stripos($body, self::DEFAULT_CONTENT_STYLESHEET_URL) === false) {
                $tags[] = '<link rel="stylesheet" href="' . htmlspecialchars($contentHref, ENT_COMPAT, 'UTF-8') . '">';
            }

            if (stripos($body, 'smartlink-icon') !== false) {
                $iconHref = $this->absoluteAssetUrl((string) $config->get('icon_stylesheet_url', self::DEFAULT_ICON_STYLESHEET_URL));

                if ($iconHref !== '' && stripos($body, $iconHref) === false && stripos($body, (string) $config->get('icon_stylesheet_url', self::DEFAULT_ICON_STYLESHEET_URL)) === false) {
                    $tags[] = '<link rel="stylesheet" href="' . htmlspecialchars($iconHref, ENT_COMPAT, 'UTF-8') . '">';
                }
            }
        }

        if (stripos($body, 'data-toggle-view') !== false || stripos($body, 'data-src') !== false) {
            $scriptSrc = $this->absoluteAssetUrl(self::DEFAULT_CONTENT_SCRIPT_URL);

            if ($scriptSrc !== '' && stripos($body, $scriptSrc) === false && stripos($body, self::DEFAULT_CONTENT_SCRIPT_URL) === false) {
                $tags[] = '<script src="' . htmlspecialchars($scriptSrc, ENT_COMPAT, 'UTF-8') . '"></script>';
            }
        }

        if ($tags === [] || stripos($body, '</head>') === false) {
            if ($bodyChanged) {
                $app->setBody($body);
            }

            return;
        }

        $app->setBody(str_ireplace('</head>', implode('', $tags) . '</head>', $body));
    }

    private function isContentOnlyRequest(): bool
    {
        return Factory::getApplication()->input->getCmd('smartlink') === 'content';
    }

    private function transformToContentOnly(string $html): string
    {
        if ($html === '' || !class_exists(\DOMDocument::class) || !class_exists(\DOMXPath::class)) {
            return $html;
        }

        $option = Factory::getApplication()->input->getCmd('option');
        $view = Factory::getApplication()->input->getCmd('view');
        $dom = new \DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);

        try {
            $loaded = $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NOWARNING | LIBXML_NOERROR);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        if (!$loaded) {
            return $html;
        }

        foreach ($dom->childNodes as $node) {
            if ($node->nodeType === XML_PI_NODE) {
                $dom->removeChild($node);
                break;
            }
        }

        $xpath = new \DOMXPath($dom);
        $bodyNode = $dom->getElementsByTagName('body')->item(0);

        if (!$bodyNode instanceof \DOMElement) {
            return $html;
        }

        $selected = null;

        foreach ($this->contentOnlyCandidateXpaths($option, $view) as $expression) {
            $nodes = $xpath->query($expression);

            if ($nodes instanceof \DOMNodeList && $nodes->length > 0 && $nodes->item(0) instanceof \DOMNode) {
                $selected = $nodes->item(0);
                break;
            }
        }

        if (!$selected instanceof \DOMNode) {
            return $html;
        }

        while ($bodyNode->firstChild) {
            $bodyNode->removeChild($bodyNode->firstChild);
        }

        $bodyClass = trim($bodyNode->getAttribute('class'));
        $bodyNode->setAttribute('class', trim($bodyClass . ' smartlink-content-only'));
        $bodyNode->appendChild($dom->importNode($selected, true));

        return (string) $dom->saveHTML();
    }

    /**
     * @return array<int, string>
     */
    private function contentOnlyCandidateXpaths(string $option, string $view): array
    {
        if ($option === 'com_content' && $view === 'article') {
            return [
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' com-content-article__body ')]",
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' article-body ')]",
                '//main',
            ];
        }

        if ($option === 'com_content' && $view === 'category') {
            return [
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' com-content-category-blog ')]",
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' blog-items ')]",
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' category-list ')]",
                '//main',
            ];
        }

        if ($option === 'com_contact' && $view === 'contact') {
            return [
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' com-contact ')]",
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' contact ')]",
                '//main',
            ];
        }

        if ($option === 'com_tags' && $view === 'tag') {
            return [
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' com-tags-tag ')]",
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' tag-category ')]",
                '//main',
            ];
        }

        if ($option === 'com_users' && $view === 'profile') {
            return [
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' com-users-profile ')]",
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' profile ')]",
                '//main',
            ];
        }

        return [
            '//main',
            "//*[@id='content']",
            "//*[contains(concat(' ', normalize-space(@class), ' '), ' component-content ')]",
            '/html/body/*[1]',
        ];
    }

    private function editorConfig(): Registry
    {
        $plugin = PluginHelper::getPlugin('editors-xtd', 'smartlink');

        return new Registry($plugin->params ?? null);
    }

    private function containsSmartlinkMarkup(string $body): bool
    {
        return (bool) preg_match('/class=(["\'])(?:(?!\1).)*\bsmartlink(?:\b|-wrapper\b|-links\b|-view\b|-thumb\b)(?:(?!\1).)*\1/i', $body);
    }

    private function absoluteAssetUrl(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            return '';
        }

        if (preg_match('#^(?:https?:)?//#i', $value)) {
            return $value;
        }

        if ($value[0] === '/') {
            return rtrim(Uri::root(), '/') . $value;
        }

        return rtrim(Uri::root(), '/') . '/' . ltrim($value, '/');
    }

    /**
     * @param   mixed  $value
     */
    private function normaliseBoolean($value, bool $fallback = false): bool
    {
        if (\is_bool($value)) {
            return $value;
        }

        if (\is_int($value) || \is_float($value)) {
            return (bool) $value;
        }

        if (\is_string($value)) {
            $value = strtolower(trim($value));

            if (\in_array($value, ['1', 'true', 'yes', 'on'], true)) {
                return true;
            }

            if (\in_array($value, ['0', 'false', 'no', 'off', ''], true)) {
                return false;
            }
        }

        return $fallback;
    }
}
