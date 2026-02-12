module.exports = (sequelize, Sequelize) => {
    const LdapConfig = sequelize.define("ldap_config", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        nombre: {
            type: Sequelize.STRING(200),
            allowNull: false
        },
        data: {
            type: Sequelize.TEXT,
            allowNull: false
        }
    }, {
        timestamps: false
    });
    return LdapConfig;
};
