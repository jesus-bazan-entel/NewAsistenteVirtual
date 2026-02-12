<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Session;

class RegistroClaveController extends Controller
{
    public function getRegistro()
    {
        $response = Http::get(env('API_URL') . 'registro-clave')->throw()->json();
        return $response;
    }

    public function postRegistro(Request $request)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $clave = strip_tags($request->input('clave'));
            $comentario = strip_tags($request->input('comentario'));

            $response = Http::post(env('API_URL') . 'registro-clave', [
                'nombre' => $nombre,
                'clave' => $clave,
                'comentario' => $comentario,
                'canales' => $request->input('canales')
            ])->throw()->json();

            return redirect()->route('registro_clave')->with('success', 'Registro creado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al crear el registro: ' . $e->getMessage()]);
        }
    }

    public function putRegistro(Request $request, $id)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $clave = strip_tags($request->input('clave'));
            $comentario = strip_tags($request->input('comentario'));

            $response = Http::put(env('API_URL') . 'registro-clave/' . $id, [
                'nombre' => $nombre,
                'clave' => $clave,
                'comentario' => $comentario,
                'canales' => $request->input('canales')
            ])->throw()->json();

            return redirect()->route('registro_clave')->with('success', 'Registro actualizado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al actualizar el registro: ' . $e->getMessage()]);
        }
    }

    public function deleteRegistroId($id)
    {
        try {
            $response = Http::delete(env('API_URL') . 'registro-clave/' . $id)->throw()->json();
            return redirect()->route('registro_clave')->with('success', 'Registro eliminado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al eliminar el registro: ' . $e->getMessage()]);
        }
    }

    public function getRegistroId($id)
    {
        $response = Http::get(env('API_URL') . 'registro-clave/' . $id)->throw()->json();
        return $response;
    }
}
