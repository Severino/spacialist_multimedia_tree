
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateMultimediaTreeCoordinatesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('plugin_multimedia_tree_coordinates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('multimedia_tree_id');
            $table->double('x');
            $table->double('y');
            $table->double('z');
            $table->timestamps();

            $table->foreign('multimedia_tree_id')->references('id')->on('multimedia_trees')->onDelete('cascade');
        });
    
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('plugin_multimedia_tree_coordinates');
    }
}