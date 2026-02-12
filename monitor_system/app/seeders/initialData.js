const bcrypt = require('bcryptjs');

module.exports = async (db) => {
    const { perfil, usuario, sede, tecnologia, operadortelefonico, tecnologiaoperador,
            equipo, canal, modulo, submodulo, perfilsubmodulo, numeroexterno,
            matriz, error: errorModel, registroclave } = db;

    // Check if data already exists
    const existingUsers = await usuario.count();
    if (existingUsers > 0) {
        console.log('Seeder: datos ya existen, omitiendo...');
        return;
    }

    console.log('Seeder: insertando datos iniciales...');

    // 1. Create Perfiles (estado: 'A' = Activo, 'D' = Desactivado)
    const perfiles = await perfil.bulkCreate([
        { nombre: 'Administrador', descripcion: 'Acceso total al sistema', estado: 'A' },
        { nombre: 'Supervisor', descripcion: 'Gestión de operadores y reportes', estado: 'A' },
        { nombre: 'Operador', descripcion: 'Ejecución de pruebas', estado: 'A' },
        { nombre: 'Técnico', descripcion: 'Configuración de equipos', estado: 'A' },
    ]);

    // 2. Create Sedes
    const sedes = await sede.bulkCreate([
        { nombre: 'Lima - Principal' },
        { nombre: 'Arequipa' },
        { nombre: 'Trujillo' },
        { nombre: 'Cusco' },
    ]);

    // 3. Create Users (password: demo123, acceso: 'A' = Activo)
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await usuario.bulkCreate([
        {
            nombres: 'Usuario',
            apellidos: 'Demo',
            correo: 'demo@entel.com',
            clave: hashedPassword,
            id_perfil: perfiles[0].id_perfil,
            acceso: 'A'
        },
        {
            nombres: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan.perez@entel.com',
            clave: hashedPassword,
            id_perfil: perfiles[0].id_perfil,
            acceso: 'A'
        },
        {
            nombres: 'María',
            apellidos: 'García',
            correo: 'maria.garcia@entel.com',
            clave: hashedPassword,
            id_perfil: perfiles[1].id_perfil,
            acceso: 'A'
        },
        {
            nombres: 'Carlos',
            apellidos: 'López',
            correo: 'carlos.lopez@entel.com',
            clave: hashedPassword,
            id_perfil: perfiles[2].id_perfil,
            acceso: 'A'
        },
    ]);

    // 4. Create Tecnologias
    const tecnologias = await tecnologia.bulkCreate([
        { nombre: '4G LTE' },
        { nombre: '5G' },
        { nombre: '3G' },
        { nombre: 'VoLTE' },
        { nombre: 'VoWiFi' },
    ]);

    // 5. Create Operadores Telefonicos
    const operadores = await operadortelefonico.bulkCreate([
        { nombre: 'Entel', codigo: 'ENT' },
        { nombre: 'Claro', codigo: 'CLA' },
        { nombre: 'Movistar', codigo: 'MOV' },
        { nombre: 'Bitel', codigo: 'BIT' },
    ]);

    // 6. Create Tecnologia-Operador relations
    const tecOps = await tecnologiaoperador.bulkCreate([
        { id_tecnologia: tecnologias[0].id_tecnologia, id_operador_telefonico: operadores[0].id_operador_telefonico },
        { id_tecnologia: tecnologias[0].id_tecnologia, id_operador_telefonico: operadores[1].id_operador_telefonico },
        { id_tecnologia: tecnologias[0].id_tecnologia, id_operador_telefonico: operadores[2].id_operador_telefonico },
        { id_tecnologia: tecnologias[1].id_tecnologia, id_operador_telefonico: operadores[0].id_operador_telefonico },
        { id_tecnologia: tecnologias[3].id_tecnologia, id_operador_telefonico: operadores[0].id_operador_telefonico },
    ]);

    // 7. Create Equipos (VoIP: gateways, PBX, ATAs, teléfonos IP)
    const equipos = await equipo.bulkCreate([
        // Gateways GSM/VoIP - Lima Principal
        { nombre: 'Dinstar DWG2000E-8G', ip: '192.168.1.101', tipo: 'gateway', ranuras: '8', id_sede: sedes[0].id_sede, estado: 'A' },
        { nombre: 'OpenVox VS-GW1202-4G', ip: '192.168.1.102', tipo: 'gateway', ranuras: '4', id_sede: sedes[0].id_sede, estado: 'A' },
        { nombre: 'Yeastar TG800 LTE', ip: '192.168.1.103', tipo: 'gateway', ranuras: '8', id_sede: sedes[0].id_sede, estado: 'A' },
        // PBX - Lima Principal
        { nombre: 'Asterisk PBX v18 Lima', ip: '192.168.1.10', tipo: 'pbx', ranuras: '64', id_sede: sedes[0].id_sede, estado: 'A' },
        // Gateway GSM - Arequipa
        { nombre: 'GoIP-8 Hybertone AQP', ip: '192.168.2.101', tipo: 'gateway', ranuras: '8', id_sede: sedes[1].id_sede, estado: 'A' },
        { nombre: 'Dinstar UC2000-VG-16G AQP', ip: '192.168.2.102', tipo: 'gateway', ranuras: '16', id_sede: sedes[1].id_sede, estado: 'A' },
        // PBX - Trujillo
        { nombre: 'FreePBX Issabel TRU', ip: '192.168.3.10', tipo: 'pbx', ranuras: '32', id_sede: sedes[2].id_sede, estado: 'A' },
        // ATA (Analog Telephone Adapters)
        { nombre: 'Grandstream HT814 ATA', ip: '192.168.1.120', tipo: 'ata', ranuras: '4', id_sede: sedes[0].id_sede, estado: 'A' },
        { nombre: 'Cisco SPA112 ATA', ip: '192.168.1.121', tipo: 'ata', ranuras: '2', id_sede: sedes[0].id_sede, estado: 'A' },
        // Equipos desactivados/mantenimiento
        { nombre: 'OpenVox SWG-2032 (Mant.)', ip: '192.168.1.104', tipo: 'gateway', ranuras: '32', id_sede: sedes[0].id_sede, estado: 'D' },
        // Gateway - Cusco
        { nombre: 'Yeastar TG400 GSM CUS', ip: '192.168.4.101', tipo: 'gateway', ranuras: '4', id_sede: sedes[3].id_sede, estado: 'A' },
    ]);

    // 8. Create Canales (estado: 'A'/'D', estado_llamada: 'LIBRE'/'SALIENTE'/'ENTRANTE')
    await canal.bulkCreate([
        // Dinstar DWG2000E-8G (equipos[0]) - 8 SIMs multi-operador
        { numero: '987100001', id_equipo: equipos[0].id_equipo, id_tecnologia_operador: tecOps[0].id_tecnologia_operador, estado: 'A', nro_ranura: 1, posicion: 1, estado_llamada: 'LIBRE' },
        { numero: '987100002', id_equipo: equipos[0].id_equipo, id_tecnologia_operador: tecOps[0].id_tecnologia_operador, estado: 'A', nro_ranura: 2, posicion: 2, estado_llamada: 'LIBRE' },
        { numero: '987100003', id_equipo: equipos[0].id_equipo, id_tecnologia_operador: tecOps[1].id_tecnologia_operador, estado: 'A', nro_ranura: 3, posicion: 3, estado_llamada: 'LIBRE' },
        { numero: '987100004', id_equipo: equipos[0].id_equipo, id_tecnologia_operador: tecOps[2].id_tecnologia_operador, estado: 'A', nro_ranura: 4, posicion: 4, estado_llamada: 'LIBRE' },
        // OpenVox VS-GW1202-4G (equipos[1]) - 4 canales
        { numero: '987200001', id_equipo: equipos[1].id_equipo, id_tecnologia_operador: tecOps[0].id_tecnologia_operador, estado: 'A', nro_ranura: 1, posicion: 1, estado_llamada: 'LIBRE' },
        { numero: '987200002', id_equipo: equipos[1].id_equipo, id_tecnologia_operador: tecOps[3].id_tecnologia_operador, estado: 'A', nro_ranura: 2, posicion: 2, estado_llamada: 'LIBRE' },
        // Yeastar TG800 LTE (equipos[2]) - VoLTE
        { numero: '987300001', id_equipo: equipos[2].id_equipo, id_tecnologia_operador: tecOps[4].id_tecnologia_operador, estado: 'A', nro_ranura: 1, posicion: 1, estado_llamada: 'LIBRE' },
        { numero: '987300002', id_equipo: equipos[2].id_equipo, id_tecnologia_operador: tecOps[4].id_tecnologia_operador, estado: 'A', nro_ranura: 2, posicion: 2, estado_llamada: 'LIBRE' },
        // GoIP-8 Hybertone AQP (equipos[4]) - Arequipa
        { numero: '987400001', id_equipo: equipos[4].id_equipo, id_tecnologia_operador: tecOps[0].id_tecnologia_operador, estado: 'A', nro_ranura: 1, posicion: 1, estado_llamada: 'LIBRE' },
        { numero: '987400002', id_equipo: equipos[4].id_equipo, id_tecnologia_operador: tecOps[1].id_tecnologia_operador, estado: 'A', nro_ranura: 2, posicion: 2, estado_llamada: 'LIBRE' },
        { numero: '987400003', id_equipo: equipos[4].id_equipo, id_tecnologia_operador: tecOps[2].id_tecnologia_operador, estado: 'A', nro_ranura: 3, posicion: 3, estado_llamada: 'LIBRE' },
        // Dinstar UC2000-VG-16G AQP (equipos[5]) - 16 canales Arequipa
        { numero: '987500001', id_equipo: equipos[5].id_equipo, id_tecnologia_operador: tecOps[0].id_tecnologia_operador, estado: 'A', nro_ranura: 1, posicion: 1, estado_llamada: 'LIBRE' },
        { numero: '987500002', id_equipo: equipos[5].id_equipo, id_tecnologia_operador: tecOps[0].id_tecnologia_operador, estado: 'A', nro_ranura: 2, posicion: 2, estado_llamada: 'LIBRE' },
        // Grandstream HT814 ATA (equipos[7]) - Líneas fijas
        { numero: '014001001', id_equipo: equipos[7].id_equipo, id_tecnologia_operador: tecOps[0].id_tecnologia_operador, estado: 'A', nro_ranura: 1, posicion: 1, estado_llamada: 'LIBRE' },
        { numero: '014001002', id_equipo: equipos[7].id_equipo, id_tecnologia_operador: tecOps[0].id_tecnologia_operador, estado: 'A', nro_ranura: 2, posicion: 2, estado_llamada: 'LIBRE' },
        // Yeastar TG400 GSM CUS (equipos[10]) - Cusco
        { numero: '987600001', id_equipo: equipos[10].id_equipo, id_tecnologia_operador: tecOps[0].id_tecnologia_operador, estado: 'A', nro_ranura: 1, posicion: 1, estado_llamada: 'LIBRE' },
        { numero: '987600002', id_equipo: equipos[10].id_equipo, id_tecnologia_operador: tecOps[1].id_tecnologia_operador, estado: 'A', nro_ranura: 2, posicion: 2, estado_llamada: 'LIBRE' },
    ]);

    // 9. Create Numeros Externos
    await numeroexterno.bulkCreate([
        { nombre: 'Claro Móvil 1', comentario: 'Número de prueba Claro', numero: '+51987654321' },
        { nombre: 'Movistar Móvil 1', comentario: 'Número de prueba Movistar', numero: '+51976543210' },
        { nombre: 'Movistar Fijo', comentario: 'Número fijo Lima', numero: '+5114567890' },
        { nombre: 'Bitel Móvil 1', comentario: 'Número de prueba Bitel', numero: '+51965432109' },
    ]);

    // 10. Create Matrices (estado: boolean)
    await matriz.bulkCreate([
        { nombre: 'Matriz Llamadas Salientes', estado: true },
        { nombre: 'Matriz SMS', estado: true },
        { nombre: 'Matriz Datos', estado: true },
        { nombre: 'Matriz VoLTE', estado: false },
    ]);

    // 11. Create Modulos y Submodulos
    const modulos = await modulo.bulkCreate([
        { nombre: 'Dashboard', ruta: '/principal', icono: 'dashboard' },
        { nombre: 'Configuración General', ruta: '/configuracion-general', icono: 'settings' },
        { nombre: 'Configuración Avanzada', ruta: '/configuracion-avanzada', icono: 'tune' },
        { nombre: 'Generador de Pruebas', ruta: '/generador-pruebas', icono: 'science' },
        { nombre: 'Reportes', ruta: '/reportes', icono: 'assessment' },
        { nombre: 'DISA', ruta: '/disa', icono: 'vpn_key' },
    ]);

    const submodulos = await submodulo.bulkCreate([
        { nombre: 'Principal', ruta: '/principal', icono: 'home', id_modulo: modulos[0].id_modulo },
        { nombre: 'Usuarios', ruta: '/configuracion-general/usuarios', icono: 'people', id_modulo: modulos[1].id_modulo },
        { nombre: 'Perfiles', ruta: '/configuracion-general/perfiles', icono: 'badge', id_modulo: modulos[1].id_modulo },
        { nombre: 'Tecnologías', ruta: '/configuracion-avanzada/tecnologias', icono: 'cell_tower', id_modulo: modulos[2].id_modulo },
        { nombre: 'Operadores', ruta: '/configuracion-avanzada/operadores-telefonicos', icono: 'business', id_modulo: modulos[2].id_modulo },
        { nombre: 'Equipos', ruta: '/configuracion-avanzada/equipos', icono: 'devices', id_modulo: modulos[2].id_modulo },
        { nombre: 'Números Externos', ruta: '/configuracion-avanzada/numeros-externos', icono: 'phone', id_modulo: modulos[2].id_modulo },
        { nombre: 'Matrices', ruta: '/generador-pruebas/matrices', icono: 'grid_on', id_modulo: modulos[3].id_modulo },
        { nombre: 'Lanzador de Pruebas', ruta: '/generador-pruebas/lanzador-pruebas', icono: 'play_arrow', id_modulo: modulos[3].id_modulo },
        { nombre: 'Reporte de Pruebas', ruta: '/reportes/reporte-pruebas', icono: 'summarize', id_modulo: modulos[4].id_modulo },
        { nombre: 'Reporte DISA', ruta: '/reportes/reporte-disa', icono: 'analytics', id_modulo: modulos[4].id_modulo },
        { nombre: 'Registro de Clave', ruta: '/disa/registro-clave', icono: 'key', id_modulo: modulos[5].id_modulo },
    ]);

    // 12. Assign all submodulos to Admin profile
    for (const sub of submodulos) {
        await perfilsubmodulo.create({
            id_perfil: perfiles[0].id_perfil,
            id_submodulo: sub.id_submodulo
        });
    }

    // 13. Create Error codes
    await errorModel.bulkCreate([
        { codigo: 'E001', estado: 'A', mensaje: 'Llamada no contestada' },
        { codigo: 'E002', estado: 'A', mensaje: 'Número ocupado' },
        { codigo: 'E003', estado: 'A', mensaje: 'Fuera de cobertura' },
        { codigo: 'E004', estado: 'A', mensaje: 'SMS no enviado' },
        { codigo: 'E005', estado: 'A', mensaje: 'Timeout de conexión' },
    ]);

    // 14. Create Registro Clave (DISA)
    await registroclave.bulkCreate([
        { nombre: 'DISA Principal', comentario: 'Clave de acceso principal', clave: 'DISA-001' },
        { nombre: 'DISA Respaldo', comentario: 'Clave de respaldo', clave: 'DISA-002' },
    ]);

    console.log('Seeder: datos iniciales insertados correctamente');
};
