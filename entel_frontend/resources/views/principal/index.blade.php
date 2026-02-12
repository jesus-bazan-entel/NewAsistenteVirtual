@extends('layout.principal')
@section('tituloModulo', '')
@section('css')
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
    :root {
        --primary-gradient: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffb347 100%);
        --dark-bg: #0a0a0f;
        --card-bg: rgba(255, 255, 255, 0.03);
        --card-border: rgba(255, 255, 255, 0.08);
        --text-primary: #ffffff;
        --text-secondary: rgba(255, 255, 255, 0.6);
        --accent-orange: #ff6b35;
        --accent-amber: #f7931e;
        --glow-orange: rgba(255, 107, 53, 0.4);
    }

    .content-wrapper {
        background: var(--dark-bg) !important;
        min-height: 100vh;
        position: relative;
        overflow: hidden;
    }

    .content-wrapper::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background:
            radial-gradient(ellipse at 20% 20%, rgba(255, 107, 53, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(247, 147, 30, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(255, 179, 71, 0.05) 0%, transparent 70%);
        pointer-events: none;
        animation: meshMove 20s ease-in-out infinite;
    }

    @keyframes meshMove {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        33% { transform: translate(2%, 2%) rotate(1deg); }
        66% { transform: translate(-1%, 1%) rotate(-1deg); }
    }

    .content-header {
        position: relative;
        z-index: 1;
    }

    .content-header h1 {
        display: none;
    }

    .dashboard-container {
        position: relative;
        z-index: 1;
        padding: 0 1.5rem 2rem;
    }

    /* Hero Section */
    .dashboard-hero {
        margin-bottom: 3rem;
        padding: 2.5rem 0 1rem;
    }

    .dashboard-hero h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 3rem;
        font-weight: 800;
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.5rem;
        letter-spacing: -0.02em;
    }

    .dashboard-hero p {
        font-family: 'Outfit', sans-serif;
        font-size: 1.1rem;
        color: var(--text-secondary);
        font-weight: 300;
    }

    .dashboard-time {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.85rem;
        color: var(--accent-orange);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .dashboard-time::before {
        content: '';
        width: 8px;
        height: 8px;
        background: var(--accent-orange);
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; box-shadow: 0 0 0 0 var(--glow-orange); }
        50% { opacity: 0.7; box-shadow: 0 0 0 8px transparent; }
    }

    /* Module Grid */
    .module-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    /* Module Cards */
    .module-card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 20px;
        padding: 2rem;
        position: relative;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
    }

    .module-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--primary-gradient);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .module-card:hover {
        transform: translateY(-4px);
        border-color: rgba(255, 107, 53, 0.3);
        box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 0 60px rgba(255, 107, 53, 0.1);
    }

    .module-card:hover::before {
        opacity: 1;
    }

    .module-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .module-icon {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: #fff;
        flex-shrink: 0;
        position: relative;
    }

    .module-icon.config {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
    }

    .module-icon.advanced {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        box-shadow: 0 8px 24px rgba(20, 184, 166, 0.3);
    }

    .module-icon.tests {
        background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
        box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
    }

    .module-icon.reports {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
    }

    .module-icon.disa {
        background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
        box-shadow: 0 8px 24px rgba(236, 72, 153, 0.3);
    }

    .module-title {
        font-family: 'Outfit', sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
    }

    .module-subtitle {
        font-family: 'Outfit', sans-serif;
        font-size: 0.85rem;
        color: var(--text-secondary);
        font-weight: 400;
    }

    /* Module Links */
    .module-links {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .module-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-radius: 12px;
        color: var(--text-secondary);
        text-decoration: none;
        font-family: 'Outfit', sans-serif;
        font-size: 0.95rem;
        font-weight: 400;
        transition: all 0.25s ease;
        position: relative;
        overflow: hidden;
    }

    .module-link::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--primary-gradient);
        opacity: 0;
        transition: opacity 0.25s ease;
    }

    .module-link:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        padding-left: 1.25rem;
    }

    .module-link:hover::before {
        opacity: 1;
    }

    .module-link i {
        font-size: 0.75rem;
        opacity: 0.5;
        transition: all 0.25s ease;
    }

    .module-link:hover i {
        opacity: 1;
        color: var(--accent-orange);
    }

    .link-arrow {
        margin-left: auto;
        opacity: 0;
        transform: translateX(-8px);
        transition: all 0.25s ease;
        font-size: 0.85rem !important;
    }

    .module-link:hover .link-arrow {
        opacity: 0.6;
        transform: translateX(0);
    }

    /* Stats Row */
    .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 16px;
        padding: 1.5rem;
        backdrop-filter: blur(10px);
    }

    .stat-label {
        font-family: 'Outfit', sans-serif;
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
    }

    .stat-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 2rem;
        font-weight: 500;
        color: var(--text-primary);
    }

    .stat-value.highlight {
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    /* Quick Actions */
    .quick-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .quick-action-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        background: var(--primary-gradient);
        border: none;
        border-radius: 12px;
        color: #fff;
        font-family: 'Outfit', sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px var(--glow-orange);
    }

    .quick-action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px var(--glow-orange);
        color: #fff;
    }

    .quick-action-btn.secondary {
        background: transparent;
        border: 1px solid var(--card-border);
        box-shadow: none;
        color: var(--text-secondary);
    }

    .quick-action-btn.secondary:hover {
        border-color: var(--accent-orange);
        color: var(--text-primary);
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.2);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .dashboard-hero h1 {
            font-size: 2rem;
        }

        .module-grid {
            grid-template-columns: 1fr;
        }

        .module-card {
            padding: 1.5rem;
        }
    }

    /* Animation Delays */
    .module-card:nth-child(1) { animation: fadeInUp 0.6s ease-out 0.1s both; }
    .module-card:nth-child(2) { animation: fadeInUp 0.6s ease-out 0.2s both; }
    .module-card:nth-child(3) { animation: fadeInUp 0.6s ease-out 0.3s both; }
    .module-card:nth-child(4) { animation: fadeInUp 0.6s ease-out 0.4s both; }
    .module-card:nth-child(5) { animation: fadeInUp 0.6s ease-out 0.5s both; }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
@endsection

@section('contenido')
<div class="dashboard-container">
    <!-- Hero Section -->
    <div class="dashboard-hero">
        <h1>Centro de Control</h1>
        <p>Sistema de monitoreo y pruebas de telecomunicaciones</p>
        <div class="dashboard-time" id="currentTime"></div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions" style="margin-bottom: 2rem;">
        <a href="{{ route('pruebas') }}" class="quick-action-btn">
            <i class="fas fa-play"></i>
            Lanzar Prueba
        </a>
        <a href="{{ route('reporte_prueba') }}" class="quick-action-btn secondary">
            <i class="fas fa-chart-line"></i>
            Ver Reportes
        </a>
    </div>

    <!-- Module Grid -->
    <div class="module-grid">
        <!-- Configuración General -->
        <div class="module-card">
            <div class="module-header">
                <div class="module-icon config">
                    <i class="fas fa-users-cog"></i>
                </div>
                <div>
                    <div class="module-title">Configuración General</div>
                    <div class="module-subtitle">Usuarios, perfiles y accesos</div>
                </div>
            </div>
            <div class="module-links">
                <a href="{{ route('usuarios') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Gestión de Usuarios
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
                <a href="{{ route('perfiles') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Gestión de Perfiles
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
            </div>
        </div>

        <!-- Configuraciones Avanzadas -->
        <div class="module-card">
            <div class="module-header">
                <div class="module-icon advanced">
                    <i class="fas fa-sliders-h"></i>
                </div>
                <div>
                    <div class="module-title">Configuraciones</div>
                    <div class="module-subtitle">Tecnologías y equipos</div>
                </div>
            </div>
            <div class="module-links">
                <a href="{{ route('tecnologias') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Tecnologías
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
                <a href="{{ route('operadores') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Operadores Telefónicos
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
                <a href="{{ route('equipos') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Equipos
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
                <a href="{{ route('numeros_externos') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Números Externos
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
            </div>
        </div>

        <!-- Generador de Pruebas -->
        <div class="module-card">
            <div class="module-header">
                <div class="module-icon tests">
                    <i class="fas fa-vial"></i>
                </div>
                <div>
                    <div class="module-title">Generador de Pruebas</div>
                    <div class="module-subtitle">Matrices y ejecución</div>
                </div>
            </div>
            <div class="module-links">
                <a href="{{ route('matrices') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Matrices
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
                <a href="{{ route('pruebas') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Lanzador de Pruebas
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
            </div>
        </div>

        <!-- Reportes -->
        <div class="module-card">
            <div class="module-header">
                <div class="module-icon reports">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <div>
                    <div class="module-title">Reportes</div>
                    <div class="module-subtitle">Análisis y métricas</div>
                </div>
            </div>
            <div class="module-links">
                <a href="{{ route('reporte_prueba') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Reporte de Prueba
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
                <a href="{{ route('reporte_disa') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Reporte DISA
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
            </div>
        </div>

        <!-- DISA -->
        <div class="module-card">
            <div class="module-header">
                <div class="module-icon disa">
                    <i class="fas fa-key"></i>
                </div>
                <div>
                    <div class="module-title">DISA</div>
                    <div class="module-subtitle">Gestión de accesos</div>
                </div>
            </div>
            <div class="module-links">
                <a href="{{ route('registro_clave') }}" class="module-link">
                    <i class="fas fa-circle"></i>
                    Registro de Clave
                    <i class="fas fa-arrow-right link-arrow"></i>
                </a>
            </div>
        </div>
    </div>
</div>
@endsection

@section('javascript')
<script>
    function updateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        const timeString = now.toLocaleDateString('es-PE', options);
        document.getElementById('currentTime').textContent = timeString.charAt(0).toUpperCase() + timeString.slice(1);
    }

    updateTime();
    setInterval(updateTime, 1000);
</script>
@endsection
