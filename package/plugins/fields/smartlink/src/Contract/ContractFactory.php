<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Contract;

\defined('_JEXEC') or die;

use SuperSoft\Plugin\Fields\Smartlink\Helper\Schema;
use SuperSoft\Plugin\Fields\Smartlink\Helper\TargetRegistry;

final class ContractFactory
{
    public function __construct(
        private readonly TargetRegistry $registry,
        private readonly ResolvedTargetNormalizer $targetNormalizer = new ResolvedTargetNormalizer(),
        private readonly PresentationResolver $presentationResolver = new PresentationResolver()
    ) {
    }

    /**
     * @param   array<string, mixed>  $payload  Sanitized flat payload
     * @param   array<string, mixed>  $config
     *
     * @return  array<string, mixed>
     */
    public function create(array $payload, array $config = []): array
    {
        $kind = (string) ($payload['kind'] ?? '');
        $rawResolved = $this->registry->get($kind)->resolve($payload);
        $resolved = $this->targetNormalizer->normalise($payload, $rawResolved);
        $presentation = $this->presentationResolver->resolve($payload, $resolved, $config);
        $storedIntent = Schema::applyAuthoringProfile($payload, $config);

        return [
            'version' => 2,
            'payload' => Schema::toStoredPayload($storedIntent),
            'resolved' => $resolved,
            'presentation' => $presentation,
        ];
    }
}
