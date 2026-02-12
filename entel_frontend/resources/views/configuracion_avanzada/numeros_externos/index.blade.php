@extends('layout.principal')
@section('tituloModulo', 'Números Externos')
@section('contenido')
<div class="row">
    <div class="col-12">
        <div class="card">
            <!-- /.card-header -->
            <div class="card-body">
                <table id="tabla_externos" class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Nombre</th>
                            <th>Comentario</th>
                            <th>Número</th>
                            <th>Opciones</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
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
                <h4 class="modal-title" id="titulo_modal"></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <form id="form_externos">
                <div class="modal-body">
                    <input type="hidden" name="id_numero_externo" id="id_numero_externo">
                    <div class="form-group row">
                        <label class="col-form-label col-4">Nombre <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" name="nombre" class="form-control m-b-5" >
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-form-label col-4">Número <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" name="numero" class="form-control m-b-5" >
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-form-label col-4">Comentario <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <textarea name="comentario" id="comentario" class="form-control" cols="30" rows="10"></textarea>
                        </div>
                    </div>
                    <div class="form-group row " id="token">
                        <label class="col-form-label col-4">Apellidos <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" value="{{ csrf_token() }}" name="_token" class="form-control m-b-5">
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
    $(document).ready(function() {
        $("#token").hide();

        listarExternos();
        $.validator.setDefaults({
            submitHandler: function(form) {
                enviarDatosExternos();
            }
        });
        $('#form_externos').validate({
            ignore: 'input[type=hidden]',
            rules: {
                nombre: {
                    required: true
                },
                comentario: {
                    required: true
                },
                numero: {
                    required: true,
                    number: true
                }
            },
            messages: {
                nombre: {
                    required: "Por favor ingrese nombre.",
                },
                comentario: {
                    required: "Por favor ingrese comentario."
                },
                numero: {
                    required: "Por favor ingrese número.",
                    number: "Por favor ingrese un número valido"
                }
            },
            errorElement: 'span',
            errorPlacement: function(error, element) {
                error.addClass('invalid-feedback');
                error.insertAfter(element);
                //element.closest('.form-group').append(error);
            },
            highlight: function(element, errorClass, validClass) {
                $(element).addClass('is-invalid');
            },
            unhighlight: function(element, errorClass, validClass) {
                $(element).removeClass('is-invalid');
            }
        });
    });


    function listarExternos() {
	console.log("test2");
        $('#tabla_externos').DataTable().clear().destroy();
        var table = $("#tabla_externos").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            buttons: [{
                text: 'Agregar Número Externo',
                className: 'btn btn-success',
                action: function(e, dt, node, config) {
                    abrirModal();
                }
            }],
            initComplete: function() {
                setTimeout(function() {
                    table.buttons().container().appendTo('#tabla_externos_wrapper .col-md-6:eq(0)');
                }, 10);
            },
            ajax: {
                url: url_externos,
                dataSrc: "numerosExternos"
            },
            columns: [{
                    data: "id_numero_externo"
                },
                {
                    data: "nombre"
                },
                {
                    data: "comentario"
                },
                {
                    data: "numero"
                },
                {
                    render: function(data, type, row) {
                        return '<button class="btn btn-primary btn-sm" onClick="abrirModal(' + row.id_numero_externo + ')"><i class="fas fa-edit"></i> Editar</button> <button class="btn btn-danger btn-sm" onClick="eliminarNumeroExterno(' + row.id_numero_externo + ')"><i class="fas fa-times"></i> Eliminar</button>';
                    },
                    targets: 5
                }
            ],
            order: [
                [0, 'asc']
            ]
        });
    }
    //table.buttons().container().appendTo( '#example1_wrapper .col-md-6:eq(0)' );
    function abrirModal(id_numero_externo = 0) {
        const titulo_modal = id_numero_externo == 0 ? 'Crear Número Externo' : 'Actualizar Número Externo';
        $('#titulo_modal').text(titulo_modal);
        $('#id_numero_externo').val(id_numero_externo);
        limpiarFormulario('form_externos');
        if (id_numero_externo != 0) {
            $.ajax({
                type: "GET",
                url: url_externos + "/" + id_numero_externo,
                success: function(response) {
                    console.log("externos");
                    console.log(response.numeroExterno.nombre, response.numeroExterno.numero, response.numeroExterno.comentario);
                    $('input[name="nombre"]').val(response.numeroExterno.nombre);
                    $('input[name="numero"]').val(response.numeroExterno.numero);
                    $("#comentario").val(response.numeroExterno.comentario);
                },
                error: function(request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("Error al obtener los datos.");
                }
            });
        }
        $('#modal-default').modal('show');
    }

    function enviarDatosExternos() {
        const id_numero_externo = $('#id_numero_externo').val();
        const tipo_envio = id_numero_externo == 0 ? "POST" : "PUT";
        const url_envio = id_numero_externo == 0 ? url_externos : url_externos + "/" + id_numero_externo;
        console.log("tipo envio: ", tipo_envio);
        const data_body=$('#form_externos').serialize();

        $.ajax({
            type: tipo_envio,
            url: url_envio,
            data: data_body,
            success: function(response) {
                console.log(response);
                toastr.success(response.mensaje);
                listarExternos();
                $('#form_externos')[0].reset();
                $('#modal-default').modal('hide');
            },
            error: function(request, status, error) {
                //toastr.error(request.responseText);
                console.log("error");
                toastr.error("No se puede eliminar ya que este registro se esta usando.");
            }
        });
    }
    
    function eliminarNumeroExterno(id_numero_externo){
        Swal.fire({
            title: '¿Estas seguro de eliminar el número externo seleccionado?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: 'No',
            confirmButtonText: 'Si'
        }).then((result) => {
            if (result.value) {
                $.ajax({
                    url: url_externos+"/"+id_numero_externo,
                    type: 'DELETE',                       
                     data:{
                            '_token': '{{ csrf_token() }}',
                        },
                    success: function (response) {
                        toastr.success(response.mensaje);
                        listarExternos();
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
