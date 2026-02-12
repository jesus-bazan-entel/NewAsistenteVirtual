const db = require("../models"),
    AsteriskConfService = require('../services/asterisk.conf.service');
const Equipo = db.equipo;
const Canal = db.canal;
const TecnologiaOperador = db.tecnologiaoperador;
const Op = db.Sequelize.Op;
var asteriskService = null;
const v = require('validator');

// Flag para rastrear estado de conexión a Asterisk
let asteriskConnected = false;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 segundos entre reintentos

exports.setAsteriskService = async (baseAsteriskService) => {
    asteriskService = baseAsteriskService;
    asteriskConnected = false; // Se verificará en el primer uso
}

exports.obtenerTodos = async (req, res) => {
    try {
        const results = await Equipo.findAll({
            include: ["canales", "sede"],
            order: [
                ["id_equipo", "ASC"],
                ["canales","posicion","ASC"], 
                ["canales", "id_canal", "ASC"]
            ]
        })
        const equipos = await iterarEquipos(results)
        return res.status(200).json({
            estado: true,
            equipos
        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            error: "Error al obtener los equipos."
        })
    }
};

exports.crear = async (req, res) => {
    //Transacción
    const t = await db.sequelize.transaction();
    const nombre = v.escape(req.body.nombre);
    const ip = v.escape(req.body.ip);
 
    try {

        let datos_equipo = {
            nombre: nombre,
            ip: ip,
            tipo: req.body.tipo,
            ranuras: req.body.ranuras,
            id_sede: req.body.id_sede,
            estado: 'A',
            canales: []
        }
        datos_equipo.canales = await iterarCanales(req.body.canales)
        const equipo = await Equipo.create(datos_equipo, {
            include: ["canales"]
        }, {
            transaction: t
        })
        if (asteriskService != null) {
            await AsteriskConfService.write();
            asteriskService.reload();
        }
        await t.commit();
        //await equipo.addCanales(req.body.canales)
        return res.status(201).json({
            estado: true,
            mensaje: "Se creó correctamente el equipo",
            data: equipo
        })
    } catch (error) {
        console.log(error.message);
        await t.rollback();
        return res.status(500).json({
            error: "Error al crear el equipo."
        })
    }
};

exports.buscarUno = async (req, res) => {
    try {
        const id_equipo = req.params.id_equipo
        const equipo = await Equipo.findOne({
            where: {
                id_equipo: id_equipo
            },
            include: ["canales"]
        })
        if (equipo) {
            let equipo_response = await Equipo.findOne({
                where: {
                    id_equipo: id_equipo
                },
                include: ["sede"]
            })
            const canales = await iterarCanalesBuscar(equipo.canales);
            equipo_response.setDataValue('canales', canales)
            return res.status(200).json({
                estado: true,
                equipo_response
            })
        }
        return res.status(404).send('El equipo con el ID especificado no existe')
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            error: "Error al obtener el equipo."
        })
    }
};

exports.actualizar = async (req, res) => {
    try {
        const nombre = v.escape(req.body.nombre);
        const ip = v.escape(req.body.ip);

        const id_equipo = req.params.id_equipo
        const equipo = await Equipo.findOne({
            where: {
                id_equipo: id_equipo
            },
            include: ["canales"]
        })
        if (equipo) {
            let datos_equipo = {
                nombre: nombre,
                ip: ip,
                tipo: req.body.tipo,
                ranuras: req.body.ranuras,
                id_sede: req.body.id_sede,
            }
            await Equipo.update(datos_equipo, {
                where: {
                    id_equipo: id_equipo
                }
            })
            const canales = await iterarCanales(req.body.canales)
            const canales_actualizar = canales.filter((e) => {
                return e.hasOwnProperty('id_canal')
            })
            const canales_agregar = canales.filter((e) => {
                return !e.hasOwnProperty('id_canal')
            })
            const canales_eliminar = await compararCanales(equipo.canales, canales_actualizar)
            await iterarCanalesActualizar(canales_actualizar)
            await iterarCanalesCrear(canales_agregar, id_equipo)
            await iterarCanalesEliminar(canales_eliminar)
            if (asteriskService != null) {
                await AsteriskConfService.write();
                asteriskService.reload();
            }
            return res.status(200).json({
                estado: true,
                mensaje: "Se actualizó correctamente el equipo"
            })
        }
        return res.status(404).send('El equipo con el ID especificado no existe')
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({
            error: "Error al actualizar el equipo."
        })
    }
};

exports.eliminar = async (req, res) => {
    try {
        const id_equipo = req.params.id_equipo
        await Canal.destroy({
            where: {
                id_equipo: id_equipo
            },
        })
        await Equipo.destroy({
            where: {
                id_equipo: id_equipo
            },
        })
        if (asteriskService != null) {
            await AsteriskConfService.write();
            asteriskService.reload();
        }
        return res.status(200).json({
            estado: true,
            mensaje: "Se eliminó correctamente el equipo."
        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({
            error: "Error al eliminar equipo."
        })
    }
};

const iterarCanales = async (canales) => {
    let data = []
    for (const i in canales) {
        let tecnologiaoperador = await TecnologiaOperador.findOne({
            where: {
                [Op.and]: [{
                    id_tecnologia: canales[i].id_tecnologia
                }, {
                    id_operador_telefonico: canales[i].id_operador
                }]
            }
        })
        let id_tecnologia_operador = tecnologiaoperador ? tecnologiaoperador.id_tecnologia_operador : null
        let send = {
            id_tecnologia_operador: id_tecnologia_operador,
            nro_ranura: canales[i].nro_ranura,
            numero: canales[i].numero
        }
        if (canales[i].id_canal) {
            send.id_canal = canales[i].id_canal
        }
        if (canales[i].posicion) {
            send.posicion = Number(canales[i].posicion)
        } else {
            send.posicion = Number(i)
        }
        data.push(send)
    }
    return data
}

const iterarCanalesBuscar = async (canales) => {
    let data = []
    for (let i in canales) {
        if (canales[i].id_tecnologia_operador != null) {
            let tecnologiaoperador = await TecnologiaOperador.findOne({
                where: {
                    id_tecnologia_operador: canales[i].id_tecnologia_operador
                },
                include: ["operador", "tecnologia"]
            })
            canales[i].setDataValue('nombre_operador', tecnologiaoperador.tecnologia.nombre)
            canales[i].setDataValue('nombre_tecnologia', tecnologiaoperador.operador.nombre)
            canales[i].setDataValue('id_tecnologia', tecnologiaoperador.id_tecnologia)
            canales[i].setDataValue('id_operador', tecnologiaoperador.id_operador_telefonico)
        }
        data.push(canales[i])
    }
    return data
}


const iterarCanalesActualizar = async (canales) => {
    let promises = [];
    canales.forEach(function(canal) {
        promises.push(Canal.update({
            id_tecnologia_operador: canal.id_tecnologia_operador,
            nro_ranura: canal.nro_ranura,
            numero: canal.numero,
            posicion: canal.posicion
        }, {
            where: {
                id_canal: canal.id_canal
            }
        }))
    })
    Promise.all(promises).then(function() {
        return true
    }, function(err) {
        // error
        return false
    });
}

const compararCanales = async (canales_db, canales_body) => {
    const canalesArrayId = canales_body.map((x) => x.id_canal)
    const canalesEliminar = canales_db.filter(x => !canalesArrayId.includes(x.id_canal))
    return canalesEliminar
}

const iterarCanalesCrear = async (canales, id_equipo) => {
    let promises = [];
    canales.forEach(function(canal) {
        promises.push(Canal.create({
            id_tecnologia_operador: canal.id_tecnologia_operador,
            id_equipo: id_equipo,
            numero: canal.numero,
            nro_ranura: canal.nro_ranura,
            posicion: canal.posicion
        }))
    })
    Promise.all(promises).then(function() {
        return true
    }, function(err) {
        console.log(err);
        return false
    });
}

const iterarCanalesEliminar = async (canales) => {
    let promises = [];
    canales.forEach(function(canal) {
        promises.push(Canal.destroy({
            where: {
                id_canal: canal.id_canal
            },
        }))
    })
    Promise.all(promises).then(function() {
        return true
    }, function(err) {
        console.log(err);
        return false
    });
}

// Helper para timeout de promesas
const withTimeout = (promise, ms) => {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
    );
    return Promise.race([promise, timeout]);
};

const iterarEquipos = async (equipos) => {
    const now = Date.now();

    // Si Asterisk no está disponible y no ha pasado el intervalo de reintento, skip rápido
    if (asteriskService == null || (!asteriskConnected && (now - lastConnectionCheck) < CONNECTION_CHECK_INTERVAL)) {
        for (const i in equipos) {
            equipos[i].setDataValue('estado', 'D');
        }
        return equipos;
    }

    // Verificar conexión con el primer equipo (o si no hay equipos, marcar como verificado)
    if (equipos.length === 0) {
        return equipos;
    }

    // Intentar verificar el primer equipo con timeout corto
    try {
        const firstResult = await withTimeout(
            asteriskService.checkPeerStatus({
                'peer': equipos[0].nombre,
                'results': []
            }),
            2000 // 2 segundos máximo
        );
        asteriskConnected = true;
        lastConnectionCheck = now;

        // Primer equipo
        const estado0 = JSON.stringify(firstResult).split('')[1] === 't' ? 'A' : 'D';
        equipos[0].setDataValue('estado', estado0);

        // Resto de equipos (Asterisk está conectado)
        for (let i = 1; i < equipos.length; i++) {
            try {
                const result = await withTimeout(
                    asteriskService.checkPeerStatus({
                        'peer': equipos[i].nombre,
                        'results': []
                    }),
                    2000
                );
                const estado = JSON.stringify(result).split('')[1] === 't' ? 'A' : 'D';
                equipos[i].setDataValue('estado', estado);
            } catch (err) {
                equipos[i].setDataValue('estado', 'D');
            }
        }
    } catch (err) {
        // Asterisk no disponible - marcar flag y todos los equipos como desconectados
        asteriskConnected = false;
        lastConnectionCheck = now;
        for (const i in equipos) {
            equipos[i].setDataValue('estado', 'D');
        }
    }

    return equipos;
}
