<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Preview;

\defined('_JEXEC') or die;

final class PreviewAdapterRegistry
{
    /** @var array<int, array{priority: int, adapter: PreviewAdapterInterface}> */
    private array $adapters = [];

    public function register(PreviewAdapterInterface $adapter, int $priority = 0): self
    {
        $this->adapters[] = ['priority' => $priority, 'adapter' => $adapter];
        usort($this->adapters, static fn(array $left, array $right): int => $right['priority'] <=> $left['priority']);

        return $this;
    }

    /**
     * @param   array<string, mixed>  $contract
     * @param   array<string, mixed>  $context
     */
    public function render(array $contract, array $context = []): string
    {
        foreach ($this->adapters as $entry) {
            $html = $entry['adapter']->render($contract, $context);

            if ($html !== null) {
                return $html;
            }
        }

        return '';
    }
}
