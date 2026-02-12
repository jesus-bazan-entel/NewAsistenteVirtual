<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Session;

class GeneradorPruebasController extends Controller
{
    public function getCanales()
    {
        $response = Http::get(env('API_URL') . 'canales')->throw()->json();
        return $response;
    }

    public function getPDF($id)
    {
        $response = Http::get(env('API_URL') . 'ejecuciones/test_pdf/' . $id)->throw()->json();
        return $response;
    }

    public function getEjecucionesId($id)
    {
        $response = Http::get(env('API_URL') . 'ejecuciones/' . $id)->throw()->json();
        return $response;
    }

    // Matrices CRUD
    public function getMatrices()
    {
        $response = Http::get(env('API_URL') . 'matrices')->throw()->json();
        return $response;
    }

    public function postMatrices(Request $request)
    {
        try {
            $response = Http::post(env('API_URL') . 'matrices', [
                'matriz_data' => $request->input('matriz_data', []),
                'nombre' => $request->input('nombre')
            ])->throw()->json();

            return redirect()->route('matrices')->with('success', 'Matriz creada correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al crear la matriz: ' . $e->getMessage()]);
        }
    }

    public function putMatrices(Request $request, $id)
    {
        try {
            $response = Http::put(env('API_URL') . 'matrices/' . $id, [
                'matriz_data' => $request->input('matriz_data', []),
                'nombre' => $request->input('nombre')
            ])->throw()->json();

            return redirect()->route('matrices')->with('success', 'Matriz actualizada correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al actualizar la matriz: ' . $e->getMessage()]);
        }
    }

    public function deleteMatricesId($id)
    {
        try {
            $response = Http::delete(env('API_URL') . 'matrices/' . $id)->throw()->json();
            return redirect()->route('matrices')->with('success', 'Matriz eliminada correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al eliminar la matriz: ' . $e->getMessage()]);
        }
    }

    public function getMatricesId($id)
    {
        $response = Http::get(env('API_URL') . 'matrices/' . $id)->throw()->json();
        return $response;
    }

    // Lanzador de Pruebas CRUD
    public function getLanzador()
    {
        $response = Http::get(env('API_URL') . 'pruebas')->throw()->json();
        return $response;
    }

    public function postLanzador(Request $request)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $correo = filter_var($request->input('correo'), FILTER_SANITIZE_EMAIL);
            $tiempo_timbrado = filter_var($request->input('tiempo_timbrado'), FILTER_SANITIZE_NUMBER_INT);
            $reintentos = filter_var($request->input('reintentos'), FILTER_SANITIZE_NUMBER_INT);
            $comentario = strip_tags($request->input('comentario'));

            $response = Http::post(env('API_URL') . 'pruebas', [
                'id_matriz' => $request->input('id_matriz'),
                'nombre' => $nombre,
                'correo' => $correo,
                'tiempo_timbrado' => $tiempo_timbrado,
                'reintentos' => $reintentos,
                'tipo_lanzamiento' => $request->input('tipo_lanzamiento'),
                'programacion' => $request->input('programacion'),
                'dias_lanzamiento' => $request->input('dias_lanzamiento'),
                'fecha_lanzamiento' => $request->input('fecha_lanzamiento'),
                'hora_lanzamiento' => $request->input('hora_lanzamiento'),
                'id_usuario' => $request->input('id_usuario'),
                'comentario' => $comentario,
            ])->throw()->json();

            return redirect()->route('pruebas')->with('success', 'Prueba creada correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al crear la prueba: ' . $e->getMessage()]);
        }
    }

    public function putLanzador(Request $request, $id)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $correo = filter_var($request->input('correo'), FILTER_SANITIZE_EMAIL);
            $tiempo_timbrado = filter_var($request->input('tiempo_timbrado'), FILTER_SANITIZE_NUMBER_INT);
            $reintentos = filter_var($request->input('reintentos'), FILTER_SANITIZE_NUMBER_INT);
            $comentario = strip_tags($request->input('comentario'));

            if ($request->input('putAll') === 'yes') {
                $response = Http::put(env('API_URL') . 'pruebas/' . $id, [
                    'id_matriz' => $request->input('id_matriz'),
                    'nombre' => $nombre,
                    'correo' => $correo,
                    'tiempo_timbrado' => $tiempo_timbrado,
                    'reintentos' => $reintentos,
                    'tipo_lanzamiento' => $request->input('tipo_lanzamiento'),
                    'programacion' => $request->input('programacion'),
                    'dias_lanzamiento' => $request->input('dias_lanzamiento'),
                    'fecha_lanzamiento' => $request->input('fecha_lanzamiento'),
                    'hora_lanzamiento' => $request->input('hora_lanzamiento'),
                    'id_usuario' => $request->input('id_usuario'),
                    'comentario' => $comentario,
                ])->throw()->json();
            } else {
                $response = Http::put(env('API_URL') . 'pruebas/' . $id, [
                    'activo' => $request->input('activo'),
                ])->throw()->json();
            }

            return redirect()->route('pruebas')->with('success', 'Prueba actualizada correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al actualizar la prueba: ' . $e->getMessage()]);
        }
    }

    public function deleteLanzadorId($id)
    {
        try {
            $response = Http::delete(env('API_URL') . 'pruebas/' . $id)->throw()->json();
            return redirect()->route('pruebas')->with('success', 'Prueba eliminada correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al eliminar la prueba: ' . $e->getMessage()]);
        }
    }

    public function getLanzadorId($id)
    {
        $response = Http::get(env('API_URL') . 'pruebas/' . $id)->throw()->json();
        return $response;
    }

    public function ejecutarPrueba($id)
    {
        try {
            $response = Http::post(env('API_URL') . 'pruebas/' . $id . '/ejecutar')->throw()->json();
            return redirect()->route('pruebas')->with('success', 'Prueba ejecutada correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al ejecutar la prueba: ' . $e->getMessage()]);
        }
    }
}
