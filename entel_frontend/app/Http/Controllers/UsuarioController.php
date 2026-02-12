<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;

class UsuarioController extends Controller
{
    public function validarUsuario(Request $request)
    {
        $request->validate([
            'correo_usuario' => 'required',
            'clave_usuario' => 'required|min:5',
        ], [
            'correo_usuario.required' => 'El correo es requerido',
            'clave_usuario.required' => 'La contraseña es requerida',
            'clave_usuario.min' => 'La contraseña debe tener al menos 5 caracteres',
        ]);

        $correo = filter_var($request->input('correo_usuario'), FILTER_SANITIZE_EMAIL);
        $clave = strip_tags($request->input('clave_usuario'));

        // Demo mode - allows testing UI without backend
        if ($correo === 'demo@entel.com' && $clave === 'demo123') {
            Session::put('logeado', true);
            Session::put('demo_mode', true);
            Session::put('datos_usuario', [
                'id_usuario' => 1,
                'nombres' => 'Usuario',
                'apellidos' => 'Demo',
                'correo' => 'demo@entel.com',
                'id_perfil' => 1,
                'accesos' => [],
            ]);
            return redirect()->route('principal');
        }

        try {
            $response = Http::post(env('API_URL') . 'usuarios/validar-credenciales', [
                'correo' => $correo,
                'clave' => $clave,
            ])->throw()->json();

            if ($response['estado']) {
                Session::put('logeado', true);
                Session::put('datos_usuario', $response['usuario']);
                return redirect()->route('principal');
            }

            return back()->withErrors([
                'message' => 'Credenciales incorrectas',
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'message' => 'Usuario o contraseña incorrectos',
            ]);
        }
    }

    public function cerrarSesion()
    {
        Session::flush();
        return redirect()->route('login');
    }
}
