<?php

use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/journey_file/{entity}', 'MultimediaTreeController@getEntityFile');
    Route::get('/coordinates/{entity}/children', 'MultimediaTreeController@getChildCoordinates');
    
    Route::put('/journey_file/{entity}', 'MultimediaTreeController@setEntityFile');
    Route::put('/coordinates/{entity}', 'MultimediaTreeController@setChildCoordinates');
});