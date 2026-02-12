@extends('layout.principal')
@section('tituloModulo', 'Usuarios')
@section('contenido')
<div class="row">
    <div class="col-12">
      <div class="card">
        <!-- /.card-header -->
        <div class="card-body">
            <div class="table-responsive">
                <table id="tabla_usuarios" class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Nombres</th>
                            <th>Apellidos</th>
                            <th>Correo</th>
                            <th>Perfil</th>
                            <th>Acceso</th>
                            <th>Opciones</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
        <!-- /.card-body -->
      </div>
      <!-- /.card -->
    </div>
    <!-- /.col -->
</div>
<div class="modal fade" id="modal-default">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title" id="titulo_modal"></h2>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <form id="form_usuarios" >
            <div class="modal-body">
                <input type="hidden" name="id_usuario" id="id_usuario">
                <div class="form-group row">
                    <label class="col-form-label col-4">Correo <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="email" name="correo" class="form-control m-b-5">
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Nombres <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="nombres" class="form-control m-b-5">
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Apellidos <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="apellidos" class="form-control m-b-5">
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Perfil <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <select class="form-control" name="id_perfil" >
                        </select>
                    </div>
                </div>

                <div class="form-group row">
                    <label class="col-form-label col-4">Contraseña <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="password" name="clave" id="clave" class="form-control m-b-5">
                    </div>
                </div>

                <div class="form-group row">
                    <label class="col-form-label col-4">Repita Contraseña <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="password" name="clave_confirmacion"  id="clave_confirmacion" class="form-control m-b-5">
                    </div>
                </div>
                <div class="form-group row " id="token">
                    <label class="col-form-label col-4">Apellidos <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" value="{{ csrf_token() }}" name="_token" class="form-control m-b-5">
                    </div>
                </div>
                <div class="form-group row " id="putAll">
                    <label class="col-form-label col-4">Apellidos <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" value="yes" name="putAll" class="form-control m-b-5">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" data-dismiss="modal">Cerrar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
        </form>
      </div>
      <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>
<!-- /.modal -->
@endsection
@section('javascript')
    <script>
        $(document).ready(function () {
            $("#token").hide();
            $("#putAll").hide();
            listarUsuarios();
            $.validator.setDefaults({
                submitHandler: function (form) {
                    enviarDatosUsuario();
                }
            });
            $('#form_usuarios').validate({
                ignore: 'input[type=hidden]',
                rules: {
                    correo : {
                        required: true,
                        email: true,
                    },
                    nombres : {
                        required: true
                    },
                    apellidos : {
                        required: true
                    },
                    id_perfil : {
                        required: true
                    },
                    clave : {
                        required: true,
                        minlength: 5
                    },
                    clave_confirmacion: {
                        required: true,
                        equalTo: '#clave'
                    }
                },
                messages: {
                    correo : {
                        required: "Por favor ingrese correo electrónico.",
                        email: "Por favor ingrese un correo electrónico valido."
                    },
                    nombres : {
                        required: "Por favor ingrese nombres."
                    },
                    apellidos : {
                        required: "Por favor ingrese apellidos."
                    },
                    id_perfil : {
                        required: "Por favor seleccione perfil."
                    },
                    clave: {
                        required: "Por favor ingrese constraseña.",
                        minlength: "La contraseña no debe tener menos de 5 digitos."
                    },
                    clave_confirmacion: {
                        required: "Por favor ingrese constraseña de confirmación.",
                        equalTo: 'Las contraseñas ingresadas no coinciden.'
                    }
                },
                errorElement: 'span',
                errorPlacement: function (error, element) {
                    error.addClass('invalid-feedback');
                    error.insertAfter(element);
                    //element.closest('.form-group').append(error);
                },
                highlight: function (element, errorClass, validClass) {
                    $(element).addClass('is-invalid');
                },
                unhighlight: function (element, errorClass, validClass) {
                    $(element).removeClass('is-invalid');
                }
            });
            $("#tabla_usuarios").on('change','.custom-control-input',function(){
                const id_usuario = $(this).attr('id').replace("switchAcceso","");
                const acceso = ($(this).prop('checked'))?'A':'D';
                $.ajax({
                    type: "PUT",
                    url: url_usuarios+"/"+id_usuario,
                    data: {
                        acceso : acceso,
                        _token: "{{ csrf_token() }}"
                    },
                    success: function (response) {
                        toastr.success(response.mensaje);
                    },
                    error: function (request, status, error) {
                        //toastr.error(request.responseText);
                        toastr.error("Error al actualizar el usuario.");
                    }
                });
            });
        });
        function listarUsuarios() {
            $('#tabla_usuarios').DataTable().clear().destroy();

            var table =$("#tabla_usuarios").DataTable({
                responsive: true,
                autoWidth: false,
                pageLength: 25,
                lengthChange: false,
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
                },
                buttons: [
                    {
                        text: 'Agregar usuario',
                        className: 'btn btn-success',
                        action: function ( e, dt, node, config ) {
                            abrirModal();
                        }
                    }
                ],
                initComplete: function () {
                    setTimeout( function () {
                        table.buttons().container().appendTo( '#tabla_usuarios_wrapper .col-md-6:eq(0)' );
                    }, 10 );
                },
                ajax: {
                    url: url_usuarios,
                    dataSrc: "usuarios"
                },
                columns: [
                    { data: "nombres" },
                    { data: "apellidos" },
                    { data: "correo" },
                    { data: "perfil.nombre" },
                    {
                        data : "acceso",
                        render: function ( data, type,row ) {
                            const checked = row.acceso == 'A'? 'checked' : '';
                            return '<div class="custom-control custom-switch"><input type="checkbox" '+checked+' class="custom-control-input" id="switchAcceso'+row.id_usuario+'"><label class="custom-control-label" for="switchAcceso'+row.id_usuario+'"></label></div>';
                        }
                    },
                    {
                        render: function ( data, type, row ) {
                            return '<button class="btn btn-primary btn-sm" onClick="abrirModal('+row.id_usuario+')"><i class="fas fa-edit"></i> Editar</button> <button class="btn btn-danger btn-sm" onClick="eliminarUsuario('+row.id_usuario+')"><i class="fas fa-times"></i> Eliminar</button>';
                        },
                        targets: 5
                    }
                ],
                order: [[0, 'asc']]
            });
        }
        function abrirModal(id_usuario = 0) {
            const titulo_modal = id_usuario == 0 ? 'Crear Usuario' : 'Actualizar Usuario';
            $('#titulo_modal').text(titulo_modal);
            $('#id_usuario').val(id_usuario);
            limpiarFormulario('form_usuarios');
            llenarOpcionPerfil();
            if(id_usuario != 0){
                $.ajax({
                    type: "GET",
                    url: url_usuarios+"/"+id_usuario,
                    async: false,
                    success: function (response) {
                        console.log(response)
                        $('input[name="correo"]').val(response.usuario.correo);
                        $('input[name="nombres"]').val(response.usuario.nombres);
                        $('input[name="apellidos"]').val(response.usuario.apellidos);
                        $('select[name="id_perfil"]').val(response.usuario.id_perfil);
                    }
                });
            }
            $('#modal-default').modal('show');
        }
        function enviarDatosUsuario(){
            const id_usuario = $('#id_usuario').val();
            const tipo_envio = id_usuario == 0 ? "POST" : "PUT";
            const url_envio = id_usuario == 0 ? url_usuarios : url_usuarios+"/"+id_usuario;
            const data_body=$('#form_usuarios').serialize();
            console.log((data_body));
            console.log((data_body[0]['value']));

       

            $.ajax({
                type: tipo_envio,
                url: url_envio,
                data: data_body,
                success: function (response) {
                    console.log(response)
                    toastr.success(response.mensaje);
                    listarUsuarios();
                    limpiarFormulario('form_usuarios');
                    $('#modal-default').modal('hide');
                },
                error: function (request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("No se puede eliminar ya que este registro se esta usando.");
                }
            });
        }
        function llenarOpcionPerfil() {
            let perfiles = $('select[name="id_perfil"]');
            $.ajax({
                type: "GET",
                url: url_perfiles,
                async: false,
                success: function (response) {
                    perfiles.find('option').remove();
                    perfiles.append('<option value="">Seleccione</option>');
                    $(response.perfiles).each(function(i, v){
                        perfiles.append('<option value="' + v.id_perfil + '">' + v.nombre + '</option>');
                    })
                },
                error: function (request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("Error al obtener los datos.");
                }
            });
        }
        function eliminarUsuario(id_usuario){
            Swal.fire({
                title: '¿Estas seguro de eliminar el usuario seleccionado?',
                //text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                cancelButtonText: 'No',
                confirmButtonText: 'Si'
            }).then((result) => {
                if (result.value) {
                    $.ajaxSetup({
                        headers:{
                            'X_CSRF_TOKEN': $('meta[name="csrf-token"]').attr('content')
                        }
                    });
                    $.ajax({
                        url: url_usuarios+"/"+id_usuario,
                        type: 'DELETE',
                        data:{
                            '_token': '{{ csrf_token() }}',
                        },
                        success: function (response) {
                            toastr.success(response.mensaje);
                            listarUsuarios();
                        },
                        error: function (request, status, error) {
                            //toastr.error(request.responseText);
                            toastr.error("Error al eliminar : Este registro esta siendo utilizado.");
                        }
                    });
                }
            })
        }
    </script>
@endsection
