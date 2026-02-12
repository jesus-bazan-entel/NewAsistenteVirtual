module.exports = (sequelize, Sequelize) => {
    const TecnologiaOperador = sequelize.define("tecnologias_operadores", {
        id_tecnologia_operador: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            unique: true,
            primaryKey: true
        },
        id_tecnologia: {
            type: Sequelize.INTEGER
        },
        id_operador_telefonico: {
            type: Sequelize.INTEGER
        }
    }, {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['id_tecnologia', 'id_operador_telefonico'],
                name: 'tec_op_unique'
            }
        ]
    });
    return TecnologiaOperador;
};
