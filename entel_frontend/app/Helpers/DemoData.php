<?php

namespace App\Helpers;

class DemoData
{
    public static function usuarios()
    {
        return [
            ['id' => 1, 'nombre' => 'Juan Pérez', 'correo' => 'juan.perez@entel.com', 'perfil' => 'Administrador', 'sede' => 'Lima', 'estado' => 'Activo'],
            ['id' => 2, 'nombre' => 'María García', 'correo' => 'maria.garcia@entel.com', 'perfil' => 'Operador', 'sede' => 'Arequipa', 'estado' => 'Activo'],
            ['id' => 3, 'nombre' => 'Carlos López', 'correo' => 'carlos.lopez@entel.com', 'perfil' => 'Supervisor', 'sede' => 'Trujillo', 'estado' => 'Activo'],
            ['id' => 4, 'nombre' => 'Ana Torres', 'correo' => 'ana.torres@entel.com', 'perfil' => 'Operador', 'sede' => 'Lima', 'estado' => 'Inactivo'],
            ['id' => 5, 'nombre' => 'Pedro Sánchez', 'correo' => 'pedro.sanchez@entel.com', 'perfil' => 'Técnico', 'sede' => 'Cusco', 'estado' => 'Activo'],
        ];
    }

    public static function perfiles()
    {
        return [
            ['id' => 1, 'nombre' => 'Administrador', 'descripcion' => 'Acceso total al sistema', 'estado' => 'Activo'],
            ['id' => 2, 'nombre' => 'Supervisor', 'descripcion' => 'Gestión de operadores y reportes', 'estado' => 'Activo'],
            ['id' => 3, 'nombre' => 'Operador', 'descripcion' => 'Ejecución de pruebas', 'estado' => 'Activo'],
            ['id' => 4, 'nombre' => 'Técnico', 'descripcion' => 'Configuración de equipos', 'estado' => 'Activo'],
        ];
    }

    public static function sedes()
    {
        return [
            ['id' => 1, 'nombre' => 'Lima'],
            ['id' => 2, 'nombre' => 'Arequipa'],
            ['id' => 3, 'nombre' => 'Trujillo'],
            ['id' => 4, 'nombre' => 'Cusco'],
            ['id' => 5, 'nombre' => 'Piura'],
        ];
    }

    public static function tecnologias()
    {
        return [
            ['id' => 1, 'nombre' => '4G LTE', 'descripcion' => 'Red móvil de cuarta generación', 'estado' => 'Activo'],
            ['id' => 2, 'nombre' => '5G', 'descripcion' => 'Red móvil de quinta generación', 'estado' => 'Activo'],
            ['id' => 3, 'nombre' => '3G', 'descripcion' => 'Red móvil de tercera generación', 'estado' => 'Inactivo'],
            ['id' => 4, 'nombre' => 'VoLTE', 'descripcion' => 'Voz sobre LTE', 'estado' => 'Activo'],
            ['id' => 5, 'nombre' => 'VoWiFi', 'descripcion' => 'Voz sobre WiFi', 'estado' => 'Activo'],
        ];
    }

    public static function operadores()
    {
        return [
            ['id' => 1, 'nombre' => 'Entel', 'codigo' => 'ENT', 'pais' => 'Perú', 'estado' => 'Activo'],
            ['id' => 2, 'nombre' => 'Claro', 'codigo' => 'CLA', 'pais' => 'Perú', 'estado' => 'Activo'],
            ['id' => 3, 'nombre' => 'Movistar', 'codigo' => 'MOV', 'pais' => 'Perú', 'estado' => 'Activo'],
            ['id' => 4, 'nombre' => 'Bitel', 'codigo' => 'BIT', 'pais' => 'Perú', 'estado' => 'Activo'],
        ];
    }

    public static function equipos()
    {
        return [
            ['id' => 1, 'nombre' => 'Samsung Galaxy S23', 'modelo' => 'SM-S911B', 'imei' => '354789012345678', 'estado' => 'Activo'],
            ['id' => 2, 'nombre' => 'iPhone 14 Pro', 'modelo' => 'A2890', 'imei' => '354789012345679', 'estado' => 'Activo'],
            ['id' => 3, 'nombre' => 'Xiaomi 13', 'modelo' => '2211133G', 'imei' => '354789012345680', 'estado' => 'Activo'],
            ['id' => 4, 'nombre' => 'Motorola Edge 40', 'modelo' => 'XT2303-2', 'imei' => '354789012345681', 'estado' => 'En mantenimiento'],
            ['id' => 5, 'nombre' => 'Google Pixel 7', 'modelo' => 'GVU6C', 'imei' => '354789012345682', 'estado' => 'Activo'],
        ];
    }

    public static function numerosExternos()
    {
        return [
            ['id' => 1, 'numero' => '+51987654321', 'operador' => 'Claro', 'tipo' => 'Móvil', 'estado' => 'Activo'],
            ['id' => 2, 'numero' => '+51976543210', 'operador' => 'Movistar', 'tipo' => 'Móvil', 'estado' => 'Activo'],
            ['id' => 3, 'numero' => '+5114567890', 'operador' => 'Movistar', 'tipo' => 'Fijo', 'estado' => 'Activo'],
            ['id' => 4, 'numero' => '+51965432109', 'operador' => 'Bitel', 'tipo' => 'Móvil', 'estado' => 'Inactivo'],
        ];
    }

    public static function matrices()
    {
        return [
            ['id' => 1, 'nombre' => 'Matriz Llamadas Salientes', 'descripcion' => 'Pruebas de llamadas salientes a diferentes operadores', 'escenarios' => 12, 'estado' => 'Activo'],
            ['id' => 2, 'nombre' => 'Matriz SMS', 'descripcion' => 'Pruebas de envío de mensajes SMS', 'escenarios' => 8, 'estado' => 'Activo'],
            ['id' => 3, 'nombre' => 'Matriz Datos', 'descripcion' => 'Pruebas de conexión de datos móviles', 'escenarios' => 15, 'estado' => 'Activo'],
            ['id' => 4, 'nombre' => 'Matriz VoLTE', 'descripcion' => 'Pruebas de voz sobre LTE', 'escenarios' => 10, 'estado' => 'En desarrollo'],
        ];
    }

    public static function pruebas()
    {
        return [
            ['id' => 1, 'nombre' => 'Prueba Llamadas Lima', 'matriz' => 'Matriz Llamadas Salientes', 'fecha_creacion' => '2025-01-15', 'estado' => 'Pendiente'],
            ['id' => 2, 'nombre' => 'Prueba SMS Arequipa', 'matriz' => 'Matriz SMS', 'fecha_creacion' => '2025-01-14', 'estado' => 'En ejecución'],
            ['id' => 3, 'nombre' => 'Prueba Datos Trujillo', 'matriz' => 'Matriz Datos', 'fecha_creacion' => '2025-01-13', 'estado' => 'Completada'],
        ];
    }

    public static function ejecuciones()
    {
        return [
            ['id' => 1, 'prueba_nombre' => 'Prueba Llamadas Lima', 'fecha_inicio' => '2025-01-15 09:00:00', 'fecha_fin' => '2025-01-15 10:30:00', 'estado' => 'FINALIZADO', 'total_escenarios' => 12],
            ['id' => 2, 'prueba_nombre' => 'Prueba SMS Arequipa', 'fecha_inicio' => '2025-01-14 14:00:00', 'fecha_fin' => '2025-01-14 15:00:00', 'estado' => 'FINALIZADO', 'total_escenarios' => 8],
            ['id' => 3, 'prueba_nombre' => 'Prueba Datos Nacional', 'fecha_inicio' => '2025-01-13 08:00:00', 'fecha_fin' => '2025-01-13 12:00:00', 'estado' => 'ERROR', 'total_escenarios' => 15],
            ['id' => 4, 'prueba_nombre' => 'Prueba VoLTE Lima', 'fecha_inicio' => '2025-01-12 10:00:00', 'fecha_fin' => null, 'estado' => 'EN_PROCESO', 'total_escenarios' => 10],
            ['id' => 5, 'prueba_nombre' => 'Prueba Cobertura Cusco', 'fecha_inicio' => '2025-01-11 09:00:00', 'fecha_fin' => '2025-01-11 11:00:00', 'estado' => 'FINALIZADO', 'total_escenarios' => 20],
        ];
    }

    public static function registrosClave()
    {
        return [
            ['id' => 1, 'clave' => 'DISA-001', 'descripcion' => 'Clave de acceso principal', 'fecha_registro' => '2025-01-10', 'estado' => 'Activo'],
            ['id' => 2, 'clave' => 'DISA-002', 'descripcion' => 'Clave de respaldo', 'fecha_registro' => '2025-01-08', 'estado' => 'Activo'],
            ['id' => 3, 'clave' => 'DISA-003', 'descripcion' => 'Clave temporal', 'fecha_registro' => '2025-01-05', 'estado' => 'Inactivo'],
        ];
    }
}
