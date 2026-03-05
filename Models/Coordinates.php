<?php
namespace App\Plugins\MultimediaTree\Models;

use Illuminate\Database\Eloquent\Model;

class Coordinates extends Model {

    protected $table = 'plugin_multimedia_tree_coordinates';

    protected $fillable = [
        'parent_id',
        'entity_id',
        'x',
        'y',
        'z',
    ];

    public static function getChildCoordinates($entityId = null) {
        return self::where('parent_id', $entityId)->get();
    }
}