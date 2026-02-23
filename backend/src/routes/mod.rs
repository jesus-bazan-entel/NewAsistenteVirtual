pub mod sedes;
pub mod modulos;
pub mod tecnologias;
pub mod operadores;
pub mod perfiles;
pub mod usuarios;
pub mod numeros_externos;
pub mod equipos;
pub mod canales;
pub mod matrices;
pub mod pruebas;
pub mod ejecuciones;
pub mod registro_clave;
pub mod ldap_config;
pub mod asterisk_config;

use std::sync::Arc;

use axum::{
    routing::{get, post, put},
    Json, Router,
};
use serde_json::{json, Value};

use crate::error::AppResult;
use crate::AppState;

/// Health check handler
async fn health_check() -> AppResult<Json<Value>> {
    Ok(Json(json!({
        "estado": true,
        "mensaje": "API en funcionamiento"
    })))
}

/// Build the complete application router with all routes.
pub fn create_router(state: Arc<AppState>) -> Router {
    // Auth routes
    let auth_routes = Router::new()
        .route("/login", post(crate::auth::handlers::login));

    // Sedes routes
    let sedes_routes = Router::new()
        .route("/", get(sedes::obtener_todos));

    // Modulos routes
    let modulos_routes = Router::new()
        .route("/", get(modulos::obtener_todos));

    // Tecnologias routes
    let tecnologias_routes = Router::new()
        .route("/", get(tecnologias::obtener_todos).post(tecnologias::crear))
        .route(
            "/:id",
            get(tecnologias::buscar_uno)
                .put(tecnologias::actualizar)
                .delete(tecnologias::eliminar),
        );

    // Operadores routes
    let operadores_routes = Router::new()
        .route("/", get(operadores::obtener_todos).post(operadores::crear))
        .route(
            "/:id",
            get(operadores::buscar_uno)
                .put(operadores::actualizar)
                .delete(operadores::eliminar),
        );

    // Perfiles routes
    let perfiles_routes = Router::new()
        .route("/", get(perfiles::obtener_todos).post(perfiles::crear))
        .route(
            "/:id",
            get(perfiles::buscar_uno)
                .put(perfiles::actualizar)
                .delete(perfiles::eliminar),
        );

    // Usuarios routes
    let usuarios_routes = Router::new()
        .route("/", get(usuarios::obtener_todos).post(usuarios::crear))
        .route(
            "/:id",
            get(usuarios::buscar_uno)
                .put(usuarios::actualizar)
                .delete(usuarios::eliminar),
        );

    // Numeros externos routes
    let numeros_externos_routes = Router::new()
        .route(
            "/",
            get(numeros_externos::obtener_todos).post(numeros_externos::crear),
        )
        .route(
            "/:id",
            get(numeros_externos::buscar_uno)
                .put(numeros_externos::actualizar)
                .delete(numeros_externos::eliminar),
        );

    // Equipos routes
    let equipos_routes = Router::new()
        .route("/", get(equipos::obtener_todos).post(equipos::crear))
        .route(
            "/:id",
            get(equipos::buscar_uno)
                .put(equipos::actualizar)
                .delete(equipos::eliminar),
        );

    // Canales routes
    let canales_routes = Router::new()
        .route("/", get(canales::obtener_todos))
        .route(
            "/:id",
            get(canales::obtener_uno).put(canales::actualizar),
        );

    // Matrices routes
    let matrices_routes = Router::new()
        .route("/", get(matrices::obtener_todos).post(matrices::crear))
        .route(
            "/:id",
            get(matrices::buscar_uno)
                .put(matrices::actualizar)
                .delete(matrices::eliminar),
        );

    // Pruebas routes
    let pruebas_routes = Router::new()
        .route("/", get(pruebas::obtener_todos).post(pruebas::crear))
        .route("/ejecutar/c2c", post(pruebas::canal_hacia_canal))
        .route("/ejecutar/matriz", post(pruebas::ejecutar_matriz))
        .route(
            "/:id",
            get(pruebas::buscar_uno)
                .put(pruebas::actualizar)
                .delete(pruebas::eliminar),
        )
        .route("/:id/ejecutar", post(pruebas::ejecutar_prueba))
        .route("/:id/ultima-ejecucion", get(pruebas::ultima_ejecucion));

    // Ejecuciones routes
    let ejecuciones_routes = Router::new()
        .route("/", get(ejecuciones::obtener_todos))
        .route("/:id", get(ejecuciones::buscar_uno))
        .route("/:id/escenarios", get(ejecuciones::buscar_escenarios))
        .route("/:id/pdf", get(ejecuciones::download_pdf))
        .route("/:id/reenviar", post(ejecuciones::reenviar_reporte));

    // Registro clave routes
    let registro_clave_routes = Router::new()
        .route(
            "/",
            get(registro_clave::obtener_todos).post(registro_clave::crear),
        )
        .route(
            "/:id",
            get(registro_clave::buscar_uno)
                .put(registro_clave::actualizar)
                .delete(registro_clave::eliminar),
        );

    // LDAP config routes
    let ldap_config_routes = Router::new()
        .route(
            "/",
            get(ldap_config::obtener_todos).post(ldap_config::crear),
        )
        .route(
            "/:id",
            get(ldap_config::buscar_uno)
                .put(ldap_config::actualizar)
                .delete(ldap_config::eliminar),
        );

    // Asterisk config routes
    let asterisk_config_routes = Router::new()
        .route("/", get(asterisk_config::obtener).put(asterisk_config::actualizar))
        .route("/test", post(asterisk_config::test_conexion))
        .route("/reconnect", post(asterisk_config::reconectar))
        .route("/sync", post(asterisk_config::sincronizar))
        .route("/status", get(asterisk_config::estado));

    // Assemble the complete API router
    Router::new()
        .route("/api/health", get(health_check))
        .nest("/api/auth", auth_routes)
        .nest("/api/sedes", sedes_routes)
        .nest("/api/modulos", modulos_routes)
        .nest("/api/tecnologias", tecnologias_routes)
        .nest("/api/operadores-telefonicos", operadores_routes)
        .nest("/api/perfiles", perfiles_routes)
        .nest("/api/usuarios", usuarios_routes)
        .nest("/api/numeros-externos", numeros_externos_routes)
        .nest("/api/equipos", equipos_routes)
        .nest("/api/canales", canales_routes)
        .nest("/api/matrices", matrices_routes)
        .nest("/api/pruebas", pruebas_routes)
        .nest("/api/ejecuciones", ejecuciones_routes)
        .nest("/api/registro-clave", registro_clave_routes)
        .nest("/api/ldap-config", ldap_config_routes)
        .nest("/api/asterisk-config", asterisk_config_routes)
        .with_state(state)
}
