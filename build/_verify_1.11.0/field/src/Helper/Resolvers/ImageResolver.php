<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class ImageResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'image';
    }

    public function resolve(array $payload): array
    {
        $src = $this->asMediaUrl((string) ($payload['value'] ?? ''));
        $alt = (string) ($payload['preview_alt'] ?: $payload['label'] ?: '');
        $embed = sprintf(
            '<figure class="smartlink-image"><img src="%s" alt="%s" loading="lazy"></figure>',
            $this->escape($src),
            $this->escape($alt)
        );

        return $this->buildResult($payload, $src, ['embed' => $embed, 'label' => $payload['label'] ?: basename($src)]);
    }
}

