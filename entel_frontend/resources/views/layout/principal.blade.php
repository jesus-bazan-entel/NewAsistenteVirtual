<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Proyecto | Entel</title>
  <link rel="shortcut icon" href="dist/img/entel-logo.png" type="image/x-icon">
  <!-- Tell the browser to be responsive to screen width -->
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Font Awesome -->
  <link rel="stylesheet" href="{{ asset('plugins/fontawesome-free/css/all.min.css')}}">
  <!-- Ionicons -->
  <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
  <!-- Toastr -->
  <link rel="stylesheet" href="{{ asset('plugins/toastr/toastr.min.css')}}">
  <!-- SweetAlert2 -->
  <link rel="stylesheet" href="{{ asset('plugins/sweetalert2/sweetalert2.min.css')}}">
  <!-- DataTables -->
  <link rel="stylesheet" href="{{ asset('plugins/datatables-bs4/css/dataTables.bootstrap4.min.css')}}">
  <link rel="stylesheet" href="{{ asset('plugins/datatables-responsive/css/responsive.bootstrap4.min.css')}}">
  <link rel="stylesheet" href="{{ asset('plugins/datatables-buttons/css/buttons.bootstrap4.min.css')}}">
  <link rel="stylesheet" href="{{ asset('plugins/datatables-rowgroup/css/rowGroup.bootstrap4.min.css')}}">
  <link rel="stylesheet" href="{{ asset('plugins/datatables-select/css/select.dataTables.min.css')}}">
  <!-- Theme style -->
  <link rel="stylesheet" href="{{ asset('dist/css/adminlte.min.css')}}">
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    /* Global Layout Enhancements */
    body {
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Enhanced Sidebar */
    .main-sidebar {
        background: linear-gradient(180deg, #0f0f14 0%, #1a1a24 100%) !important;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }

    .sidebar-dark-primary .nav-sidebar > .nav-item > .nav-link.active {
        background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
        box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
    }

    .brand-link {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        background: rgba(255, 255, 255, 0.02);
    }

    .brand-text {
        font-family: 'Outfit', sans-serif !important;
        font-weight: 600 !important;
    }

    .user-panel {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    }

    .user-panel .info a {
        font-family: 'Outfit', sans-serif;
        font-weight: 500;
    }

    .nav-sidebar .nav-link {
        font-family: 'Outfit', sans-serif;
        font-weight: 400;
        transition: all 0.25s ease;
    }

    .nav-sidebar .nav-link:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .nav-sidebar .nav-treeview > .nav-item > .nav-link.active {
        background: rgba(255, 107, 53, 0.15);
        color: #ff6b35;
    }

    /* Enhanced Navbar */
    .main-header.navbar {
        background: linear-gradient(135deg, #0f0f14 0%, #1a1a24 100%) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .main-header .nav-link,
    .main-header a {
        color: rgba(255, 255, 255, 0.7) !important;
        font-family: 'Outfit', sans-serif;
        transition: color 0.25s ease;
    }

    .main-header .nav-link:hover,
    .main-header a:hover {
        color: #ff6b35 !important;
    }

    /* Enhanced Footer */
    .main-footer {
        background: #0f0f14 !important;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.5);
        font-family: 'Outfit', sans-serif;
    }

    .main-footer a {
        color: #ff6b35 !important;
    }

    /* Card Enhancements for other pages */
    .card {
        border-radius: 12px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .card-header {
        font-family: 'Outfit', sans-serif;
        font-weight: 600;
    }

    /* Button Enhancements */
    .btn-primary {
        background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
        border: none;
        font-family: 'Outfit', sans-serif;
        font-weight: 500;
        transition: all 0.25s ease;
    }

    .btn-primary:hover {
        background: linear-gradient(135deg, #e55a2b 0%, #d9821a 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    }

    /* DataTable Enhancements */
    .dataTables_wrapper {
        font-family: 'Outfit', sans-serif;
    }

    /* Content Header */
    .content-header h1 {
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
    }
  </style>
  @yield('css')
</head>
<body class="hold-transition sidebar-mini text-sm">
<div class="wrapper">
  <!-- Navbar -->
  <nav class="main-header navbar navbar-expand navbar-white navbar-light">
    <!-- Left navbar links -->
    <ul class="navbar-nav">
      <li class="nav-item">
        <a class="nav-link" data-widget="pushmenu" href="#" role="button"><i class="fas fa-bars"></i></a>
      </li>
    </ul>
    <ul class="navbar-nav ml-auto">
        <a href="{{route('cerrar-sesion')}}" >
            <i class="fas fa-power-off mr-2"></i> Cerrar sesión
        </a>
    </ul>
  </nav>
  <!-- /.navbar -->

  <!-- Main Sidebar Container -->
  <aside class="main-sidebar sidebar-dark-primary elevation-4">
    <!-- Brand Logo -->
    <a href="" class="brand-link navbar-primary"> 
      <img src="{{ asset('dist/img/entel-logo.png')}}"
           alt="AdminLTE Logo"
           class="brand-image img-circle elevation-3"
           >
      <span class="brand-text font-weight-light">Entel</span>
    </a>

    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Sidebar user (optional) -->
      <div class="user-panel mt-3 pb-3 mb-3 d-flex">
        <div class="image">
          <img src="{{ asset('dist/img/user2-160x160.jpg')}}" class="img-circle elevation-2" alt="User Image">
        </div>
        <div class="info">
          <a class="d-block">{{Session::get('datos_usuario')['nombres']}} {{Session::get('datos_usuario')['apellidos']}}</a>
        </div>
      </div>

      <!-- Sidebar Menu -->
      <nav class="mt-2">
        <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
          <!-- Add icons to the links using the .nav-icon class
               with font-awesome or any other icon font library -->
            <li class="nav-item ">
                <a href="{{route('principal')}}" class="nav-link">
                    <i class="fas fa-desktop nav-icon"></i>
                    <p>Principal</p>
                </a>
            </li>
            @foreach(Session::get('datos_usuario')['accesos'] as $modulo)
                <li class="nav-item has-treeview {{ Request::is($modulo['ruta']."/*") ? 'menu-open' : '' }}">
                    <a href="#" class="nav-link {{ Request::is($modulo['ruta']."/*") ? 'active' : '' }}">
                        <!--<i class="fas fa-circle nav-icon"></i>-->
                        <i class="{{$modulo['icono']}} nav-icon"></i>
                        <p>
                            {{$modulo['nombre']}}
                            <i class="right fas fa-angle-left"></i>
                        </p>
                    </a>
                    <ul class="nav nav-treeview">
                        @foreach($modulo['submodulos'] as $submodulo)
                            <li class="nav-item">
                                <a href="{{url('')}}/{{$modulo['ruta']}}/{{$submodulo['ruta']}}" class="nav-link {{ Request::is($modulo['ruta']."/".$submodulo['ruta']) ? 'active' : '' }}">
                                    <i class="far fa-circle nav-icon"></i>
                                    <p>{{$submodulo['nombre']}}</p>
                                </a>
                            </li>
                        @endforeach
                    </ul>
                </li>
            @endforeach
        </ul>
      </nav>
      <!-- /.sidebar-menu -->
    </div>
    <!-- /.sidebar -->
  </aside>

  <!-- Content Wrapper. Contains page content -->
  <div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <section class="content-header">
      <div class="container-fluid">
        <div class="row mb-2">
          <div class="col-sm-6">
            <h1>@yield('tituloModulo')</h1>
          </div>
          <!--<div class="col-sm-6">
            <ol class="breadcrumb float-sm-right">
              <li class="breadcrumb-item"><a href="#">Home</a></li>
              <li class="breadcrumb-item active">DataTables</li>
            </ol>
          </div>-->
        </div>
      </div><!-- /.container-fluid -->
    </section>

    <!-- Main content -->
    <section class="content">
        @yield('contenido')
    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  <footer class="main-footer">
    <div class="float-right d-none d-sm-block">
      <b>Version</b> 3.0.3
    </div>
    <!-- <strong>Copyright &copy; 2021 <a href="http://wpnis.newip.pe">NEW IP SOLUTIONS</a>.</strong> Todos los derechos reservados -->
    <strong>Copyright &copy; 2021 <a href="http://bestsol.pe">BESTSOL</a>.</strong> Todos los derechos reservados
  </footer>

  <!-- Control Sidebar -->
  <aside class="control-sidebar control-sidebar-dark">
    <!-- Control sidebar content goes here -->
  </aside>
  <!-- /.control-sidebar -->
</div>
<!-- ./wrapper -->

<!-- jQuery -->
<script src="{{ asset('plugins/jquery/jquery.min.js')}}"></script>
<!-- Bootstrap 4 -->
<script src="{{ asset('plugins/bootstrap/js/bootstrap.bundle.min.js')}}"></script>
<!-- DataTables -->
<script src="{{ asset('plugins/datatables/jquery.dataTables.min.js')}}"></script>
<script src="{{ asset('plugins/datatables-bs4/js/dataTables.bootstrap4.min.js')}}"></script>
<script src="{{ asset('plugins/datatables-responsive/js/dataTables.responsive.min.js')}}"></script>
<script src="{{ asset('plugins/datatables-responsive/js/responsive.bootstrap4.min.js')}}"></script>
<script src="{{ asset('plugins/datatables-buttons/js/dataTables.buttons.min.js')}}"></script>
<script src="{{ asset('plugins/datatables-buttons/js/buttons.bootstrap4.min.js')}}"></script>
<script src="{{ asset('plugins/jszip/jszip.min.js')}}"></script>
<script src="{{ asset('plugins/pdfmake/pdfmake.min.js')}}"></script>
<script src="{{ asset('plugins/pdfmake/vfs_fonts.js')}}"></script>
<script src="{{ asset('plugins/datatables-buttons/js/buttons.html5.min.js')}}"></script>
<script src="{{ asset('plugins/datatables-buttons/js/buttons.print.js')}}"></script>
<script src="{{ asset('plugins/datatables-buttons/js/buttons.colVis.min.js')}}"></script>
<script src="{{ asset('plugins/datatables-rowgroup/js/dataTables.rowGroup.min.js')}}"></script>
<script src="{{ asset('plugins/datatables-select/js/dataTables.select.min.js')}}"></script>
<!-- Toastr -->
<script src="{{ asset('plugins/toastr/toastr.min.js')}}"></script>
<!-- Bootstrap Switch -->
<script src="{{ asset('plugins/bootstrap-switch/js/bootstrap-switch.min.js')}}"></script>
<!-- jquery-validation -->
<script src="{{ asset('plugins/jquery-validation/jquery.validate.min.js') }}"></script>
<script src="{{ asset('plugins/jquery-validation/additional-methods.min.js') }}"></script>
<!-- SweetAlert2 -->
<script src="{{ asset('plugins/sweetalert2/sweetalert2.min.js')}}"></script>
<!-- AdminLTE App -->
<script src="{{ asset('dist/js/adminlte.min.js')}}"></script>
<!-- FLOT CHARTS -->
<script src="{{ asset('plugins/flot-old/jquery.flot.js') }}"></script>
<!-- FLOT RESIZE PLUGIN - allows the chart to redraw when the window is resized -->
<script src="{{ asset('plugins/flot-old/jquery.flot.resize.js') }}"></script>
<!-- FLOT PIE PLUGIN - also used to draw donut charts -->
<script src="{{ asset('plugins/flot-old/jquery.flot.pie.js') }}"></script>
<!-- AdminLTE for demo purposes -->
<script src="{{ asset('dist/js/demo.js')}}"></script>
<!-- Datos de api -->
<script src="{{ asset('plugins/pdf/jspdf.min.js') }}"></script>
<script src="{{ asset('plugins/pdf/jspdf.plugin.autotable.min.js') }}"></script>
<script>
    // var url_perfiles = "{{config('app.api_url')}}perfiles";
    // var url_modulos = "{{config('app.api_url')}}modulos";
    var url_modulos = "{{route('api_modulos')}}";
    // var url_usuarios = "{{config('app.api_url')}}usuarios";
    var url_usuarios = "{{route('api_usuarios')}}";
    var url_perfiles = "{{route('api_perfiles')}}";
   
    // var url_tecnologias = "{{config('app.api_url')}}tecnologias";
    var url_tecnologias = "{{route('api_tecnologias')}}";
    // var url_operadores = "{{config('app.api_url')}}operadores-telefonicos";
    var url_operadores = "{{route('api_operadores')}}";
    // var url_externos = "{{config('app.api_url')}}numeros-externos";
    var url_externos = "{{route('api_numeros_externos')}}";
    // var url_equipos = "{{config('app.api_url')}}equipos";
    var url_equipos = "{{route('api_equipos')}}";
    // var url_matrices = "{{config('app.api_url')}}matrices";
    var url_matrices = "{{route('api_matrices')}}";
    // var url_pruebas = "{{config('app.api_url')}}pruebas";
    var url_pruebas = "{{route('api_lanzador_pruebas')}}";

    // var url_registro_clave = "{{config('app.api_url')}}registro-clave";
    var url_registro_clave = "{{route('api_registro')}}";
    // var url_canales = "{{config('app.api_url')}}canales";
    var url_canales = "{{route('api_canales')}}";
    // var url_sedes = "{{config('app.api_url')}}sedes";
    var url_sedes = "{{route('api_sedes')}}";
    // var url_ejecuciones = "{{config('app.api_url')}}ejecuciones";api_ejecuciones
    var url_ejecuciones = "{{route('api_ejecuciones')}}";
    // var url_pdf = "{{config('app.api_url')}}ejecuciones/test_pdf";api_pdf
    var url_pdf = "{{route('api_pdf')}}";

    function limpiarFormulario(nombreForm) {
        $("#"+nombreForm).validate().resetForm();
        $("#"+nombreForm)[0].reset();
    }
</script>
@yield('javascript')
</body>
</html>
