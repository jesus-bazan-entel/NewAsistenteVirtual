var cron = require('node-cron');
const db = require("../models");
const moment = require('moment');
const Prueba = db.prueba;
const Ejecucion = db.ejecucion;
const Escenario = db.escenario;
const pruebas = require("../controllers/Prueba.controller.js");
const ejecucionService = require("../services/ejecucion.service.js");
const { Op } = require("sequelize");

//Buscar pruebas programadas
module.exports = cron.schedule('*/10 * * * * *', async() => {
    if (process.env.ASTERISK_ENV == 'production') {
        const limit = Number(process.env.ESCENARIOS_LIMIT, 5);
        const fecha_actual = moment().format("YYYY-MM-DD HH:mm:ss");
        let pruebasProgramadas = await Prueba.buscarProgramadas(fecha_actual);
        // console.log("pruebasProgramadas",pruebasProgramadas);

        for await (const prueba of pruebasProgramadas) {
            await pruebas.ejecutarMatriz(prueba.id_matriz, prueba.id_prueba);
        }
        //iterar por todas las ejecuciones con estado PENDIENTE,
        //buscar escenarios con estado CREADO, por cada uno
        //si no existe marcar como finalizado.
        let ejecuciones = await Ejecucion.findAll({ where: { estado: 'PENDIENTE' } });
        for await (const ejecucion of ejecuciones) {
            let escenarios = await Escenario.findAll(
                {
                    where: {
                        id_ejecucion: ejecucion.id_ejecucion,
                        estado: 'CREADO' 
                    },
                    include: [
                        {
                            model: db.canal,
                            as: 'canal_origen',
                            required: false
                        },
                        {
                            model: db.canal,
                            as: 'destino',
                            where: {
                                    '$escenarios.tipo$': 'C',
                            },
                            required: false,
                        }
                    ],
                    limit: 1
                }
            );
            if (escenarios.length > 0) {
                let escenarios_libres = await Escenario.findAll({ 
                    where: {
                        [Op.and]: [
                            {
                                id_ejecucion: ejecucion.id_ejecucion,
                                estado: 'CREADO',
                                '$canal_origen.estado_llamada$': 'LIBRE',
                            },
                            {
                                [Op.or]: [
                                    {
                                        '$destino.estado_llamada$': 'LIBRE',
                                    },
                                    {
                                        'tipo': 'E'
                                    }
                                ]
                            }
                        ]
                    },
                    include: [
                        {
                            model: db.canal,
                            as: 'canal_origen',
                            required: false
                        },
                        {
                            model: db.canal,
                            as: 'destino',
                            where: {
                                    '$escenarios.tipo$': 'C',
                            },
                            required: false,
                        }
                    ],
                    limit: 1
                })
                if(escenarios_libres.length > 0){
                    for await (const escenario of escenarios_libres) {
                        await pruebas.ejecutarEscenario(escenario);
                    }
                } else {
                    for await (const escenario of escenarios) {
                        const origenUpdatedAt = moment(escenario.canal_origen.updatedAt).format("YYYY-MM-DD HH:mm:ss");
                        const destinoUpdatedAt = escenario.tipo === 'C' ? moment(escenario.destino.updatedAt).format("YYYY-MM-DD HH:mm:ss") : moment();
                        if (moment().diff(origenUpdatedAt,'seconds') > 180){
                            // console.log('origenUpdatedAt');
                            escenario.canal_origen.update({
                                estado_llamada: 'LIBRE'
                            });
                        }
                        if (moment().diff(destinoUpdatedAt,'seconds') > 180){
                            //console.log('destinoUpdatedAt');
                            escenario.destino.update({
                                estado_llamada: 'LIBRE'
                            });
                        }
                    }
                }
            } else {
                escenarios = await Escenario.findAll(
                    {
                        where: {
                            id_ejecucion: ejecucion.id_ejecucion,
                            estado: 'PENDIENTE'
                        }
                    }
                )
                //console.log(`ejecucion ${ejecucion.id_ejecucion}: escenarios ${escenarios.length}`);
                if(escenarios.length == 0){
                    await Ejecucion.update(
                        {
                            estado: 'FINALIZADO',
                            fecha_fin: fecha_actual
                        }, 
                        {
                            where: {
                                id_ejecucion: ejecucion.id_ejecucion
                            }
                        });
                    ejecucionService.sendEjecutionByMail(ejecucion.id_ejecucion);
                }
            }
        }
    }
}, {
    scheduled: true,
    timezone: "America/Lima"
});
////////////////////////////////////////////
