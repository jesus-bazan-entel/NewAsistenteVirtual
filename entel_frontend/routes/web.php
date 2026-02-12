<?php

use App\Http\Controllers\ConfigAvanzadaController;
use App\Http\Controllers\ConfigGeneralController;
use App\Http\Controllers\GeneradorPruebasController;
use App\Http\Controllers\RegistroClaveController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::get('/', function () {
    return Inertia::render('Auth/Login');
})->name('login');

Route::post('/validar-usuario', [UsuarioController::class, 'validarUsuario'])->name('validar-usuario');
Route::get('/cerrar-sesion', [UsuarioController::class, 'cerrarSesion'])->name('cerrar-sesion');

// Protected Routes
Route::middleware(['varificarSesion'])->group(function () {

    // Dashboard
    Route::get('/principal', function () {
        return Inertia::render('Dashboard');
    })->name('principal');

    // Configuración General
    Route::prefix('configuracion-general')->group(function () {
        // View Routes
        Route::get('/usuarios', function () {
            $response = Http::get(env('API_URL') . 'usuarios');
            $perfiles = Http::get(env('API_URL') . 'perfiles');
            $sedes = Http::get(env('API_URL') . 'sedes');
            return Inertia::render('ConfigGeneral/Usuarios', [
                'usuarios' => $response->json()['usuarios'] ?? [],
                'perfiles' => $perfiles->json()['perfiles'] ?? [],
                'sedes' => $sedes->json()['sedes'] ?? [],
            ]);
        })->name('usuarios');

        Route::get('/perfiles', function () {
            $response = Http::get(env('API_URL') . 'perfiles');
            return Inertia::render('ConfigGeneral/Perfiles', [
                'perfiles' => $response->json()['perfiles'] ?? [],
            ]);
        })->name('perfiles');

        // API Routes (kept for CRUD operations)
        Route::get('/api_usuarios', [ConfigGeneralController::class, 'getUsuarios'])->name('api_usuarios');
        Route::post('/usuarios', [ConfigGeneralController::class, 'postUsuarios']);
        Route::put('/usuarios/{id}', [ConfigGeneralController::class, 'putUsuarios']);
        Route::delete('/usuarios/{id}', [ConfigGeneralController::class, 'deleteUsuariosId']);

        Route::get('/api_perfiles', [ConfigGeneralController::class, 'getPerfiles'])->name('api_perfiles');
        Route::post('/perfiles', [ConfigGeneralController::class, 'postPerfiles']);
        Route::put('/perfiles/{id}', [ConfigGeneralController::class, 'putPerfiles']);
        Route::delete('/perfiles/{id}', [ConfigGeneralController::class, 'deletePerfilesId']);

        Route::get('/api_modulos', [ConfigGeneralController::class, 'getModulos'])->name('api_modulos');
        Route::get('/api_sedes', [ConfigGeneralController::class, 'getSedes'])->name('api_sedes');
    });

    // Configuración Avanzada
    Route::prefix('configuracion-avanzada')->group(function () {
        Route::get('/tecnologias', function () {
            $response = Http::get(env('API_URL') . 'tecnologias');
            return Inertia::render('ConfigAvanzada/Tecnologias', [
                'tecnologias' => $response->json()['tecnologias'] ?? [],
            ]);
        })->name('tecnologias');

        Route::get('/operadores-telefonicos', function () {
            $response = Http::get(env('API_URL') . 'operadores-telefonicos');
            return Inertia::render('ConfigAvanzada/Operadores', [
                'operadores' => $response->json()['operadores'] ?? [],
            ]);
        })->name('operadores');

        Route::get('/equipos', function () {
            $response = Http::get(env('API_URL') . 'equipos');
            return Inertia::render('ConfigAvanzada/Equipos', [
                'equipos' => $response->json()['equipos'] ?? [],
            ]);
        })->name('equipos');

        Route::get('/numeros-externos', function () {
            $response = Http::get(env('API_URL') . 'numeros-externos');
            return Inertia::render('ConfigAvanzada/NumerosExternos', [
                'numeros' => $response->json()['numerosExternos'] ?? [],
            ]);
        })->name('numeros_externos');

        // API Routes
        Route::get('/api_tecnologias', [ConfigAvanzadaController::class, 'getTecnologias'])->name('api_tecnologias');
        Route::post('/tecnologias', [ConfigAvanzadaController::class, 'postTecnologias']);
        Route::put('/tecnologias/{id}', [ConfigAvanzadaController::class, 'putTecnologias']);
        Route::delete('/tecnologias/{id}', [ConfigAvanzadaController::class, 'deleteTecnologiasId']);

        Route::get('/api_operadores', [ConfigAvanzadaController::class, 'getOperadores'])->name('api_operadores');
        Route::post('/operadores-telefonicos', [ConfigAvanzadaController::class, 'postOperadores']);
        Route::put('/operadores-telefonicos/{id}', [ConfigAvanzadaController::class, 'putOperadores']);
        Route::delete('/operadores-telefonicos/{id}', [ConfigAvanzadaController::class, 'deleteOperadoresId']);

        Route::get('/api_equipos', [ConfigAvanzadaController::class, 'getEquipos'])->name('api_equipos');
        Route::post('/equipos', [ConfigAvanzadaController::class, 'postEquipos']);
        Route::put('/equipos/{id}', [ConfigAvanzadaController::class, 'putEquipos']);
        Route::delete('/equipos/{id}', [ConfigAvanzadaController::class, 'deleteEquiposId']);

        Route::get('/api_numeros_externos', [ConfigAvanzadaController::class, 'getNumerosExternos'])->name('api_numeros_externos');
        Route::post('/numeros-externos', [ConfigAvanzadaController::class, 'postNumerosExternos']);
        Route::put('/numeros-externos/{id}', [ConfigAvanzadaController::class, 'putNumerosExternos']);
        Route::delete('/numeros-externos/{id}', [ConfigAvanzadaController::class, 'deleteNumerosExternosId']);
    });

    // Generador de Pruebas
    Route::prefix('generador-pruebas')->group(function () {
        Route::get('/matrices', function () {
            $response = Http::get(env('API_URL') . 'matrices');
            $canales = Http::get(env('API_URL') . 'canales');
            $numerosExternos = Http::get(env('API_URL') . 'numeros-externos');
            return Inertia::render('GeneradorPruebas/Matrices', [
                'matrices' => $response->json()['matrices'] ?? [],
                'canales' => $canales->json()['canales'] ?? [],
                'numerosExternos' => $numerosExternos->json()['numerosExternos'] ?? [],
            ]);
        })->name('matrices');

        Route::get('/matrices/{id}', function ($id) {
            $matriz = Http::get(env('API_URL') . 'matrices/' . $id);
            $canales = Http::get(env('API_URL') . 'canales');
            $numerosExternos = Http::get(env('API_URL') . 'numeros-externos');
            return Inertia::render('GeneradorPruebas/MatrizDetalle', [
                'matriz' => $matriz->json()['matriz'] ?? null,
                'canales' => $canales->json()['canales'] ?? [],
                'numerosExternos' => $numerosExternos->json()['numerosExternos'] ?? [],
            ]);
        })->name('matriz_detalle');

        Route::get('/lanzador-pruebas', function () {
            $response = Http::get(env('API_URL') . 'pruebas');
            $matrices = Http::get(env('API_URL') . 'matrices');
            return Inertia::render('GeneradorPruebas/LanzadorPruebas', [
                'pruebas' => $response->json()['pruebas'] ?? [],
                'matrices' => $matrices->json()['matrices'] ?? [],
            ]);
        })->name('pruebas');

        // API Routes
        Route::get('/api_matrices', [GeneradorPruebasController::class, 'getMatrices'])->name('api_matrices');
        Route::post('/matrices', [GeneradorPruebasController::class, 'postMatrices']);
        Route::put('/matrices/{id}', [GeneradorPruebasController::class, 'putMatrices']);
        Route::delete('/matrices/{id}', [GeneradorPruebasController::class, 'deleteMatricesId']);

        Route::get('/api_lanzador_pruebas', [GeneradorPruebasController::class, 'getLanzador'])->name('api_lanzador_pruebas');
        Route::post('/lanzador-pruebas', [GeneradorPruebasController::class, 'postLanzador']);
        Route::post('/lanzador-pruebas/{id}/ejecutar', [GeneradorPruebasController::class, 'ejecutarPrueba']);

        Route::get('/api_ejecuciones/{id?}', [GeneradorPruebasController::class, 'getEjecucionesId'])->name('api_ejecuciones');
        Route::get('/api_pdf/{id?}', [GeneradorPruebasController::class, 'getPDF'])->name('api_pdf');
        Route::get('/api_canales', [GeneradorPruebasController::class, 'getCanales'])->name('api_canales');
    });

    // Reportes
    Route::prefix('reportes')->group(function () {
        Route::get('/reporte-pruebas', function () {
            $response = Http::get(env('API_URL') . 'ejecuciones');
            return Inertia::render('Reportes/ReportePruebas', [
                'ejecuciones' => $response->json()['ejecuciones'] ?? [],
            ]);
        })->name('reporte_prueba');

        Route::get('/reporte-disa', function () {
            $response = Http::get(env('API_URL') . 'registro-clave');
            return Inertia::render('Reportes/ReporteDisa', [
                'registros' => $response->json()['registros'] ?? [],
            ]);
        })->name('reporte_disa');
    });

    // DISA
    Route::prefix('disa')->group(function () {
        Route::get('/registro-clave', function () {
            $response = Http::get(env('API_URL') . 'registro-clave');
            return Inertia::render('Disa/RegistroClave', [
                'registros' => $response->json()['registros'] ?? [],
            ]);
        })->name('registro_clave');

        Route::get('/api_registro', [RegistroClaveController::class, 'getRegistro'])->name('api_registro');
        Route::post('/registro-clave', [RegistroClaveController::class, 'postRegistro']);
        Route::delete('/registro-clave/{id}', [RegistroClaveController::class, 'deleteRegistroId']);
    });
});
