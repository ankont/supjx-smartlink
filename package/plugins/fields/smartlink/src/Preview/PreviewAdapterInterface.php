<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Preview;

\defined('_JEXEC') or die;

interface PreviewAdapterInterface
{
    /**
     * Return null when this adapter does not handle the current context.
     *
     * @param   array<string, mixed>  $contract
     * @param   array<string, mixed>  $context
     */
    public function render(array $contract, array $context = []): ?string;
}
