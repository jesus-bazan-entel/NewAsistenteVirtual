<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Session;

class ConfigAvanzadaController extends Controller
{
    // Tecnologías CRUD
    public function getTecnologias()
    {
        $response = Http::get(env('API_URL') . 'tecnologias')->throw()->json();
        return $response;
    }

    public function postTecnologias(Request $request)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $response = Http::post(env('API_URL') . 'tecnologias', [
                'nombre' => $nombre
            ])->throw()->json();

            return redirect()->route('tecnologias')->with('success', 'Tecnología creada correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al crear la tecnología: ' . $e->getMessage()]);
        }
    }

    public function putTecnologias(Request $request, $id)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $response = Http::put(env('API_URL') . 'tecnologias/' . $id, [
                'nombre' => $nombre
            ])->throw()->json();

            return redirect()->route('tecnologias')->with('success', 'Tecnología actualizada correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al actualizar la tecnología: ' . $e->getMessage()]);
        }
    }

    public function deleteTecnologiasId($id)
    {
        try {
            $response = Http::delete(env('API_URL') . 'tecnologias/' . $id);

            if ($response->failed()) {
                $errorData = $response->json();
                $errorMessage = $errorData['error'] ?? 'No se pudo eliminar la tecnología';
                return back()->withErrors(['message' => $errorMessage]);
            }

            return redirect()->route('tecnologias')->with('success', 'Tecnología eliminada correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error de conexión al servidor']);
        }
    }

    public function getTecnologiasId($id)
    {
        $response = Http::get(env('API_URL') . 'tecnologias/' . $id)->throw()->json();
        return $response;
    }

    // Operadores CRUD
    public function getOperadores()
    {
        $response = Http::get(env('API_URL') . 'operadores-telefonicos')->throw()->json();
        return $response;
    }

    public function postOperadores(Request $request)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $response = Http::post(env('API_URL') . 'operadores-telefonicos', [
                'codigo' => $request->input('codigo'),
                'nombre' => $nombre,
                'tecnologias' => $request->input('tecnologias'),
            ]);

            if ($response->failed()) {
                $errorData = $response->json();
                $errorMessage = $errorData['error'] ?? 'No se pudo crear el operador';
                return back()->withErrors(['message' => $errorMessage]);
            }

            return redirect()->route('operadores')->with('success', 'Operador creado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error de conexión al servidor']);
        }
    }

    public function putOperadores(Request $request, $id)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $response = Http::put(env('API_URL') . 'operadores-telefonicos/' . $id, [
                'codigo' => $request->input('codigo'),
                'nombre' => $nombre,
                'tecnologias' => $request->input('tecnologias'),
            ])->throw()->json();

            return redirect()->route('operadores')->with('success', 'Operador actualizado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al actualizar el operador: ' . $e->getMessage()]);
        }
    }

    public function deleteOperadoresId($id)
    {
        try {
            $response = Http::delete(env('API_URL') . 'operadores-telefonicos/' . $id);

            if ($response->failed()) {
                $errorData = $response->json();
                $errorMessage = $errorData['error'] ?? 'No se pudo eliminar el operador';
                return back()->withErrors(['message' => $errorMessage]);
            }

            return redirect()->route('operadores')->with('success', 'Operador eliminado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error de conexión al servidor']);
        }
    }

    public function getOperadoresId($id)
    {
        $response = Http::get(env('API_URL') . 'operadores-telefonicos/' . $id)->throw()->json();
        return $response;
    }

    // Números Externos CRUD
    public function getNumerosExternos()
    {
        $response = Http::get(env('API_URL') . 'numeros-externos')->throw()->json();
        return $response;
    }

    public function postNumerosExternos(Request $request)
    {
        try {
            $numero = strip_tags($request->input('numero'));
            $nombre = strip_tags($request->input('nombre'));
            $comentario = strip_tags($request->input('comentario'));

            $response = Http::post(env('API_URL') . 'numeros-externos', [
                'numero' => $numero,
                'nombre' => $nombre,
                'comentario' => $comentario,
            ])->throw()->json();

            return redirect()->route('numeros_externos')->with('success', 'Número externo creado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al crear el número externo: ' . $e->getMessage()]);
        }
    }

    public function putNumerosExternos(Request $request, $id)
    {
        try {
            $numero = strip_tags($request->input('numero'));
            $nombre = strip_tags($request->input('nombre'));
            $comentario = strip_tags($request->input('comentario'));

            $response = Http::put(env('API_URL') . 'numeros-externos/' . $id, [
                'numero' => $numero,
                'nombre' => $nombre,
                'comentario' => $comentario,
            ])->throw()->json();

            return redirect()->route('numeros_externos')->with('success', 'Número externo actualizado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al actualizar el número externo: ' . $e->getMessage()]);
        }
    }

    public function deleteNumerosExternosId($id)
    {
        try {
            $response = Http::delete(env('API_URL') . 'numeros-externos/' . $id);

            if ($response->failed()) {
                $errorData = $response->json();
                $errorMessage = $errorData['error'] ?? 'No se pudo eliminar el número externo';
                return back()->withErrors(['message' => $errorMessage]);
            }

            return redirect()->route('numeros_externos')->with('success', 'Número externo eliminado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error de conexión al servidor']);
        }
    }

    public function getNumerosExternosId($id)
    {
        $response = Http::get(env('API_URL') . 'numeros-externos/' . $id)->throw()->json();
        return $response;
    }

    // Equipos CRUD
    public function getEquipos()
    {
        $response = Http::get(env('API_URL') . 'equipos')->throw()->json();
        return $response;
    }

    public function postEquipos(Request $request)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $ip = strip_tags($request->input('ip'));

            $response = Http::post(env('API_URL') . 'equipos', [
                'nombre' => $nombre,
                'ip' => $ip,
                'tipo' => $request->input('tipo'),
                'ranuras' => $request->input('ranuras'),
                'id_sede' => $request->input('id_sede'),
                'canales' => $request->input('canales'),
            ])->throw()->json();

            return redirect()->route('equipos')->with('success', 'Equipo creado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al crear el equipo: ' . $e->getMessage()]);
        }
    }

    public function putEquipos(Request $request, $id)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $ip = strip_tags($request->input('ip'));

            $response = Http::put(env('API_URL') . 'equipos/' . $id, [
                'nombre' => $nombre,
                'ip' => $ip,
                'tipo' => $request->input('tipo'),
                'ranuras' => $request->input('ranuras'),
                'id_sede' => $request->input('id_sede'),
                'canales' => $request->input('canales'),
            ])->throw()->json();

            return redirect()->route('equipos')->with('success', 'Equipo actualizado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al actualizar el equipo: ' . $e->getMessage()]);
        }
    }

    public function deleteEquiposId($id)
    {
        try {
            $response = Http::delete(env('API_URL') . 'equipos/' . $id);

            if ($response->failed()) {
                $errorData = $response->json();
                $errorMessage = $errorData['error'] ?? 'No se pudo eliminar el equipo';
                return back()->withErrors(['message' => $errorMessage]);
            }

            return redirect()->route('equipos')->with('success', 'Equipo eliminado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error de conexión al servidor']);
        }
    }

    public function getEquiposId($id)
    {
        $response = Http::get(env('API_URL') . 'equipos/' . $id)->throw()->json();
        return $response;
    }

    // Sedes
    public function getSedes()
    {
        $response = Http::get(env('API_URL') . 'sedes')->throw()->json();
        return $response;
    }
}
