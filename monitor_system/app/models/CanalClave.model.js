module.exports = (sequelize, Sequelize) => {
    return sequelize.define("canales_claves", {
        id_canal: {
            type: Sequelize.INTEGER
        },
        id_registro_clave: {
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
