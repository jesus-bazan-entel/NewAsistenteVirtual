const db = require("../models");
const Operador = db.operadortelefonico;
const v = require('validator');

exports.obtenerTodos = async (_req, res) => {
    try {
        const operadores = await Operador.findAll({
            include: ["tecnologias"]
        })
        return res.status(200).json({
            estado: true,
            operadores
        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            error: "Error al obtener los operadores."
        })
    }
};

exports.crear = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const nombre = v.escape(req.body.nombre);
        const codigo = v.escape(req.body.codigo || '');

        const datos_operador = {
            nombre: nombre,
            codigo: codigo
        }
        const operador = await Operador.create(datos_operador, {
            transaction: t
        })

        // Agregar tecnologías si se enviaron
        if (req.body.tecnologias && req.body.tecnologias.length > 0) {
            await operador.addTecnologias(req.body.tecnologias, {
                transaction: t
            })
        }

        await t.commit();
        return res.status(201).json({
            estado: true,
            mensaje: "Se creó correctamente el operador.",
            data: operador
        })
    } catch (error) {
        await t.rollback();
        console.log(error.message);
        return res.status(500).json({
            error: "Error al crear el operador."
        })
    }
};

exports.buscarUno = async (req, res) => {
    try {
        const id_operador_telefonico = req.params.id_operador_telefonico
        const operador = await Operador.findOne({
            where: {
                id_operador_telefonico: id_operador_telefonico
            },
            include: ["tecnologias"]
        })
        if (operador) {
            return res.status(200).json({
                estado: true,
                operador
            })
        }
        return res.status(404).send('El operador con el ID especificado no existe')
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            error: "Error al obtener el operador."
        })
    }
};

exports.actualizar = async (req, res) => {
    const nombre = v.escape(req.body.nombre);
    const codigo = v.escape(req.body.codigo);
    const newBody={
        codigo:codigo,
        nombre:nombre,
        tecnologias:req.body.tecnologias
    }
    try {
        
        const id_operador_telefonico = req.params.id_operador_telefonico
        const tecnologias = req.body.tecnologias
        const operador = await Operador.findOne({
            where: {
                id_operador_telefonico: id_operador_telefonico
            },
            include: ["tecnologias"]
        })
        if (operador) {
            await Operador.update(newBody, {
                where: {
                    id_operador_telefonico: id_operador_telefonico
                }
            })
            /**Proceso para agregar y eliminar tecnologias que pertenecen a un operador telefonico */
            const tecnologiasArrayId = operador.tecnologias.map((x) => x.id_tecnologia)
            const tecnologiasAgregar = tecnologias.filter(x => !tecnologiasArrayId.includes(x))
            const tecnologiasEliminar = tecnologiasArrayId.filter(x => !tecnologias.includes(x))
            await operador.addTecnologias(tecnologiasAgregar)
            await operador.removeTecnologias(tecnologiasEliminar)
            /**---------------------------------------------------------------------- */
            return res.status(200).json({
                estado: true,
                mensaje: "Se actualizó correctamente el operador"
            })
        }
        return res.status(404).send('El operador con el ID especificado no existe')
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({
            error: "Error al actualizar el operador."
        })
    }
};

exports.eliminar = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const id_operador_telefonico = req.params.id_operador_telefonico
        const operador = await Operador.findOne({
            where: {
                id_operador_telefonico: id_operador_telefonico
            },
            include: ["tecnologias"]
        })
        if (!operador) {
            await t.rollback();
            return res.status(404).json({
                error: "El operador no existe."
            })
        }
        const tecnologiasArrayId = operador.tecnologias.map((x) => x.id_tecnologia)
        await operador.removeTecnologias(tecnologiasArrayId, {
            transaction: t
        })
        await Operador.destroy({
            where: {
                id_operador_telefonico: id_operador_telefonico
            },
            force: true,
            transaction: t
        })
        await t.commit();
        return res.status(200).json({
            estado: true,
            mensaje: "Se eliminó correctamente el operador."
        })
    } catch (error) {
        await t.rollback();
        console.log(error.message);
        // Detectar error de foreign key constraint
        if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
            return res.status(400).json({
                error: "No se puede eliminar el operador porque está siendo utilizado por otros registros (canales, etc.)."
            })
        }
        return res.status(500).json({
            error: "Error al eliminar el operador."
        })
    }
};
