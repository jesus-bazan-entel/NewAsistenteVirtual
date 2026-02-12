
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ENTEL | Inicio de Sesión</title>
  <!-- Tell the browser to be responsive to screen width -->
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Font Awesome -->
  <link rel="stylesheet" href="{{ asset('plugins/fontawesome-free/css/all.min.css') }}">
  <!-- Ionicons -->
  <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
  <!-- icheck bootstrap -->
  <link rel="stylesheet" href="{{ asset('plugins/icheck-bootstrap/icheck-bootstrap.min.css') }}">
  <!-- Theme style -->
  <link rel="stylesheet" href="{{ asset('dist/css/adminlte.min.css') }}">
  <!-- Google Font: Source Sans Pro -->
  <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700" rel="stylesheet">
  <!-- Toastr -->
  <link rel="stylesheet" href="{{ asset('plugins/toastr/toastr.min.css')}}">
</head>
<body class="hold-transition login-page">
<div class="login-box">
  <div class="login-logo">
    <!--<b>Admin</b>LTE-->
  </div>
  <!-- /.login-logo -->
  <div class="card">
    <div class="card-body login-card-body">
      <!--<p class="login-box-msg">Sign in to start your session</p>-->
      <p class="login-box-msg"><strong>Inicio de Sesión </strong></p>
        <div id="myTabContent" class="tab-content">
            <div class="tab-pane active in" id="home">
                <form action="" method="post" id="form-login">
                    @csrf
                    <div class="input-group mb-3">
                        <input type="email" name="correo_usuario" class="form-control" placeholder="Email">
                        <div class="input-group-append">
                            <div class="input-group-text">
                                <span class="fas fa-envelope"></span>
                            </div>
                        </div>
                    </div>
                    <div class="input-group mb-3">
                        <input type="password" name="clave_usuario" class="form-control" placeholder="Password">
                        <div class="input-group-append">
                            <div class="input-group-text">
                                <span class="fas fa-lock"></span>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <button type="submit" class="btn btn-primary btn-block">Ingresar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <!-- /.login-card-body -->
  </div>
</div>
<!-- /.login-box -->

<!-- jQuery -->
<script src="{{ asset('plugins/jquery/jquery.min.js') }}"></script>
<!-- Bootstrap 4 -->
<script src="{{ asset('plugins/bootstrap/js/bootstrap.bundle.min.js') }}"></script>
<!-- jquery-validation -->
<script src="{{ asset('plugins/jquery-validation/jquery.validate.min.js') }}"></script>
<script src="{{ asset('plugins/jquery-validation/additional-methods.min.js') }}"></script>
<!-- Toastr -->
<script src="{{ asset('plugins/toastr/toastr.min.js')}}"></script>
<!-- AdminLTE App -->
<script src="{{ asset('dist/js/adminlte.min.js') }}"></script>
<script type="text/javascript">
    $(document).ready(function () {
      $.validator.setDefaults({
        submitHandler: function (form) {
            $.ajax({
                type: "POST",
                url: "{{route('validar-usuario')}}",
                data: $('#form-login').serialize(),
                success: function (response) {
                    console.log(response);
                    if (response) {
                        window.location.href = '{{route("principal")}}';
                    } else {
                        toastr.error(response.mensaje);
                    }
                },
                error: function (request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("Usuario o contraseña incorrectos.");
                }
            });
        }
      });
      $('#form-login').validate({
        rules: {
          correo_usuario: {
            required: true,
            email: false,
          },
          clave_usuario: {
            required: true,
            minlength: 5
          },
        },
        messages: {
          correo_usuario: {
            required: "Por favor ingrese correo electrónico",
            email: "Por favor ingrese un correo electrónico valido"
          },
          clave_usuario: {
            required: "Por favor ingrese constraseña",
            minlength: "La contraseña no debe tener menos de 5 digitos"
          },
        },
        errorElement: 'span',
        errorPlacement: function (error, element) {
          error.addClass('invalid-feedback');
          element.closest('.form-group').append(error);
        },
        highlight: function (element, errorClass, validClass) {
          $(element).addClass('is-invalid');
        },
        unhighlight: function (element, errorClass, validClass) {
          $(element).removeClass('is-invalid');
        }
      });
    });
</script>
</body>
</html>
