<?php

namespace App\Plugins\MultimediaTree\Migrations;

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateJourneyFileSelect extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function migrate()
    {
        Schema::create('plugin_multimedia_tree_journey_files', function (Blueprint $table) {
            $table->id();
            // This could be assessed from the entity_id, but it is easier to query if we have it here as well.
            // (With the downsode that we need to maintain it when the entity changes)
            $table->unsignedBigInteger('file_id');
            $table->unsignedBigInteger('entity_id')->unique();
            $table->timestamps();

            $table->foreign('file_id')->references('id')->on('files')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('entity_id')->references('id')->on('entities')->onDelete('cascade')->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function rollback()
    {
        // Insert your rollback code here
        Schema::dropIfExists('plugin_multimedia_tree_journey_files');
    }
}