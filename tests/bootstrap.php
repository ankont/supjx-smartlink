<?php

namespace {
    define('_JEXEC', 1);
}

namespace Joomla\Registry {
    class Registry
    {
    }
}

namespace Joomla\CMS\Uri {
    class Uri
    {
        public function __construct(private string $uri = '')
        {
        }

        public static function root(bool $pathOnly = false): string
        {
            return $pathOnly ? '' : '/';
        }

        public function setVar(string $name, string $value): void
        {
        }

        public function getVar(string $name): ?string
        {
            return null;
        }

        public function delVar(string $name): void
        {
        }

        public function toString(?array $parts = null): string
        {
            return $this->uri;
        }
    }
}

namespace Joomla\CMS\Language {
    class Text
    {
        public static function _(string $key): string
        {
            return $key;
        }
    }
}

namespace {
    spl_autoload_register(static function (string $class): void {
        $prefix = 'SuperSoft\\Plugin\\Fields\\Smartlink\\';

        if (!str_starts_with($class, $prefix)) {
            return;
        }

        $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
        $path = dirname(__DIR__) . '/package/plugins/fields/smartlink/src/' . $relative . '.php';

        if (is_file($path)) {
            require $path;
        }
    });
}
