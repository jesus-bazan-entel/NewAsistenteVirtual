module.exports = (sequelize, Sequelize) => {
    const CredencialApi = sequelize.define("credenciales_api", {
        id_credencial_api: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        usuario: {
            type: Sequelize.STRING(45),
            allowNull: false
        },
        clave: {
            type: Sequelize.STRING(45),
            allowNull: false
        },
        estado: {
            type: Sequelize.ENUM('A', 'D'),
            allowNull: false
        }
    }, {
        timestamps: false
    });
    return CredencialApi;
};
