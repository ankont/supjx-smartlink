<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

defined('_JEXEC') or die;

$title = htmlspecialchars((string) ($displayData['title'] ?? ''), ENT_COMPAT, 'UTF-8');
$attributes = (string) ($displayData['attributes'] ?? '');
$tag = preg_replace('/[^a-z0-9:-]/i', '', (string) ($displayData['tag'] ?? 'a')) ?: 'a';
?>
<<?php echo $tag; ?> <?php echo $attributes; ?>><?php echo $title; ?></<?php echo $tag; ?>>
