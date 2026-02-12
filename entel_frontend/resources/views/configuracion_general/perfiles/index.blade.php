@extends('layout.principal')
@section('tituloModulo', 'Perfiles')
@section('contenido')
<div class="row">
    <div class="col-12">
      <div class="card">
        <!-- /.card-header -->
        <div class="card-body">
            <div class="table-responsive">
                <table id="tabla_perfiles" class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Nombre de Perfil</th>
                            <th>Usuarios</th>
                            <th>Modulos</th>
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
    <div class="modal-dialog ">
      <div class="modal-content">
        <form id="form_perfiles">
            <div class="modal-header">
                <h2 class="modal-title" id="titulo_modal"></h2>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <input type="hidden" name="id_perfil" id="id_perfil">
                <div class="form-group row">
                    <label class="col-form-label col-4">Nombre <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="nombre" class="form-control m-b-5" placeholder="Ingrese el nombre" >
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Descripción <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="descripcion" class="form-control m-b-5" placeholder="Ingrese descripción de perfil" >
                    </div>
                </div>
                <div class="form-group row " id="token">
                    <label class="col-form-label col-4">Apellidos <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" value="{{ csrf_token() }}" name="_token" class="form-control m-b-5">
                    </div>
                </div>
            </div>
            <div class="modal-header">
                <h4 class="modal-title">Permisos de Acceso a Módulos</h4>
            </div>
            <div class="modal-body">
                <div class="row m-b-10 div_submodulos">
                </div>
                <hr>
                <div id="error_submodulos"> </div>
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

        listarPerfiles();
        $.validator.setDefaults({
            submitHandler: function (form) {
                enviarDatosPerfil();
            }
        });
        $('#form_perfiles').validate({
            ignore: 'input[type=hidden]',
            rules: {
                nombre : {
                    required: true
                },
                descripcion : {
                    required: true
                },
                "submodulos[]": {
                    required: true
                }
            },
            messages: {
                nombre : {
                    required: "Por favor ingrese nombre."
                },
                descripcion : {
                    required: "Por favor ingrese descripción."
                },
                "submodulos[]": {
                    required: "Debe escoger un sector obligatoriamente."
                }
            },
            errorElement: 'span',
            errorPlacement: function (error, element) {
                if (element.attr("name") == "submodulos[]" ) {
                    error.addClass('invalid-feedback');
                    error.insertAfter("#error_submodulos");
                }else{
                    error.addClass('invalid-feedback');
                    error.insertAfter(element);
                }
            },
            highlight: function (element, errorClass, validClass) {
                var $el = $(element);
                if ($el.is(':radio') || $el.is(':checkbox')) {
                    $el.closest('.block').addClass(errorClass);
                } else {
                    $(element).addClass('is-invalid');
                }
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).removeClass('is-invalid');
            }
        });
    });
    function listarPerfiles() {
        $('#tabla_perfiles').DataTable().clear().destroy();
        var table =$("#tabla_perfiles").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            buttons: [
                {
                    text: 'Agregar perfil',
                    className: 'btn btn-success',
                    action: function ( e, dt, node, config ) {
                        abrirModal();
                    }
                }
            ],
            initComplete: function () {
                setTimeout( function () {
                    table.buttons().container().appendTo( '#tabla_perfiles_wrapper .col-md-6:eq(0)' );
                }, 10 );
            },
            ajax: {
                url: url_perfiles,
                dataSrc: "perfiles"
            },
            columns: [
                { data: "id_perfil" },
                { data: "nombre" },
                {
                    data : "usuarios",
                    render: function ( data, type,row ) {
                        let usuarios = "";
                        data.forEach(usuario => {
                            usuarios += '<i class="fas fa-user"></i> '+usuario.nombres+' '+usuario.apellidos+'<br>'
                        });
                        return usuarios;
                    }
                },
                {
                    data : "submodulos",
                    render: function ( data, type,row ) {
                        let submodulos = "";
                        data.forEach(submodulo => {
                            submodulos += '<i class="'+submodulo.icono+'"></i> '+submodulo.nombre+'<br>'
                        });
                        return submodulos;
                    }
                },
                {
                    render: function ( data, type, row ) {
                        return '<button class="btn btn-primary btn-sm" onClick="abrirModal('+row.id_perfil+')"><i class="fas fa-edit"></i> Editar</button> <button class="btn btn-danger btn-sm" onClick="eliminarPerfil('+row.id_perfil+')"><i class="fas fa-times"></i> Eliminar</button>';
                    },
                    targets: 5
                }
            ],
            order: [[0, 'asc']]
        });
    }
    function abrirModal(id_perfil = 0) {
        const titulo_modal = id_perfil == 0 ? 'Crear Perfil' : 'Actualizar Perfil';
        $('#titulo_modal').text(titulo_modal);
        $('#id_perfil').val(id_perfil);
        limpiarFormulario('form_perfiles');
        llenarOpcionSubmodulos();
        if(id_perfil != 0){
            $.ajax({
                type: "GET",
                url: url_perfiles+"/"+id_perfil,
                async: false,
                success: function (response) {
                    console.log(response)
                    $('input[name="nombre"]').val(response.perfil.nombre);
                    $('input[name="descripcion"]').val(response.perfil.descripcion);
                    response.perfil.submodulos.forEach(submodulo => {
                        $("#opt-"+submodulo.id_submodulo).attr('checked', true);
                    });
                },
                error: function (request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("Error al obtener los datos.");
                }
            });
        }
        $('#modal-default').modal('show');
    }
    function enviarDatosPerfil(){
        const id_perfil = $('#id_perfil').val();
        const tipo_envio = id_perfil == 0 ? "POST" : "PUT";
        const url_envio = id_perfil == 0 ? url_perfiles : url_perfiles+"/"+id_perfil;

        //Obtener array con los id de los submodulos seleccionados
        let submodulos_seleccionados = []
        $("input[name='submodulos[]']:checked").each(function (){
            submodulos_seleccionados.push(parseInt($(this).val()));
        });
        //////////////////////////////////////////////////////////
        const datos_perfil = {
            nombre :  $("input[name='nombre']").val(),
            descripcion :  $("input[name='descripcion']").val(),
            submodulos : submodulos_seleccionados,
            _token: "{{ csrf_token() }}"
        }
        $.ajax({
            type: tipo_envio,
            url: url_envio,
            data: JSON.stringify(datos_perfil),
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                toastr.success(response.mensaje);
                listarPerfiles();
                limpiarFormulario('form_perfiles');
                $('#modal-default').modal('hide');
            },
            error: function (request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("No se puede eliminar ya que este registro se esta usando.");
            }
        });
    }
    function llenarOpcionSubmodulos() {
        let submodulos = $('.div_submodulos');
        $.ajax({
            type: "GET",
            url: url_modulos,
            async: false,
            success: function (response) {
                let response_html = '';
                $(response.modulos).each(function(i, v){
                    response_html += '<div class="col col-12 col-sm-6"><legend class="m-b-10"> '+v.nombre+'</legend><div class="row">';
                    $(v.submodulos).each(function(j, v2){
                        response_html += '<div class="col col-12 form-check form-check-inline"><input class="form-check-input" type="checkbox" name="submodulos[]" id="opt-'+v2.id_submodulo+'" value="'+v2.id_submodulo+'"><label class="form-check-label" for="opt-'+v2.id_submodulo+'">'+v2.nombre+'</label></div>'
                    })
                    response_html += '</div></div>'
                })
                submodulos.html(response_html);
            },
            error: function (request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("Error al obtener los datos.");
            }
        });
    }
    function eliminarPerfil(id_perfil){
        Swal.fire({
            title: '¿Estas seguro de eliminar el perfil seleccionado?',
            //text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: 'No',
            confirmButtonText: 'Si'
        }).then((result) => {
            if (result.value) {
                $.ajax({
                    url: url_perfiles+"/"+id_perfil,
                    type: 'DELETE',
                    data:{
                            '_token': '{{ csrf_token() }}',
                    },
                    success: function (response) {
                        toastr.success(response.mensaje);
                        listarPerfiles();
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
