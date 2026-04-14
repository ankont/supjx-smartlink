<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

defined('_JEXEC') or die;

$title = htmlspecialchars((string) ($displayData['title'] ?? ''), ENT_COMPAT, 'UTF-8');
$excerpt = htmlspecialchars((string) ($displayData['excerpt'] ?? ''), ENT_COMPAT, 'UTF-8');
$image = htmlspecialchars((string) ($displayData['image'] ?? ''), ENT_COMPAT, 'UTF-8');
$imageAlt = htmlspecialchars((string) ($displayData['image_alt'] ?? ''), ENT_COMPAT, 'UTF-8');
$attributes = (string) ($displayData['attributes'] ?? '');
$tag = preg_replace('/[^a-z0-9:-]/i', '', (string) ($displayData['tag'] ?? 'a')) ?: 'a';
?>
<<?php echo $tag; ?> <?php echo $attributes; ?>>
  <span class="smartlink-content-card__media smartlink-content-card__media--stacked">
    <?php if ($image !== '') : ?>
      <img src="<?php echo $image; ?>" alt="<?php echo $imageAlt; ?>" loading="lazy">
    <?php else : ?>
      <span class="smartlink-content-card__placeholder">Category</span>
    <?php endif; ?>
  </span>
  <span class="smartlink-content-card__body">
    <span class="smartlink-content-card__title"><?php echo $title; ?></span>
    <?php if ($excerpt !== '') : ?>
      <span class="smartlink-content-card__excerpt"><?php echo $excerpt; ?></span>
    <?php endif; ?>
  </span>
</<?php echo $tag; ?>>
