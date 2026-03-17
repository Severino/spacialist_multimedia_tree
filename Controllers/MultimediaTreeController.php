<?php
namespace App\Plugins\MultimediaTree\Controllers;

use App\Http\Controllers\Controller;
use App\Plugins\MultimediaTree\Models\Coordinates;
use App\Plugins\MultimediaTree\Models\JourneyFile;
use Illuminate\Http\Request;

class MultimediaTreeController extends Controller
{
    public function setLocked(Request $request, $entityId)
    {
        $validated = $request->validate([
            'locked' => 'required|boolean',
        ]);

        JourneyFile::setLocked($entityId, $validated['locked']);
        return response()->json(['locked' => $validated['locked']]);
    }

    public function getEntityFile($entityId)
    {
        $journeyFile = JourneyFile::getByEntityId($entityId);

        if (! $journeyFile) {
            return response()->json(null);
        }

        return response()->json($journeyFile);
    }

    public function unsetEntityFile(Request $request, $entityId)
    {
        JourneyFile::unset($entityId);
        return response()->json(null);
    }

    public function setEntityFile(Request $request, $entityId)
    {
        $validated = $request->validate([
            'file_id' => 'required|exists:files,id',
        ]);

        JourneyFile::set($entityId, $validated['file_id']);
        return $this->getEntityFile($entityId);
    }

    public function getChildCoordinates($entityId)
    {
        return response()->json(Coordinates::getChildCoordinates($entityId));
    }

    public function setChildCoordinates(Request $request, $entityId)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:entities,id',
            'x'         => 'required|numeric',
            'y'         => 'required|numeric',
            'z'         => 'required|numeric',
        ]);

        $validated['entity_id'] = $entityId;

        // Create or update coordinates for the given entity
        $coordinates = Coordinates::updateOrCreate(
            ['entity_id' => $entityId],
            $validated
        );

        return response()->json($coordinates);
    }
}
