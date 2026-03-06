<?php
/**
 * @package     SmartLink
 * @subpackage  plg_editors-xtd_smartlink
 */

namespace SuperSoft\Plugin\EditorsXtd\Smartlink\Helper;

\defined('_JEXEC') or die;

final class Insert
{
    /**
     * @return array<string, mixed>
     */
    public static function defaultConfig(): array
    {
        return [
            'allowed_kinds' => [
                'external_url',
                'anchor',
                'email',
                'phone',
                'com_content_article',
                'com_content_category',
                'menu_item',
                'com_tags_tag',
                'relative_url',
                'com_contact_contact',
                'user_profile',
                'advanced_route',
                'media_file',
                'image',
                'video',
                'gallery',
            ],
            'allowed_actions' => [
                'link_open',
                'link_download',
                'preview_modal',
                'embed',
            ],
            'default_kind' => 'external_url',
            'default_action' => 'link_open',
            'validation_profile' => 'any',
            'allow_external_media' => 1,
            'max_gallery_items' => 12,
            'advanced_kinds' => [
                'relative_url',
                'user_profile',
                'advanced_route',
            ],
        ];
    }
}
