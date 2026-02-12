module.exports = (app, asteriskService = null) => {
    // ruta default
    app.get("/", (_req, res) => {
        res.json({ message: "Aplicación creada por NEWIP" })
    })

    // Health check para Docker
    app.get("/api/health", (_req, res) => {
        res.status(200).json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        })
    })
    require("./RegistroClave.routes")(app);
    require("./Perfil.routes")(app);
    require("./Usuario.routes")(app);
    require("./Modulo.routes")(app);
    require("./Equipo.routes")(app, asteriskService);
    require("./Sede.routes")(app);
    require("./Canal.routes")(app);
    require("./OperadorTelefonico.routes")(app);
    require("./Tecnologia.routes")(app);
    require("./NumeroExterno.routes")(app);
    require("./Matriz.routes")(app);
    require("./Prueba.routes")(app, asteriskService);
    require("./Ejecucion.routes")(app);
}