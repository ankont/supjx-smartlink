<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers;

\defined('_JEXEC') or die;

final class VideoResolver extends AbstractResolver
{
    public function getKind(): string
    {
        return 'video';
    }

    public function resolve(array $payload): array
    {
        $src = $this->asMediaUrl((string) ($payload['value'] ?? ''));
        $videoOptions = (array) ($payload['video'] ?? []);
        $embed = $this->buildEmbed($src, $videoOptions, (string) ($payload['label'] ?? ''));

        return $this->buildResult($payload, $src, ['embed' => $embed, 'label' => $payload['label'] ?: basename($src)]);
    }

    /**
     * @param   array<string, mixed>  $videoOptions
     */
    private function buildEmbed(string $src, array $videoOptions, string $label): string
    {
        $host = strtolower((string) parse_url($src, PHP_URL_HOST));
        $providerEmbed = $this->resolveProviderEmbed($src, $host, $videoOptions);

        if ($providerEmbed !== '') {
            return $providerEmbed;
        }

        $attributes = [];

        if (!empty($videoOptions['controls'])) {
            $attributes[] = 'controls';
        }

        if (!empty($videoOptions['autoplay'])) {
            $attributes[] = 'autoplay';
        }

        if (!empty($videoOptions['loop'])) {
            $attributes[] = 'loop';
        }

        if (!empty($videoOptions['muted'])) {
            $attributes[] = 'muted';
        }

        if (!empty($videoOptions['poster'])) {
            $attributes[] = 'poster="' . $this->escape($this->asMediaUrl((string) $videoOptions['poster'])) . '"';
        }

        return sprintf(
            '<video class="smartlink-video" %s><source src="%s"><a href="%s">%s</a></video>',
            implode(' ', $attributes),
            $this->escape($src),
            $this->escape($src),
            $this->escape($label !== '' ? $label : $src)
        );
    }

    /**
     * @param   array<string, mixed>  $videoOptions
     */
    private function resolveProviderEmbed(string $src, string $host, array $videoOptions): string
    {
        if ($host === '') {
            return '';
        }

        $providerQuery = $this->providerQuery($videoOptions);

        if ($host === 'youtu.be' || str_ends_with($host, '.youtu.be')) {
            $videoId = trim((string) pathinfo((string) parse_url($src, PHP_URL_PATH), PATHINFO_BASENAME));

            if ($videoId !== '') {
                return $this->iframeEmbed('https://www.youtube.com/embed/' . rawurlencode($videoId) . $providerQuery['youtube']);
            }
        }

        if ($host === 'youtube.com' || str_ends_with($host, '.youtube.com')) {
            parse_str((string) parse_url($src, PHP_URL_QUERY), $query);

            if (!empty($query['v'])) {
                return $this->iframeEmbed('https://www.youtube.com/embed/' . rawurlencode((string) $query['v']) . $providerQuery['youtube']);
            }
        }

        if ($host === 'vimeo.com' || str_ends_with($host, '.vimeo.com')) {
            $videoId = trim((string) pathinfo((string) parse_url($src, PHP_URL_PATH), PATHINFO_BASENAME));

            if ($videoId !== '') {
                return $this->iframeEmbed('https://player.vimeo.com/video/' . rawurlencode($videoId) . $providerQuery['vimeo']);
            }
        }

        return '';
    }

    /**
     * @param   array<string, mixed>  $videoOptions
     *
     * @return  array<string, string>
     */
    private function providerQuery(array $videoOptions): array
    {
        $youtube = [
            'controls' => !empty($videoOptions['controls']) ? '1' : '0',
            'autoplay' => !empty($videoOptions['autoplay']) ? '1' : '0',
            'loop' => !empty($videoOptions['loop']) ? '1' : '0',
            'mute' => !empty($videoOptions['muted']) ? '1' : '0',
        ];
        $vimeo = [
            'autoplay' => !empty($videoOptions['autoplay']) ? '1' : '0',
            'loop' => !empty($videoOptions['loop']) ? '1' : '0',
            'muted' => !empty($videoOptions['muted']) ? '1' : '0',
        ];

        return [
            'youtube' => '?' . http_build_query($youtube),
            'vimeo' => '?' . http_build_query($vimeo),
        ];
    }

    private function iframeEmbed(string $src): string
    {
        return sprintf(
            '<div class="smartlink-video-embed"><iframe src="%s" loading="lazy" allowfullscreen></iframe></div>',
            $this->escape($src)
        );
    }
}
