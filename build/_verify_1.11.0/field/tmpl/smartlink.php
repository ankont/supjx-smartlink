<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

defined('_JEXEC') or die;

if (empty($field->value)) {
    return;
}

echo $field->value;
