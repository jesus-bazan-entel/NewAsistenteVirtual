-- ============================================
-- Script de inicializacion MySQL
-- ============================================
-- Este script se ejecuta automaticamente cuando
-- el contenedor MySQL se inicia por primera vez
-- ============================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS db_entel
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE db_entel;

-- Mensaje de confirmacion
SELECT 'Base de datos db_entel inicializada correctamente' AS mensaje;
