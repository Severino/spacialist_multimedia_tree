<?php
namespace App\Plugins\MultimediaTree\Models;

use Illuminate\Database\Eloquent\Model;

class Coordinates extends Model {
    protected $fillable = [
        'parent_id',
        'entity_id',
        'x',
        'y',
        'z',
    ];

    public function getChildCoordinates($entityId = null) {
        return self::where('parent_id', $entityId)->get();
    }
}