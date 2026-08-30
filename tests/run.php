<?php

require __DIR__ . '/bootstrap.php';

use SuperSoft\Plugin\Fields\Smartlink\Contract\ContractFactory;
use SuperSoft\Plugin\Fields\Smartlink\Contract\MediaCapabilityResolver;
use SuperSoft\Plugin\Fields\Smartlink\Contract\TextResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Renderer;
use SuperSoft\Plugin\Fields\Smartlink\Helper\ResolverInterface;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Schema;
use SuperSoft\Plugin\Fields\Smartlink\Helper\TargetRegistry;
use SuperSoft\Plugin\Fields\Smartlink\Preview\PreviewAdapterInterface;
use SuperSoft\Plugin\Fields\Smartlink\Preview\PreviewAdapterRegistry;

$tests = [];

function test(string $name, callable $callback): void
{
    global $tests;
    $tests[] = [$name, $callback];
}

function assertSameValue($expected, $actual, string $message = ''): void
{
    if ($expected !== $actual) {
        throw new RuntimeException(($message !== '' ? $message . ': ' : '') . 'expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
    }
}

function assertTrueValue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function basePayload(array $changes = []): array
{
    return array_replace_recursive(
        [
            'kind' => 'external_url',
            'value' => 'https://example.com/file.pdf',
            'action' => 'link_open',
            'show_image' => false,
            'show_icon' => false,
            'show_text' => true,
            'display_inside' => false,
        ],
        $changes
    );
}

test('v2 stored schema round-trips through the flat builder model', static function (): void {
    $config = Schema::fieldConfigFromParams([]);
    $flat = Schema::sanitizePayload(basePayload(['label' => 'Read this']), $config);
    $json = Schema::encode($flat);
    $stored = json_decode($json, true);
    $roundTrip = Schema::sanitizePayload($json, $config);

    assertSameValue(2, $stored['version']);
    assertSameValue('external_url', $stored['target']['kind']);
    assertSameValue('Read this', $stored['overrides']['text']['label']);
    assertSameValue($flat['label'], $roundTrip['label']);
});

test('custom profiles persist the four content controls independently', static function (): void {
    $config = Schema::fieldConfigFromParams([
        'authoring_profile' => 'custom',
        'author_feature_show_thumbnail' => 0,
        'author_feature_show_icon' => 1,
        'author_feature_show_text' => 0,
        'author_feature_view_on_page' => 1,
    ]);
    $flat = Schema::sanitizePayload(basePayload([
        'show_image' => true,
        'show_icon' => true,
        'show_text' => true,
        'display_inside' => true,
    ]), $config);
    $stored = Schema::applyAuthoringProfile($flat, $config);

    assertTrueValue(!array_key_exists('show_image', $stored), 'Hidden thumbnail toggle must not be stored.');
    assertSameValue(true, $stored['show_icon']);
    assertTrueValue(!array_key_exists('show_text', $stored), 'Hidden text toggle must not be stored.');
    assertSameValue(true, $stored['display_inside']);
});

test('none profile stores destination facts only and effective defaults remain available', static function (): void {
    $config = Schema::fieldConfigFromParams(['authoring_profile' => 'none']);
    $flat = Schema::sanitizePayload(basePayload(['label' => 'Ignored author text']), $config);
    $stored = Schema::toStoredPayload(Schema::applyAuthoringProfile($flat, $config));

    assertTrueValue(!array_key_exists('overrides', $stored), 'None must not retain presentation overrides.');
    assertSameValue('external_url', $stored['target']['kind']);
    assertSameValue(true, Schema::sanitizePayload($stored, $config)['show_text']);
});

test('at least one content or embedded-view part remains mandatory', static function (): void {
    $failed = false;

    try {
        Schema::sanitizePayload(basePayload([
            'show_image' => false,
            'show_icon' => false,
            'show_text' => false,
            'display_inside' => false,
        ]), Schema::fieldConfigFromParams([]));
    } catch (InvalidArgumentException $error) {
        $failed = true;
    }

    assertTrueValue($failed, 'An entirely invisible SmartLink must be rejected.');
});

test('text resolution has one documented precedence chain', static function (): void {
    $resolver = new TextResolver();
    $resolved = ['display_name' => 'Resolved title', 'display_name_source' => 'content_title', 'title' => 'Resolved title', 'type_label' => 'Article'];

    assertSameValue('Author text', $resolver->resolve(basePayload(['label' => 'Author text']), $resolved, ['default_text' => 'Default'])['visible_text']);
    assertSameValue('Read Resolved title', $resolver->resolve(basePayload(), $resolved, ['default_text' => 'Read {resolved_title}'])['visible_text']);
    assertSameValue('Resolved title', $resolver->resolve(basePayload(), $resolved, [])['visible_text']);
});

test('gallery canonical state has modes and no rows or item actions', static function (): void {
    $config = Schema::fieldConfigFromParams(['default_kind' => 'gallery', 'allowed_kinds' => ['gallery']]);
    $payload = Schema::sanitizePayload([
        'kind' => 'gallery',
        'value' => [
            ['type' => 'image', 'src' => 'images/one.jpg', 'label' => 'One', 'link_behavior' => 'open'],
            ['type' => 'video', 'src' => 'video/two.mp4', 'label' => 'Two', 'source_type' => 'provider'],
        ],
        'action' => 'no_action',
        'show_image' => false,
        'show_icon' => false,
        'show_text' => false,
        'display_inside' => true,
        'gallery' => ['mode' => 'viewer_with_strip', 'columns' => 4, 'rows' => 9, 'link_behavior' => 'open'],
    ], $config);

    assertSameValue('viewer_with_strip', $payload['gallery']['mode']);
    assertTrueValue(!array_key_exists('rows', $payload['gallery']), 'Rows must not exist in the canonical gallery schema.');
    assertTrueValue(!array_key_exists('link_behavior', $payload['gallery']), 'Gallery presentation must not contain item actions.');
    assertSameValue('provider', $payload['value'][1]['source_type']);
});

test('contract levels have distinct responsibilities', static function (): void {
    $registry = new TargetRegistry();
    $registry->register(new class implements ResolverInterface {
        public function getKind(): string
        {
            return 'external_url';
        }

        public function resolve(array $payload): array
        {
            return ['href' => 'https://resolved.example/page', 'title' => 'Resolved page', 'summary' => 'Summary'];
        }
    });
    $config = Schema::fieldConfigFromParams(['default_text' => 'Open {resolved_title}']);
    $payload = Schema::sanitizePayload(basePayload(), $config);
    $contract = (new ContractFactory($registry))->create($payload, $config);

    assertSameValue(['version', 'payload', 'resolved', 'presentation'], array_keys($contract));
    assertSameValue('https://resolved.example/page', $contract['resolved']['href']);
    assertSameValue('Open Resolved page', $contract['presentation']['visible_text']);
    assertTrueValue(!array_key_exists('action', $contract['resolved']), 'Resolved facts must not contain presentation behavior.');
    assertTrueValue(!array_key_exists('href', $contract['presentation']), 'Presentation state must not duplicate resolved targets.');
});

test('resolved contract exposes normalized direct-file capabilities', static function (): void {
    $registry = new TargetRegistry();
    $registry->register(new class implements ResolverInterface {
        public function getKind(): string
        {
            return 'external_url';
        }

        public function resolve(array $payload): array
        {
            return ['href' => 'https://cdn.example.com/guides/guide.PDF?revision=4'];
        }
    });
    $contract = (new ContractFactory($registry))->create(
        Schema::sanitizePayload(basePayload(['value' => 'https://cdn.example.com/guides/guide.PDF?revision=4']), Schema::fieldConfigFromParams([])),
        Schema::fieldConfigFromParams([])
    );

    assertSameValue('application/pdf', $contract['resolved']['mime_type']);
    assertSameValue('pdf', $contract['resolved']['extension']);
    assertSameValue(true, $contract['resolved']['is_file']);
    assertSameValue(true, $contract['resolved']['downloadable']);
    assertTrueValue(!array_key_exists('is_pdf', $contract['resolved']), 'Format-specific capability flags must not be added.');
});

test('resolver-provided capability facts take precedence over extension fallback', static function (): void {
    $capabilities = (new MediaCapabilityResolver())->resolve('media_file', 'files/archive.bin', [
        'mime_type' => 'application/vnd.example.package; charset=binary',
        'extension' => '.pkg',
        'is_file' => true,
        'downloadable' => false,
    ]);

    assertSameValue('application/vnd.example.package', $capabilities['mime_type']);
    assertSameValue('pkg', $capabilities['extension']);
    assertSameValue(true, $capabilities['is_file']);
    assertSameValue(false, $capabilities['downloadable']);
});

test('effective thumbnail state resolves inherit to concrete system defaults', static function (): void {
    $registry = new TargetRegistry();
    $registry->register(new class implements ResolverInterface {
        public function getKind(): string
        {
            return 'external_url';
        }

        public function resolve(array $payload): array
        {
            return ['href' => 'https://example.com/page', 'title' => 'Example'];
        }
    });
    $config = Schema::fieldConfigFromParams([
        'thumbnail_position' => 'inherit',
        'thumbnail_ratio' => 'inherit',
        'thumbnail_fit' => 'inherit',
        'thumbnail_size' => 'inherit',
    ]);
    $contract = (new ContractFactory($registry))->create(Schema::sanitizePayload(basePayload(), $config), $config);

    assertSameValue('inline', $contract['presentation']['thumbnail']['position']);
    assertSameValue('auto', $contract['presentation']['thumbnail']['ratio']);
    assertSameValue('cover', $contract['presentation']['thumbnail']['fit']);
    assertSameValue('md', $contract['presentation']['thumbnail']['size']);
});

test('generic renderer omits baseline thumbnail modifier classes', static function (): void {
    $contract = [
        'version' => 2,
        'payload' => ['version' => 2, 'target' => ['kind' => 'image', 'value' => '/images/example.jpg']],
        'resolved' => [
            'kind' => 'image',
            'href' => '/images/example.jpg',
            'display_name' => 'Example',
            'summary' => '',
            'image' => '/images/example.jpg',
            'image_alt' => 'Example',
            'items' => [],
            'attributes' => [],
        ],
        'presentation' => [
            'action' => 'link_open', 'visible_text' => 'Example', 'image' => '/images/example.jpg', 'image_alt' => 'Example',
            'show_image' => true, 'show_icon' => false, 'show_text' => false, 'display_inside' => false,
            'structure' => 'inline', 'view_position' => 'after', 'thumbnail' => [
                'empty_mode' => 'generic', 'empty_class' => 'smartlink-image-empty', 'position' => 'inline',
                'ratio' => 'auto', 'fit' => 'cover', 'size' => 'md',
            ],
            'linked_parts' => [], 'gallery' => [],
        ],
    ];
    $html = (new Renderer())->render($contract);

    assertTrueValue(str_contains($html, 'class="smartlink-thumb"'), 'The base thumbnail class must remain.');
    assertTrueValue(!str_contains($html, 'smartlink-thumb--'), 'Baseline thumbnail modifiers must be omitted.');
});

test('gallery items expose structured provider media facts', static function (): void {
    $registry = new TargetRegistry();
    $registry->register(new class implements ResolverInterface {
        public function getKind(): string
        {
            return 'gallery';
        }

        public function resolve(array $payload): array
        {
            return [
                'href' => 'https://youtu.be/example',
                'items' => [[
                    'type' => 'video',
                    'src' => 'https://youtu.be/example',
                    'label' => 'Example video',
                    'poster' => '',
                    'source_type' => 'provider',
                ], [
                    'type' => 'image',
                    'src' => 'https://cdn.example.com/example.webp',
                    'label' => 'Example image',
                    'source_type' => 'external',
                ]],
            ];
        }
    });
    $config = Schema::fieldConfigFromParams(['allowed_kinds' => ['gallery'], 'default_kind' => 'gallery']);
    $payload = Schema::sanitizePayload([
        'kind' => 'gallery',
        'value' => [
            ['type' => 'video', 'src' => 'https://youtu.be/example', 'source_type' => 'provider'],
            ['type' => 'image', 'src' => 'https://cdn.example.com/example.webp', 'source_type' => 'external'],
        ],
        'action' => 'no_action',
        'show_image' => false,
        'show_icon' => false,
        'show_text' => false,
        'display_inside' => true,
    ], $config);
    $contract = (new ContractFactory($registry))->create($payload, $config);

    assertSameValue('provider_video', $contract['resolved']['items'][0]['media']['type']);
    assertSameValue('https://www.youtube.com/embed/example', $contract['resolved']['items'][0]['media']['embed_url']);
    assertSameValue('', $contract['resolved']['items'][0]['mime_type']);
    assertSameValue('', $contract['resolved']['items'][0]['extension']);
    assertSameValue(false, $contract['resolved']['items'][0]['is_file']);
    assertSameValue(false, $contract['resolved']['items'][0]['downloadable']);
    assertSameValue('image/webp', $contract['resolved']['items'][1]['mime_type']);
    assertSameValue('webp', $contract['resolved']['items'][1]['extension']);
    assertSameValue(true, $contract['resolved']['items'][1]['is_file']);
    assertSameValue(true, $contract['resolved']['items'][1]['downloadable']);
    assertSameValue('', $contract['resolved']['mime_type']);
    assertSameValue('', $contract['resolved']['extension']);
    assertSameValue(false, $contract['resolved']['is_file']);
    assertSameValue(false, $contract['resolved']['downloadable']);
});

test('gallery renderer does not create nested SmartLink actions', static function (): void {
    $contract = [
        'version' => 2,
        'payload' => ['version' => 2, 'target' => ['kind' => 'gallery', 'value' => []]],
        'resolved' => [
            'kind' => 'gallery',
            'href' => '/images/one.jpg',
            'display_name' => 'Gallery',
            'summary' => '',
            'image' => '',
            'image_alt' => '',
            'items' => [
                ['type' => 'image', 'src' => '/images/one.jpg', 'display_name' => 'One', 'poster' => ''],
                ['type' => 'image', 'src' => '/images/two.jpg', 'display_name' => 'Two', 'poster' => ''],
            ],
            'attributes' => [],
        ],
        'presentation' => [
            'action' => 'no_action', 'visible_text' => 'Gallery', 'show_image' => false, 'show_icon' => false,
            'show_text' => false, 'display_inside' => true, 'structure' => 'block', 'view_position' => 'after',
            'thumbnail' => [], 'linked_parts' => [], 'gallery' => ['mode' => 'grid', 'columns' => 2, 'gap' => 8, 'fit' => 'cover'],
        ],
    ];
    $html = (new Renderer())->render($contract);

    assertTrueValue(str_contains($html, 'smartlink-gallery'), 'Gallery markup must be rendered.');
    assertTrueValue(!str_contains($html, '<a '), 'Gallery items must not become nested links.');
});

test('preview registry uses priority and null as pass-through', static function (): void {
    $registry = new PreviewAdapterRegistry();
    $registry->register(new class implements PreviewAdapterInterface {
        public function render(array $contract, array $context = []): ?string
        {
            return 'fallback';
        }
    }, -10);
    $registry->register(new class implements PreviewAdapterInterface {
        public function render(array $contract, array $context = []): ?string
        {
            return null;
        }
    }, 100);

    assertSameValue('fallback', $registry->render([]));
});

$failures = 0;

foreach ($tests as [$name, $callback]) {
    try {
        $callback();
        echo "PASS: {$name}\n";
    } catch (Throwable $error) {
        $failures++;
        echo "FAIL: {$name}\n  {$error->getMessage()}\n";
    }
}

echo sprintf("\n%d tests, %d failures.\n", count($tests), $failures);
exit($failures === 0 ? 0 : 1);
