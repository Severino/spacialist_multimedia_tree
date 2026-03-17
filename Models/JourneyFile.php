<?php
namespace App\Plugins\MultimediaTree\Models;

use App\Models\Entity;
use App\Plugins\File\App\Models\File;
use Illuminate\Database\Eloquent\Model;

class JourneyFile extends Model
{
    protected $table = 'plugin_multimedia_tree_journey_files';

    // References entity_id and file_id
    protected $fillable = [
        'entity_id', 
        'file_id', 
        'locked'
    ];

    public function file()
    {
        return $this->belongsTo(File::class, 'file_id');
    }

    public function entity()
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }

    public static function getByEntityId($entityId)
    {
        $journeyFile = self::where('entity_id', $entityId)->first();

        if (! $journeyFile) {
            return null;
        }

        if ($journeyFile->file) {
            $journeyFile->file->setFileInfo();
        }

        return $journeyFile;
    }

    public static function unset($entityId)
    {
        self::where('entity_id', $entityId)->delete();
    }

    public static function set($entityId, $fileId)
    {
        // First, delete any existing entry for this entity
        static::unset($entityId);

        // Then, create a new entry
        return self::create([
            'entity_id' => $entityId,
            'file_id'   => $fileId,
        ]);
    }

public static function setLocked($entityId, $locked)
{
    return static::where('entity_id', $entityId)
        ->update(['locked' => $locked]);
}
}
