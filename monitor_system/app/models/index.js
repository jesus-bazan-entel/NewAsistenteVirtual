const dbConfig = require("../config/db.config.js");
const path = require("path");
const fs = require("fs");

const Sequelize = require("sequelize");

// Base Sequelize configuration
const configSequelize = {
    dialect: dbConfig.dialect,
    logging: false,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
};

// Dialect-specific configuration
if (dbConfig.dialect === 'sqlite') {
    // Ensure data directory exists
    const dataDir = path.dirname(dbConfig.storage);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    configSequelize.storage = dbConfig.storage;
} else {
    // MySQL, MariaDB, PostgreSQL
    if (dbConfig.HOST) configSequelize.host = dbConfig.HOST;
    if (dbConfig.PORT) configSequelize.port = dbConfig.PORT;

    if (dbConfig.dialect === 'mysql' || dbConfig.dialect === 'mariadb') {
        configSequelize.dialectOptions = {
            dateStrings: true,
            typeCast: true,
            timezone: "local",
        };
        configSequelize.timezone = 'America/Lima';
    } else if (dbConfig.dialect === 'postgres') {
        configSequelize.timezone = 'America/Lima';
    }
}

// Create Sequelize instance based on dialect
let sequelize;
if (dbConfig.dialect === 'sqlite') {
    sequelize = new Sequelize(configSequelize);
} else {
    sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, configSequelize);
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.connect = async function() {
    try {
        console.log('start connect');
        await this.sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

db.connect();
//Modelos
//Disa
db.registroclave = require("./RegistroClave.js")(sequelize, Sequelize)
db.canalclave = require("./CanalClave.model.js")(sequelize, Sequelize)
//Configuracion General
db.perfil = require("./Perfil.model.js")(sequelize, Sequelize)
db.usuario = require("./Usuario.model.js")(sequelize, Sequelize)
db.submodulo = require("./Submodulo.model.js")(sequelize, Sequelize)
db.modulo = require("./Modulo.model.js")(sequelize, Sequelize)
db.perfilsubmodulo = require("./PerfilSubmodulo.model.js")(sequelize, Sequelize)
//Configuraciones Avanzadas
db.tecnologia = require("./Tecnologia.model.js")(sequelize, Sequelize)
db.operadortelefonico = require("./OperadorTelefonico.model.js")(sequelize, Sequelize)
db.equipo = require("./Equipo.model.js")(sequelize, Sequelize)
db.sede = require("./Sede.model.js")(sequelize, Sequelize)
db.canal = require("./Canal.model.js")(sequelize, Sequelize)
db.tecnologiaoperador = require("./TecnologiaOperador.model.js")(sequelize, Sequelize)
db.numeroexterno = require("./Numeroexterno.model.js")(sequelize, Sequelize)
db.matriz = require("./Matriz.model.js")(sequelize, Sequelize)
db.matriz_canal_destino = require("./MatrizCanalDestino.model.js")(sequelize, Sequelize)
db.prueba = require("./Prueba.model.js")(sequelize, Sequelize)
db.error = require("./Error.model.js")(sequelize, Sequelize)
db.ejecucion = require("./Ejecucion.model.js")(sequelize, Sequelize)
db.escenario = require("./Escenario.model.js")(sequelize, Sequelize)
//Configuracion API y LDAP
db.credencialapi = require("./CredencialApi.model.js")(sequelize, Sequelize)
db.ldapconfig = require("./LdapConfig.model.js")(sequelize, Sequelize)

//Relaciones
db.usuario.belongsTo(db.perfil, {
    foreignKey: "id_perfil",
    as: "perfil"
})
db.perfil.belongsToMany(db.submodulo, {
    through: db.perfilsubmodulo,
    foreignKey: 'id_perfil',
    as: 'submodulos'
})
db.perfil.hasMany(db.usuario, {
    foreignKey: "id_perfil",
    as: "usuarios"
})
db.submodulo.belongsToMany(db.perfil, {
    through: db.perfilsubmodulo,
    foreignKey: 'id_submodulo',
    as: 'perfiles'
})
db.tecnologia.belongsToMany(db.operadortelefonico, {
    through: db.tecnologiaoperador,
    foreignKey: 'id_tecnologia',
    otherKey: 'id_operador_telefonico',
    uniqueKey: 'tec_op_unique',
    as: 'operadores'
})
db.operadortelefonico.belongsToMany(db.tecnologia, {
    through: db.tecnologiaoperador,
    foreignKey: 'id_operador_telefonico',
    otherKey: 'id_tecnologia',
    uniqueKey: 'tec_op_unique',
    as: 'tecnologias'
})
db.equipo.hasMany(db.canal, {
    foreignKey: "id_equipo",
    as: "canales"
})
db.equipo.belongsTo(db.sede, {
    foreignKey: "id_sede",
    as: "sede"
})
db.modulo.hasMany(db.submodulo, {
    foreignKey: "id_modulo",
    as: "submodulos"
})
db.prueba.belongsTo(db.matriz, {
    as: 'matriz',
    foreignKey: 'id_matriz'
})
db.canal.belongsTo(db.equipo, {
    as: 'equipo',
    foreignKey: "id_equipo"
})
db.registroclave.belongsToMany(db.canal, {
    through: db.canalclave,
    foreignKey: 'id_registro_clave',
    as: 'canales'
})
db.canal.belongsToMany(db.registroclave, {
    through: db.canalclave,
    foreignKey: 'id_canal',
    as: 'registros'
})
db.canal.belongsTo(db.tecnologiaoperador, {
    as: 'tecnologia_operador',
    foreignKey: 'id_tecnologia_operador'
})
db.ejecucion.belongsTo(db.prueba, {
    foreignKey: "id_prueba",
    as: "prueba"
})
db.escenario.belongsTo(db.error, {
    foreignKey: "id_error",
    as: "error"
})
db.ejecucion.hasMany(db.escenario, {
    foreignKey: "id_ejecucion",
    as: "escenarios"
})
db.prueba.belongsTo(db.usuario, {
    as: 'usuario',
    foreignKey: 'id_usuario'
})
db.matriz_canal_destino.belongsTo(db.canal, {
    as: 'canal_origen',
    foreignKey: 'id_canal_origen'
})
db.matriz_canal_destino.belongsTo(db.canal, {
    as: 'canal_destino',
    foreignKey: 'id_canal_destino'
})
db.escenario.belongsTo(db.canal, {
    as: 'destino',
    foreignKey: 'id_destino'
})
db.escenario.belongsTo(db.canal, {
    as: 'canal_origen',
    foreignKey: 'id_canal_origen'
})
db.matriz_canal_destino.belongsTo(db.numeroexterno, {
    as: 'numero_externo',
    constraints: false,
    foreignKey: 'id_numero_externo_destino',
})
db.escenario.belongsTo(db.numeroexterno, {
    as: 'numero_externo',
    constraints: false,
    foreignKey: 'id_destino',
})
db.matriz.hasMany(db.matriz_canal_destino, {
    foreignKey: 'id_matriz',
    as: 'conexiones'
})
db.tecnologiaoperador.belongsTo(db.tecnologia, {
    as: 'tecnologia',
    foreignKey: 'id_tecnologia'
})
db.tecnologiaoperador.belongsTo(db.operadortelefonico, {
    as: 'operador',
    foreignKey: 'id_operador_telefonico'
})
db.prueba.hasMany(db.ejecucion, {
    foreignKey: "id_prueba",
    as: "ejecuciones"
})

db.sync = async (options = {}) => {
    try {
        console.log(`dbSync: iniciando (dialect: ${dbConfig.dialect})`);

        // For MySQL/MariaDB, use alter:true to create tables if they don't exist
        if (dbConfig.dialect === 'mysql' || dbConfig.dialect === 'mariadb') {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
            await db.sequelize.sync({ alter: true, ...options });
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
            console.log('dbSync: tablas creadas/sincronizadas (MySQL)');
        } else {
            // For SQLite and others
            await db.sequelize.sync(options);
            console.log('dbSync: tablas creadas/sincronizadas');
        }
        console.log('dbSync: finalizada');
    } catch (e) {
        console.error('dbSync error:', e);
    }
};

module.exports = db
