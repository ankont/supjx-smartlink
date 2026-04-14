<?php
/**
 * @package     SmartLink
 * @subpackage  plg_fields_smartlink
 */

namespace SuperSoft\Plugin\Fields\Smartlink\Helper;

\defined('_JEXEC') or die;

use InvalidArgumentException;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\AdvancedRouteResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\AnchorResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\ArticleResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\CategoryResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\ContactResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\EmailResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\ExternalUrlResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\GalleryResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\ImageResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\MediaFileResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\MenuResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\PhoneResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\RelativeUrlResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\TagResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\UserProfileResolver;
use SuperSoft\Plugin\Fields\Smartlink\Helper\Resolvers\VideoResolver;

final class TargetRegistry
{
    /**
     * @var array<string, ResolverInterface>
     */
    private array $resolvers = [];

    public function register(ResolverInterface $resolver): self
    {
        $this->resolvers[$resolver->getKind()] = $resolver;

        return $this;
    }

    public function has(string $kind): bool
    {
        return isset($this->resolvers[$kind]);
    }

    public function get(string $kind): ResolverInterface
    {
        if (!$this->has($kind)) {
            throw new InvalidArgumentException(sprintf('Unsupported SmartLink kind "%s".', $kind));
        }

        return $this->resolvers[$kind];
    }

    /**
     * @return array<int, string>
     */
    public function allKinds(): array
    {
        return array_keys($this->resolvers);
    }

    public static function createDefault(): self
    {
        $registry = new self();

        foreach (
            [
                new ExternalUrlResolver(),
                new AnchorResolver(),
                new EmailResolver(),
                new PhoneResolver(),
                new ArticleResolver(),
                new CategoryResolver(),
                new MenuResolver(),
                new TagResolver(),
                new RelativeUrlResolver(),
                new ContactResolver(),
                new UserProfileResolver(),
                new AdvancedRouteResolver(),
                new MediaFileResolver(),
                new ImageResolver(),
                new VideoResolver(),
                new GalleryResolver(),
            ] as $resolver
        ) {
            $registry->register($resolver);
        }

        return $registry;
    }
}

