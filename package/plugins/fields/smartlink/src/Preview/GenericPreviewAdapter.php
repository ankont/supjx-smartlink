<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Preview;

\defined('_JEXEC') or die;

use SuperSoft\Plugin\Fields\Smartlink\Helper\Renderer;

final class GenericPreviewAdapter implements PreviewAdapterInterface
{
    public function __construct(private readonly Renderer $renderer = new Renderer())
    {
    }

    public function render(array $contract, array $context = []): ?string
    {
        return $this->renderer->render($contract, $context);
    }
}
