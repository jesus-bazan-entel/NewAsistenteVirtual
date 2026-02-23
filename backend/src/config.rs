use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration_hours: i64,

    // Asterisk AMI
    pub asterisk_host: String,
    pub asterisk_port: u16,
    pub asterisk_user: String,
    pub asterisk_password: String,
    pub asterisk_env: String,
    pub asterisk_config_path: String,

    // SMTP
    pub smtp_host: String,
    pub smtp_port: u16,

    // SFTP
    pub ftp_host: String,
    pub ftp_user: String,
    pub ftp_password: String,

    // LDAP
    pub ldap_host: String,
    pub ldap_bind_dn: String,
    pub ldap_base_dn: String,
    pub ldap_base_user: String,
    pub ldap_timeout: u64,

    pub default_perfil: Option<i32>,

    // CORS
    pub frontend_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .unwrap_or(3000),
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://platform:platform@localhost:5432/asistente_virtual".to_string()),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "super-secret-jwt-key-change-in-production".to_string()),
            jwt_expiration_hours: env::var("JWT_EXPIRATION_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()
                .unwrap_or(24),

            asterisk_host: env::var("ASTERISK_HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            asterisk_port: env::var("ASTERISK_PORT")
                .unwrap_or_else(|_| "5038".to_string())
                .parse()
                .unwrap_or(5038),
            asterisk_user: env::var("ASTERISK_USER").unwrap_or_else(|_| "admin".to_string()),
            asterisk_password: env::var("ASTERISK_PASSWORD").unwrap_or_else(|_| "admin".to_string()),
            asterisk_env: env::var("ASTERISK_ENV").unwrap_or_else(|_| "local".to_string()),
            asterisk_config_path: env::var("ASTERISK_CONFIG_PATH")
                .unwrap_or_else(|_| "/opt/AsistenteVirtual/docker/data/asterisk".to_string()),

            smtp_host: env::var("SMTP_HOST").unwrap_or_else(|_| "localhost".to_string()),
            smtp_port: env::var("SMTP_PORT")
                .unwrap_or_else(|_| "25".to_string())
                .parse()
                .unwrap_or(25),

            ftp_host: env::var("FTP_HOST").unwrap_or_else(|_| "".to_string()),
            ftp_user: env::var("FTP_USER").unwrap_or_else(|_| "".to_string()),
            ftp_password: env::var("FTP_PWD").unwrap_or_else(|_| "".to_string()),

            ldap_host: env::var("LDAP_HOST").unwrap_or_else(|_| "".to_string()),
            ldap_bind_dn: env::var("LDAP_BIND_DN").unwrap_or_else(|_| "".to_string()),
            ldap_base_dn: env::var("LDAP_BASE_DN").unwrap_or_else(|_| "".to_string()),
            ldap_base_user: env::var("LDAP_BASE_USER").unwrap_or_else(|_| "".to_string()),
            ldap_timeout: env::var("LDAP_TIMEOUT")
                .unwrap_or_else(|_| "5000".to_string())
                .parse()
                .unwrap_or(5000),

            default_perfil: env::var("DEFAULT_PERFIL")
                .ok()
                .and_then(|v| v.parse().ok()),

            frontend_url: env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),
        }
    }
}
