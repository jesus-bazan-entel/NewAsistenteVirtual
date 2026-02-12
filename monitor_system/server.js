'use strict';

require('dotenv').config();
var config = require('./config/config'),
    express = require("express"),
    cors = require("cors"),
    AsteriskService = require('./app/services/asterisk.server.service');

var asteriskService = AsteriskService.create({
    params: config.asterisk,
    user: {}
});

const db = require("./app/models");
const runSeeder = require("./app/seeders/initialData");

async function waitForDatabase(maxRetries = 15, delay = 3000) {
    for (let i = 1; i <= maxRetries; i++) {
        try {
            await db.sequelize.authenticate();
            console.log('Database connection established.');
            return;
        } catch (err) {
            console.log(`Waiting for database... attempt ${i}/${maxRetries}`);
            if (i === maxRetries) throw err;
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

async function startServer() {
    try {
        // Wait for database to be ready
        await waitForDatabase();

        // Sync database (creates tables for SQLite)
        await db.sync();

        // Run seeder to populate initial data
        await runSeeder(db);

        const app = express();
        app.use(cors());
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        require("./app/routes")(app, asteriskService);

        // CRON: pruebas programadas (disabled for now - requires Asterisk)
        // const pruebasProgramadasJob = require("./app/crons/pruebasProgramadasJob");
        // pruebasProgramadasJob.start();

        const PORT = process.env.PORT || 8082;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
            console.log(`Database: ${db.sequelize.options.dialect}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();