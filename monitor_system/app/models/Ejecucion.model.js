var moment = require('moment')
module.exports = (sequelize, Sequelize) => {
    return sequelize.define("ejecuciones", {
        id_ejecucion: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            unique: true,
            primaryKey: true
        },
        numero_prueba: {
            type: Sequelize.INTEGER
        },
        fecha_inicio: {
            type: Sequelize.DATE,
            get: function() {
                return moment(this.getDataValue('fecha_inicio')).format('YYYY-MM-DD HH:mm:ss A')
            }
        },
        fecha_fin: {
            type: Sequelize.DATE
        },
        estado: {
            type: Sequelize.STRING
        },
        id_prueba: {
            type: Sequelize.INTEGER
        },
        createdAt: {
            type: Sequelize.DATE,
        },
        updatedAt: {
            type: Sequelize.DATE,
        }
    }, {
        paranoid: true,
    });
};
