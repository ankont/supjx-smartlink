<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper;

\defined('_JEXEC') or die;

interface ResolverInterface
{
    public function getKind(): string;

    /**
     * Resolve a typed target into a render-ready payload.
     *
     * @param   array  $payload  Normalised SmartLink payload
     *
     * @return  array<string, mixed>
     */
    public function resolve(array $payload): array;
}

