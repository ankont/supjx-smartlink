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
            'icon_stylesheet_url' => (string) ($this->element['icon_stylesheet_url'] ?? ''),
            'html_output_mode' => (string) ($this->element['html_output_mode'] ?? ''),
            'asset_version' => '1.11.0',
            'use_smartlink_styles' => (string) ($this->element['use_smartlink_styles'] ?? ''),
            'link_button_class' => (string) ($this->element['link_button_class'] ?? ''),
            'thumbnail_empty_mode' => (string) ($this->element['thumbnail_empty_mode'] ?? ''),
            'thumbnail_empty_class' => (string) ($this->element['thumbnail_empty_class'] ?? ''),
            'thumbnail_position' => (string) ($this->element['thumbnail_position'] ?? ''),
            'thumbnail_ratio' => (string) ($this->element['thumbnail_ratio'] ?? ''),
            'thumbnail_fit' => (string) ($this->element['thumbnail_fit'] ?? ''),
            'thumbnail_size' => (string) ($this->element['thumbnail_size'] ?? ''),
            'thumbnail_position_class_inline' => (string) ($this->element['thumbnail_position_class_inline'] ?? ''),
            'thumbnail_position_class_top' => (string) ($this->element['thumbnail_position_class_top'] ?? ''),
            'thumbnail_position_class_bottom' => (string) ($this->element['thumbnail_position_class_bottom'] ?? ''),
            'thumbnail_position_class_left' => (string) ($this->element['thumbnail_position_class_left'] ?? ''),
            'thumbnail_position_class_right' => (string) ($this->element['thumbnail_position_class_right'] ?? ''),
            'thumbnail_ratio_class_auto' => (string) ($this->element['thumbnail_ratio_class_auto'] ?? ''),
            'thumbnail_ratio_class_1_1' => (string) ($this->element['thumbnail_ratio_class_1_1'] ?? ''),
            'thumbnail_ratio_class_4_3' => (string) ($this->element['thumbnail_ratio_class_4_3'] ?? ''),
            'thumbnail_ratio_class_16_9' => (string) ($this->element['thumbnail_ratio_class_16_9'] ?? ''),
            'thumbnail_fit_class_cover' => (string) ($this->element['thumbnail_fit_class_cover'] ?? ''),
            'thumbnail_fit_class_contain' => (string) ($this->element['thumbnail_fit_class_contain'] ?? ''),
            'thumbnail_fit_class_fill' => (string) ($this->element['thumbnail_fit_class_fill'] ?? ''),
            'thumbnail_fit_class_none' => (string) ($this->element['thumbnail_fit_class_none'] ?? ''),
            'thumbnail_fit_class_scale_down' => (string) ($this->element['thumbnail_fit_class_scale_down'] ?? ''),
            'thumbnail_size_class_sm' => (string) ($this->element['thumbnail_size_class_sm'] ?? ''),
            'thumbnail_size_class_md' => (string) ($this->element['thumbnail_size_class_md'] ?? ''),
            'thumbnail_size_class_lg' => (string) ($this->element['thumbnail_size_class_lg'] ?? ''),
            'template_name' => (string) ($this->element['template_name'] ?? ''),
            'ui_strings' => $this->getUiStrings(),
        ];

        return Schema::fieldConfigFromParams($attributes);
    }

    /**
     * @return array<string, string>
     */
    private function getUiStrings(): array
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
