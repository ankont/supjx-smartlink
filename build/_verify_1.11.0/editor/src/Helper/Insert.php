<?php
/**
 * @package     SmartLink
 * @subpackage  plg_editors-xtd_smartlink
 */

namespace SuperSoft\Plugin\EditorsXtd\Smartlink\Helper;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\Registry\Registry;

final class Insert
{
    /**
     * @param   Registry|array<string, mixed>|string|null  $params
     *
     * @return array<string, mixed>
     */
    public static function defaultConfig($params = null): array
    {
        self::loadBuilderLanguage();

        if (\is_string($params) && $params !== '') {
            $params = new Registry($params);
        }

        $readString = static function ($source, string $key, string $default = ''): string {
            if ($source instanceof Registry) {
                if (method_exists($source, 'exists') && !$source->exists($key)) {
                    return $default;
                }

                $value = $source->get($key, null);

                return $value === null ? $default : trim((string) $value);
            }

            if (\is_array($source)) {
                return array_key_exists($key, $source)
                    ? trim((string) $source[$key])
                    : $default;
            }

            return $default;
        };

        $readBool = static function ($source, string $key, bool $default = true): bool {
            $value = null;

            if ($source instanceof Registry) {
                if (method_exists($source, 'exists') && !$source->exists($key)) {
                    return $default;
                }

                $value = $source->get($key, null);
            } elseif (\is_array($source) && array_key_exists($key, $source)) {
                $value = $source[$key];
            }

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

            return $default;
        };

        $iconStylesheetUrl = '';
        $htmlOutputMode = 'compact';
        $useSmartlinkStyles = true;
        $thumbnailEmptyMode = 'generic';
        $thumbnailEmptyClass = 'smartlink-image-empty';
        $thumbnailPosition = 'inline';
        $thumbnailRatio = 'auto';
        $thumbnailFit = 'cover';
        $thumbnailSize = 'md';
        $thumbnailPositionClassInline = $readString($params, 'thumbnail_position_class_inline', 'smartlink-thumb--inline');
        $thumbnailPositionClassTop = $readString($params, 'thumbnail_position_class_top', 'smartlink-thumb--top');
        $thumbnailPositionClassBottom = $readString($params, 'thumbnail_position_class_bottom', 'smartlink-thumb--bottom');
        $thumbnailPositionClassLeft = $readString($params, 'thumbnail_position_class_left', 'smartlink-thumb--left');
        $thumbnailPositionClassRight = $readString($params, 'thumbnail_position_class_right', 'smartlink-thumb--right');
        $thumbnailRatioClassAuto = $readString($params, 'thumbnail_ratio_class_auto', 'smartlink-thumb--ratio-auto');
        $thumbnailRatioClass11 = $readString($params, 'thumbnail_ratio_class_1_1', 'smartlink-thumb--ratio-1-1');
        $thumbnailRatioClass43 = $readString($params, 'thumbnail_ratio_class_4_3', 'smartlink-thumb--ratio-4-3');
        $thumbnailRatioClass169 = $readString($params, 'thumbnail_ratio_class_16_9', 'smartlink-thumb--ratio-16-9');
        $thumbnailFitClassCover = $readString($params, 'thumbnail_fit_class_cover', 'smartlink-thumb--fit-cover');
        $thumbnailFitClassContain = $readString($params, 'thumbnail_fit_class_contain', 'smartlink-thumb--fit-contain');
        $thumbnailFitClassFill = $readString($params, 'thumbnail_fit_class_fill', 'smartlink-thumb--fit-fill');
        $thumbnailFitClassNone = $readString($params, 'thumbnail_fit_class_none', 'smartlink-thumb--fit-none');
        $thumbnailFitClassScaleDown = $readString($params, 'thumbnail_fit_class_scale_down', 'smartlink-thumb--fit-scale-down');
        $thumbnailSizeClassSm = $readString($params, 'thumbnail_size_class_sm', 'smartlink-thumb--sm');
        $thumbnailSizeClassMd = $readString($params, 'thumbnail_size_class_md', 'smartlink-thumb--md');
        $thumbnailSizeClassLg = $readString($params, 'thumbnail_size_class_lg', 'smartlink-thumb--lg');

        $iconStylesheetUrl = $readString($params, 'icon_stylesheet_url', '');
        $htmlOutputMode = $readString($params, 'html_output_mode', 'compact') ?: 'compact';
        $useSmartlinkStyles = $readBool($params, 'use_smartlink_styles', true);
        $linkButtonClass = $readString($params, 'link_button_class', 'smartlink-actionbtn') ?: 'smartlink-actionbtn';
        $thumbnailEmptyMode = $readString($params, 'thumbnail_empty_mode', 'generic') ?: 'generic';
        $thumbnailEmptyClass = $readString($params, 'thumbnail_empty_class', 'smartlink-image-empty') ?: 'smartlink-image-empty';
        $thumbnailPosition = $readString($params, 'thumbnail_position', 'inline') ?: 'inline';
        $thumbnailRatio = $readString($params, 'thumbnail_ratio', 'auto') ?: 'auto';
        $thumbnailFit = $readString($params, 'thumbnail_fit', 'cover') ?: 'cover';
        $thumbnailSize = $readString($params, 'thumbnail_size', 'md') ?: 'md';

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
                'no_action',
                'link_open',
                'link_download',
                'preview_modal',
                'toggle_view',
            ],
            'default_kind' => 'external_url',
            'default_action' => 'link_open',
            'validation_profile' => 'any',
            'allow_external_media' => 1,
            'max_gallery_items' => 12,
            'icon_stylesheet_url' => $iconStylesheetUrl,
            'html_output_mode' => \in_array($htmlOutputMode, ['compact', 'pretty'], true) ? $htmlOutputMode : 'compact',
            'asset_version' => '1.11.0',
            'use_smartlink_styles' => $useSmartlinkStyles,
            'link_button_class' => $linkButtonClass,
            'thumbnail_empty_mode' => $thumbnailEmptyMode,
            'thumbnail_empty_class' => $thumbnailEmptyClass,
            'thumbnail_position' => $thumbnailPosition,
            'thumbnail_ratio' => $thumbnailRatio,
            'thumbnail_fit' => $thumbnailFit,
            'thumbnail_size' => $thumbnailSize,
            'thumbnail_position_class_inline' => $thumbnailPositionClassInline,
            'thumbnail_position_class_top' => $thumbnailPositionClassTop,
            'thumbnail_position_class_bottom' => $thumbnailPositionClassBottom,
            'thumbnail_position_class_left' => $thumbnailPositionClassLeft,
            'thumbnail_position_class_right' => $thumbnailPositionClassRight,
            'thumbnail_ratio_class_auto' => $thumbnailRatioClassAuto,
            'thumbnail_ratio_class_1_1' => $thumbnailRatioClass11,
            'thumbnail_ratio_class_4_3' => $thumbnailRatioClass43,
            'thumbnail_ratio_class_16_9' => $thumbnailRatioClass169,
            'thumbnail_fit_class_cover' => $thumbnailFitClassCover,
            'thumbnail_fit_class_contain' => $thumbnailFitClassContain,
            'thumbnail_fit_class_fill' => $thumbnailFitClassFill,
            'thumbnail_fit_class_none' => $thumbnailFitClassNone,
            'thumbnail_fit_class_scale_down' => $thumbnailFitClassScaleDown,
            'thumbnail_size_class_sm' => $thumbnailSizeClassSm,
            'thumbnail_size_class_md' => $thumbnailSizeClassMd,
            'thumbnail_size_class_lg' => $thumbnailSizeClassLg,
            'ui_strings' => self::uiStrings(),
            'advanced_kinds' => [
                'relative_url',
                'user_profile',
                'advanced_route',
            ],
        ];
    }

    private static function loadBuilderLanguage(): void
    {
        static $loaded = false;

        if ($loaded) {
            return;
        }

        Factory::getLanguage()->load('plg_fields_smartlink', JPATH_ADMINISTRATOR);
        $loaded = true;
    }

    /**
     * @return array<string, string>
     */
    private static function uiStrings(): array
    {
        return [
            'group_simple_links' => Text::_('PLG_FIELDS_SMARTLINK_UI_GROUP_SIMPLE_LINKS'),
            'group_joomla_items' => Text::_('PLG_FIELDS_SMARTLINK_UI_GROUP_JOOMLA_ITEMS'),
            'group_media' => Text::_('PLG_FIELDS_SMARTLINK_UI_GROUP_MEDIA'),
            'group_advanced' => Text::_('PLG_FIELDS_SMARTLINK_UI_GROUP_ADVANCED'),
            'structure_inline' => Text::_('PLG_FIELDS_SMARTLINK_UI_STRUCTURE_INLINE'),
            'structure_block' => Text::_('PLG_FIELDS_SMARTLINK_UI_STRUCTURE_BLOCK'),
            'structure_figure' => Text::_('PLG_FIELDS_SMARTLINK_UI_STRUCTURE_FIGURE'),
            'view_position_before' => Text::_('PLG_FIELDS_SMARTLINK_UI_VIEW_POSITION_BEFORE'),
            'view_position_after' => Text::_('PLG_FIELDS_SMARTLINK_UI_VIEW_POSITION_AFTER'),
            'thumbnail_empty_mode_empty' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_EMPTY_EMPTY'),
            'thumbnail_empty_mode_generic' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_EMPTY_GENERIC'),
            'thumbnail_empty_mode_specific' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_EMPTY_SPECIFIC'),
            'thumbnail_ratio_auto' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_RATIO_AUTO'),
            'thumbnail_ratio_1_1' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_RATIO_1_1'),
            'thumbnail_ratio_4_3' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_RATIO_4_3'),
            'thumbnail_ratio_16_9' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_RATIO_16_9'),
            'thumbnail_position_inline' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_POSITION_INLINE'),
            'thumbnail_position_top' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_POSITION_TOP'),
            'thumbnail_position_bottom' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_POSITION_BOTTOM'),
            'thumbnail_position_left' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_POSITION_LEFT'),
            'thumbnail_position_right' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_POSITION_RIGHT'),
            'thumbnail_fit_cover' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_FIT_COVER'),
            'thumbnail_fit_contain' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_FIT_CONTAIN'),
            'thumbnail_fit_fill' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_FIT_FILL'),
            'thumbnail_fit_none' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_FIT_NONE'),
            'thumbnail_fit_scale_down' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_FIT_SCALE_DOWN'),
            'thumbnail_size_sm' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_SIZE_SMALL'),
            'thumbnail_size_md' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_SIZE_MEDIUM'),
            'thumbnail_size_lg' => Text::_('PLG_FIELDS_SMARTLINK_UI_THUMBNAIL_SIZE_LARGE'),
            'keep_defaults' => Text::_('PLG_FIELDS_SMARTLINK_UI_KEEP_DEFAULTS'),
            'kind_external_url' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_EXTERNAL_URL'),
            'kind_anchor' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_ANCHOR'),
            'kind_email' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_EMAIL'),
            'kind_phone' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_PHONE'),
            'kind_article' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_COM_CONTENT_ARTICLE'),
            'kind_category' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_COM_CONTENT_CATEGORY'),
            'kind_menu_item' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_MENU_ITEM'),
            'kind_tags' => Text::_('PLG_FIELDS_SMARTLINK_UI_KIND_TAGS'),
            'kind_contact' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_COM_CONTACT_CONTACT'),
            'kind_media_file' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_MEDIA_FILE'),
            'kind_image' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_IMAGE'),
            'kind_video' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_VIDEO'),
            'kind_gallery' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_GALLERY'),
            'kind_relative_url' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_RELATIVE_URL'),
            'kind_user_profile' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_USER_PROFILE'),
            'kind_joomla_path' => Text::_('PLG_FIELDS_SMARTLINK_UI_KIND_JOOMLA_PATH'),
            'action_no_action' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_ACTION_NO_ACTION'),
            'action_open_link' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_ACTION_LINK_OPEN'),
            'action_open_in_popup' => Text::_('PLG_FIELDS_SMARTLINK_UI_ACTION_PREVIEW_MODAL'),
            'action_toggle_view' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_ACTION_TOGGLE_VIEW'),
            'action_jump_to_anchor' => Text::_('PLG_FIELDS_SMARTLINK_UI_ACTION_JUMP_TO_ANCHOR'),
            'action_open_email_link' => Text::_('PLG_FIELDS_SMARTLINK_UI_ACTION_OPEN_EMAIL'),
            'action_open_phone_link' => Text::_('PLG_FIELDS_SMARTLINK_UI_ACTION_OPEN_PHONE'),
            'action_open_file' => Text::_('PLG_FIELDS_SMARTLINK_UI_ACTION_OPEN_FILE'),
            'action_download_file' => Text::_('PLG_FIELDS_SMARTLINK_UI_ACTION_DOWNLOAD_FILE'),
            'action_open_image' => Text::_('PLG_FIELDS_SMARTLINK_UI_ACTION_OPEN_IMAGE'),
            'action_open_video' => Text::_('PLG_FIELDS_SMARTLINK_UI_ACTION_OPEN_VIDEO'),
            'action_open_items' => Text::_('PLG_FIELDS_SMARTLINK_UI_ACTION_OPEN_ITEMS'),
            'action_open_items_in_popup' => Text::_('PLG_FIELDS_SMARTLINK_UI_ACTION_OPEN_ITEMS_POPUP'),
            'source_media_library' => Text::_('PLG_FIELDS_SMARTLINK_UI_SOURCE_MEDIA_LIBRARY'),
            'source_web_address' => Text::_('PLG_FIELDS_SMARTLINK_UI_SOURCE_WEB_ADDRESS'),
            'source_youtube_vimeo' => Text::_('PLG_FIELDS_SMARTLINK_UI_SOURCE_YOUTUBE_VIMEO'),
            'source_direct_web_address' => Text::_('PLG_FIELDS_SMARTLINK_UI_SOURCE_DIRECT_WEB_ADDRESS'),
            'page_display_only_component' => Text::_('PLG_FIELDS_SMARTLINK_UI_PAGE_DISPLAY_COMPONENT'),
            'page_display_bare_content_only' => Text::_('PLG_FIELDS_SMARTLINK_UI_PAGE_DISPLAY_CONTENT'),
            'page_display_with_site_layout' => Text::_('PLG_FIELDS_SMARTLINK_UI_PAGE_DISPLAY_PAGE'),
            'warning_use_relative_link' => Text::_('PLG_FIELDS_SMARTLINK_UI_WARNING_USE_RELATIVE'),
            'warning_use_external_link' => Text::_('PLG_FIELDS_SMARTLINK_UI_WARNING_USE_EXTERNAL'),
            'warning_unsafe_scheme' => Text::_('PLG_FIELDS_SMARTLINK_UI_WARNING_UNSAFE'),
            'warning_invalid_email' => Text::_('PLG_FIELDS_SMARTLINK_UI_WARNING_INVALID_EMAIL'),
            'warning_invalid_phone' => Text::_('PLG_FIELDS_SMARTLINK_UI_WARNING_INVALID_PHONE'),
            'warning_use_video_provider' => Text::_('PLG_FIELDS_SMARTLINK_UI_WARNING_VIDEO_PROVIDER'),
            'info_https_added' => Text::_('PLG_FIELDS_SMARTLINK_UI_INFO_HTTPS_ADDED'),
            'info_domain_removed' => Text::_('PLG_FIELDS_SMARTLINK_UI_INFO_DOMAIN_REMOVED'),
            'info_leading_slash_added' => Text::_('PLG_FIELDS_SMARTLINK_UI_INFO_LEADING_SLASH'),
            'summary_n_items_selected_one' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_ITEMS_ONE'),
            'summary_n_items_selected_other' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_ITEMS_OTHER'),
            'summary_n_tags_selected_one' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_TAGS_ONE'),
            'summary_n_tags_selected_other' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_TAGS_OTHER'),
            'summary_no_items_selected' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_NO_ITEMS'),
            'summary_no_tags_selected' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_NO_TAGS'),
            'summary_nothing_selected' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_NOTHING_SELECTED'),
            'summary_no_value' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_NO_VALUE'),
            'summary_selected_item_number' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_SELECTED_ITEM_NUMBER'),
            'summary_selected_item' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_SELECTED_ITEM'),
            'summary_selected_tags' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_SELECTED_TAGS'),
            'summary_selected_file' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_SELECTED_FILE'),
            'value_label_web_address' => Text::_('PLG_FIELDS_SMARTLINK_UI_VALUE_WEB_ADDRESS'),
            'value_label_relative_link' => Text::_('PLG_FIELDS_SMARTLINK_UI_VALUE_RELATIVE_LINK'),
            'value_label_anchor_id' => Text::_('PLG_FIELDS_SMARTLINK_UI_VALUE_ANCHOR_ID'),
            'value_label_email_address' => Text::_('PLG_FIELDS_SMARTLINK_UI_VALUE_EMAIL_ADDRESS'),
            'value_label_phone_number' => Text::_('PLG_FIELDS_SMARTLINK_UI_VALUE_PHONE_NUMBER'),
            'value_label_joomla_path' => Text::_('PLG_FIELDS_SMARTLINK_UI_KIND_JOOMLA_PATH'),
            'value_label_user_reference' => Text::_('PLG_FIELDS_SMARTLINK_UI_VALUE_USER_REFERENCE'),
            'value_label_youtube_vimeo_link' => Text::_('PLG_FIELDS_SMARTLINK_UI_VALUE_PROVIDER_LINK'),
            'value_label_path' => Text::_('PLG_FIELDS_SMARTLINK_UI_VALUE_KIND_PATH'),
            'value_label_value' => Text::_('PLG_FIELDS_SMARTLINK_UI_VALUE_GENERIC'),
            'value_placeholder_external' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_EXTERNAL'),
            'value_placeholder_relative' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_RELATIVE'),
            'value_placeholder_anchor' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_ANCHOR'),
            'value_placeholder_email' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_EMAIL'),
            'value_placeholder_phone' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_PHONE'),
            'value_placeholder_joomla_path' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_JOOMLA_PATH'),
            'value_placeholder_user_reference' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_USER_REFERENCE'),
            'value_placeholder_youtube' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_PROVIDER'),
            'value_placeholder_file' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_FILE'),
            'value_placeholder_value' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_VALUE'),
            'hint_anchor_suggestions' => Text::_('PLG_FIELDS_SMARTLINK_UI_HINT_ANCHORS'),
            'hint_download_filename' => Text::_('PLG_FIELDS_SMARTLINK_UI_HINT_DOWNLOAD'),
            'section_source' => Text::_('PLG_FIELDS_SMARTLINK_UI_SECTION_SOURCE'),
            'section_behavior' => Text::_('PLG_FIELDS_SMARTLINK_UI_SECTION_BEHAVIOR'),
            'section_content' => Text::_('PLG_FIELDS_SMARTLINK_UI_SECTION_CONTENT'),
            'section_advanced' => Text::_('PLG_FIELDS_SMARTLINK_UI_SECTION_ADVANCED'),
            'section_preview' => Text::_('PLG_FIELDS_SMARTLINK_UI_SECTION_PREVIEW'),
            'field_where_items_from' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_WHERE_ITEMS_FROM'),
            'field_where_kind_from' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_WHERE_KIND_FROM'),
            'field_when_clicked' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_WHEN_CLICKED'),
            'field_download_filename_optional' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_DOWNLOAD_FILENAME'),
            'field_text_to_display' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_TEXT_TO_DISPLAY'),
            'field_image_to_show' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_IMAGE_TO_SHOW'),
            'field_alternative_text' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_ALTERNATIVE_TEXT'),
            'field_override_defaults' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_OVERRIDE_DEFAULTS'),
            'field_position' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_POSITION'),
            'field_ratio' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_RATIO'),
            'field_fit' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_FIT'),
            'field_size' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_SIZE'),
            'field_empty_class' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_EMPTY_CLASS'),
            'field_structure' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_STRUCTURE'),
            'field_popup_image_override' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_POPUP_IMAGE'),
            'field_icon_class' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_ICON_CLASS'),
            'field_css_class' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_CSS_CLASS'),
            'field_title' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_TITLE'),
            'field_open_in' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_OPEN_IN'),
            'field_rel' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_REL'),
            'field_page_display' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_PAGE_DISPLAY'),
            'field_view_on_page_position' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_VIEW_POSITION'),
            'field_poster_image' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_POSTER_IMAGE'),
            'field_columns' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_COLUMNS'),
            'field_gap' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_GAP'),
            'field_how_items_fit' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_GALLERY_FIT'),
            'field_item_title' => Text::_('PLG_FIELDS_SMARTLINK_UI_FIELD_ITEM_TITLE'),
            'subsection_thumbnail_overrides' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUBSECTION_THUMBNAIL'),
            'placeholder_optional_override' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_OPTIONAL_OVERRIDE'),
            'placeholder_optional_popup_image' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_OPTIONAL_POPUP_IMAGE'),
            'placeholder_optional' => Text::_('PLG_FIELDS_SMARTLINK_UI_PLACEHOLDER_OPTIONAL'),
            'toggle_thumbnail' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOGGLE_THUMBNAIL'),
            'toggle_icon' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOGGLE_ICON'),
            'toggle_text' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOGGLE_TEXT'),
            'toggle_view_on_page' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOGGLE_VIEW'),
            'toggle_show_summary' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOGGLE_SUMMARY'),
            'toggle_show_type_label' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOGGLE_TYPE_LABEL'),
            'toggle_use_figure_caption' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOGGLE_FIGURE_CAPTION'),
            'toggle_linked_parts' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOGGLE_LINKED_PARTS'),
            'tooltip_popup_preview_forced' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOOLTIP_POPUP_FORCED'),
            'tooltip_view_required' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOOLTIP_VIEW_REQUIRED'),
            'tooltip_linked_parts' => Text::_('PLG_FIELDS_SMARTLINK_UI_TOOLTIP_LINKED_PARTS'),
            'warning_enable_content_part' => Text::_('PLG_FIELDS_SMARTLINK_UI_WARNING_ENABLE_CONTENT'),
            'preview_placeholder_link_text' => Text::_('PLG_FIELDS_SMARTLINK_UI_PREVIEW_LINK_TEXT'),
            'preview_placeholder_anchor_point' => Text::_('PLG_FIELDS_SMARTLINK_UI_PREVIEW_ANCHOR'),
            'preview_placeholder_email_address' => Text::_('PLG_FIELDS_SMARTLINK_UI_PREVIEW_EMAIL'),
            'preview_placeholder_phone_number' => Text::_('PLG_FIELDS_SMARTLINK_UI_PREVIEW_PHONE'),
            'preview_placeholder_joomla_path' => Text::_('PLG_FIELDS_SMARTLINK_UI_KIND_JOOMLA_PATH'),
            'preview_placeholder_file_name' => Text::_('PLG_FIELDS_SMARTLINK_UI_PREVIEW_FILE'),
            'preview_placeholder_image_title' => Text::_('PLG_FIELDS_SMARTLINK_UI_PREVIEW_IMAGE'),
            'preview_placeholder_video_title' => Text::_('PLG_FIELDS_SMARTLINK_UI_PREVIEW_VIDEO'),
            'preview_placeholder_gallery' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_GALLERY'),
            'preview_placeholder_tags' => Text::_('PLG_FIELDS_SMARTLINK_UI_KIND_TAGS'),
            'preview_placeholder_summary' => Text::_('PLG_FIELDS_SMARTLINK_UI_PREVIEW_SUMMARY'),
            'preview_placeholder_no_content' => Text::_('PLG_FIELDS_SMARTLINK_UI_PREVIEW_EMPTY'),
            'tab_general' => Text::_('PLG_FIELDS_SMARTLINK_UI_TAB_GENERAL'),
            'tab_advanced' => Text::_('PLG_FIELDS_SMARTLINK_UI_TAB_ADVANCED'),
            'dialog_preview_action_title' => Text::_('PLG_FIELDS_SMARTLINK_UI_DIALOG_PREVIEW_ACTION'),
            'dialog_loading_url' => Text::_('PLG_FIELDS_SMARTLINK_UI_DIALOG_LOADING_URL'),
            'dialog_preview_default_title' => Text::_('PLG_FIELDS_SMARTLINK_UI_SECTION_PREVIEW'),
            'dialog_builder_title' => Text::_('PLG_FIELDS_SMARTLINK_UI_DIALOG_BUILDER_TITLE'),
            'dialog_close' => Text::_('JCLOSE'),
            'dialog_clear' => Text::_('JCLEAR'),
            'dialog_cancel' => Text::_('JCANCEL'),
            'dialog_insert' => Text::_('PLG_FIELDS_SMARTLINK_UI_DIALOG_INSERT'),
            'dialog_prompt_json' => Text::_('PLG_FIELDS_SMARTLINK_UI_DIALOG_PROMPT_JSON'),
            'rail_switch_section' => Text::_('PLG_FIELDS_SMARTLINK_UI_RAIL_SWITCH'),
            'aria_sections' => Text::_('PLG_FIELDS_SMARTLINK_UI_ARIA_SECTIONS'),
            'preview_frame_title' => Text::_('PLG_FIELDS_SMARTLINK_UI_PREVIEW_FRAME_TITLE'),
            'picker_dialog_title_default' => Text::_('PLG_FIELDS_SMARTLINK_UI_PICKER_TITLE'),
            'picker_selected_items' => Text::_('PLG_FIELDS_SMARTLINK_UI_PICKER_SELECTED_ITEMS'),
            'picker_add_selected' => Text::_('PLG_FIELDS_SMARTLINK_UI_PICKER_ADD_SELECTED'),
            'picker_close' => Text::_('JCLOSE'),
            'picker_paste_selected_value' => Text::_('PLG_FIELDS_SMARTLINK_UI_PICKER_PASTE_VALUE'),
            'picker_one_item_per_line' => Text::_('PLG_FIELDS_SMARTLINK_UI_PICKER_ONE_PER_LINE'),
            'picker_cancel' => Text::_('JCANCEL'),
            'picker_apply' => Text::_('JAPPLY'),
            'picker_no_items_selected' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_NO_ITEMS'),
            'picker_no_tags_selected' => Text::_('PLG_FIELDS_SMARTLINK_UI_SUMMARY_NO_TAGS'),
            'picker_remove' => Text::_('PLG_FIELDS_SMARTLINK_UI_PICKER_REMOVE'),
            'gallery_fallback_video' => Text::_('PLG_FIELDS_SMARTLINK_OPTION_KIND_VIDEO'),
            'gallery_add_item' => Text::_('PLG_FIELDS_SMARTLINK_UI_GALLERY_ADD_ITEM'),
            'gallery_add_from_media_library' => Text::_('PLG_FIELDS_SMARTLINK_UI_GALLERY_ADD_FROM_LIBRARY'),
            'gallery_remove' => Text::_('JREMOVE'),
            'gallery_fit_fill_space' => Text::_('PLG_FIELDS_SMARTLINK_UI_GALLERY_FIT_COVER'),
            'gallery_fit_show_whole' => Text::_('PLG_FIELDS_SMARTLINK_UI_GALLERY_FIT_CONTAIN'),
            'gallery_fit_stretch' => Text::_('PLG_FIELDS_SMARTLINK_UI_GALLERY_FIT_STRETCH'),
            'gallery_fit_stretch_width' => Text::_('PLG_FIELDS_SMARTLINK_UI_GALLERY_FIT_WIDTH'),
            'gallery_fit_stretch_height' => Text::_('PLG_FIELDS_SMARTLINK_UI_GALLERY_FIT_HEIGHT'),
            'generic_item' => Text::_('PLG_FIELDS_SMARTLINK_UI_GENERIC_ITEM'),
            'video_show_controls' => Text::_('PLG_FIELDS_SMARTLINK_UI_VIDEO_CONTROLS'),
            'video_autoplay' => Text::_('PLG_FIELDS_SMARTLINK_UI_VIDEO_AUTOPLAY'),
            'video_repeat' => Text::_('PLG_FIELDS_SMARTLINK_UI_VIDEO_REPEAT'),
            'video_start_muted' => Text::_('PLG_FIELDS_SMARTLINK_UI_VIDEO_MUTED'),
        ];
    }
}
