<?php
/**
 * @package     SmartLink
 * @subpackage  plg_system_smartlinkassets
 */

defined('_JEXEC') or die;

use Joomla\CMS\Extension\PluginInterface;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;
use SuperSoft\Plugin\System\Smartlinkassets\Extension\Smartlinkassets;

return new class implements ServiceProviderInterface {
    public function register(Container $container): void
    {
        $container->set(
            PluginInterface::class,
            function (Container $container) {
                $plugin = new Smartlinkassets(
                    (array) PluginHelper::getPlugin('system', 'smartlinkassets')
                );

                $plugin->setApplication(Factory::getApplication());

                return $plugin;
            }
        );
    }
};
