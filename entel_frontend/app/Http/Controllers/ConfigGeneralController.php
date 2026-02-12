<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Session;

class ConfigGeneralController extends Controller
{
    // Usuarios CRUD
    public function getUsuarios()
    {
        $response = Http::get(env('API_URL') . 'usuarios')->throw()->json();
        return $response;
    }

    public function postUsuarios(Request $request)
    {
        try {
            $nombres = strip_tags($request->input('nombres'));
            $correo = filter_var($request->input('correo'), FILTER_SANITIZE_EMAIL);
            $apellidos = strip_tags($request->input('apellidos'));
            $clave = strip_tags($request->input('clave'));
            $clave_confirmacion = strip_tags($request->input('clave_confirmacion'));

            $response = Http::post(env('API_URL') . 'usuarios', [
                'id_usuario' => $request->input('id_usuario'),
                'correo' => $correo,
                'nombres' => $nombres,
                'apellidos' => $apellidos,
                'id_perfil' => $request->input('id_perfil'),
                'clave' => $clave,
                'clave_confirmacion' => $clave_confirmacion
            ])->throw()->json();

            return redirect()->route('usuarios')->with('success', 'Usuario creado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al crear el usuario: ' . $e->getMessage()]);
        }
    }

    public function putUsuarios(Request $request, $id)
    {
        try {
            $nombres = strip_tags($request->input('nombres'));
            $correo = filter_var($request->input('correo'), FILTER_SANITIZE_EMAIL);
            $apellidos = strip_tags($request->input('apellidos'));
            $clave = strip_tags($request->input('clave'));
            $clave_confirmacion = strip_tags($request->input('clave_confirmacion'));

            if ($request->input('putAll') === 'yes') {
                $response = Http::put(env('API_URL') . 'usuarios/' . $id, [
                    'id_usuario' => $request->input('id_usuario'),
                    'correo' => $correo,
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                    'id_perfil' => $request->input('id_perfil'),
                    'clave' => $clave,
                    'clave_confirmacion' => $clave_confirmacion
                ])->throw()->json();
            } else {
                $response = Http::put(env('API_URL') . 'usuarios/' . $id, [
                    'activo' => $request->input('activo'),
                ])->throw()->json();
            }

            return redirect()->route('usuarios')->with('success', 'Usuario actualizado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al actualizar el usuario: ' . $e->getMessage()]);
        }
    }

    public function deleteUsuariosId($id)
    {
        try {
            $response = Http::delete(env('API_URL') . 'usuarios/' . $id)->throw()->json();
            return redirect()->route('usuarios')->with('success', 'Usuario eliminado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al eliminar el usuario: ' . $e->getMessage()]);
        }
    }

    public function getUsuariosId($id)
    {
        $response = Http::get(env('API_URL') . 'usuarios/' . $id)->throw()->json();
        return $response;
    }

    // Perfiles CRUD
    public function getPerfiles()
    {
        $response = Http::get(env('API_URL') . 'perfiles')->throw()->json();
        return $response;
    }

    public function postPerfiles(Request $request)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $descripcion = strip_tags($request->input('descripcion'));

            $response = Http::post(env('API_URL') . 'perfiles', [
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'submodulos' => $request->input('submodulos'),
            ])->throw()->json();

            return redirect()->route('perfiles')->with('success', 'Perfil creado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al crear el perfil: ' . $e->getMessage()]);
        }
    }

    public function putPerfiles(Request $request, $id)
    {
        try {
            $nombre = strip_tags($request->input('nombre'));
            $descripcion = strip_tags($request->input('descripcion'));

            $response = Http::put(env('API_URL') . 'perfiles/' . $id, [
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'submodulos' => $request->input('submodulos'),
            ])->throw()->json();

            return redirect()->route('perfiles')->with('success', 'Perfil actualizado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al actualizar el perfil: ' . $e->getMessage()]);
        }
    }

    public function deletePerfilesId($id)
    {
        try {
            $response = Http::delete(env('API_URL') . 'perfiles/' . $id)->throw()->json();
            return redirect()->route('perfiles')->with('success', 'Perfil eliminado correctamente');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Error al eliminar el perfil: ' . $e->getMessage()]);
        }
    }

    public function getPerfilesId($id)
    {
        $response = Http::get(env('API_URL') . 'perfiles/' . $id)->throw()->json();
        return $response;
    }

    // Otros
    public function getModulos()
    {
        $response = Http::get(env('API_URL') . 'modulos')->throw()->json();
        return $response;
    }

    public function getSedes()
    {
        $response = Http::get(env('API_URL') . 'sedes')->throw()->json();
        return $response;
    }
}
