<?php

namespace App\Plugins\MultimediaTree\App;

class MultimediaTree
{
    /*
     Implement your backend logic here
    */

    public function __construct()
    {
        info('Template Plugin loaded');
    }

    public static function sayHello()
    {
        return 'Hello from MultimediaTree Plugin!';
    }

    public static function sayBye()
    {
        return 'Goodbye from MultimediaTree Plugin!';
    }
}
