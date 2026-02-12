@extends('layout.principal')
@section('tituloModulo', 'Tecnologias')
@section('contenido')
<div class="row">
    <div class="col-12">
        <div class="card">
            <!-- /.card-header -->
            <div class="card-body">
                <table id="table_tecnologias" class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Nombre</th>
                            <th class="text-center">Opciones</th>
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
            <form id="form_tecnologias">
                <div class="modal-body">
                    <input type="hidden" name="id_tecnologia" id="id_tecnologia">
                    <div class="row">
                        <label class="col-form-label col-4">Nombre <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" name="nombre" class="form-control m-b-5">
                        </div>
                    </div>
                </div>
                <div class="form-group row " id="token">
                    <label class="col-form-label col-4">Apellidos <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" value="{{ csrf_token() }}" name="_token" class="form-control m-b-5">
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

        listarTecnologias();
        $.validator.setDefaults({
            submitHandler: function(form) {
                enviarDatosTecnologia();
            }
        });
        $('#form_tecnologias').validate({
            ignore: 'input[type=hidden]',
            rules: {
                nombre: {
                    required: true
                }
            },
            messages: {
                nombre: {
                    required: "Por favor ingrese nombre de tecnologia."

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

    function listarTecnologias() {
        $('#table_tecnologias').DataTable().clear().destroy();
        var table = $("#table_tecnologias").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            buttons: [{
                text: 'Agregar tecnologia',
                className: 'btn btn-success',
                action: function(e, dt, node, config) {
                    abrirModal();
                }
            }],
            initComplete: function() {
                setTimeout(function() {
                    table.buttons().container().appendTo('#table_tecnologias_wrapper .col-md-6:eq(0)');
                }, 10);
            },
            ajax: {
                url: url_tecnologias,
                dataSrc: "tecnologias"
            },
            columns: [{
                    data: "id_tecnologia"
                },
                {
                    data: "nombre"
                },
                {
                    render: function(data, type, row) {
                        return '<button class="btn btn-primary btn-sm" onClick="abrirModal(' + row.id_tecnologia + ')"><i class="fas fa-edit"></i> Editar</button> <button class="btn btn-danger btn-sm" onClick="eliminarTecnologia(' + row.id_tecnologia + ')"><i class="fas fa-times"></i> Eliminar</button>';
                    },
                    targets: 5
                }
            ],
            order: [
                [0, 'asc']
            ]
        });
    }

    function abrirModal(id_tecnologia = 0) {
        const titulo_modal = id_tecnologia == 0 ? 'Crear Tecnologia' : 'Actualizar Tecnologia';
        $('#titulo_modal').text(titulo_modal);
        $('#id_tecnologia').val(id_tecnologia);
        limpiarFormulario('form_tecnologias');
        if (id_tecnologia != 0) {
            $.ajax({
                type: "GET",
                async: false,
                url: url_tecnologias + "/" + id_tecnologia,
                success: function(response) {
                    $('input[name="nombre"]').val(response.tecnologia.nombre);
                },
                error: function (request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("Error al obtener los datos.");
                }
            });
        }
        $('#modal-default').modal('show');
    }
    function enviarDatosTecnologia(){
        const id_tecnologia = $('#id_tecnologia').val();
        const tipo_envio = id_tecnologia== 0 ? "POST" : "PUT";
        const url_envio = id_tecnologia == 0 ? url_tecnologias : url_tecnologias+"/"+id_tecnologia;
        $.ajax({
            type: tipo_envio,
            url: url_envio,
            data: $('#form_tecnologias').serialize(),
            success: function (response) {
                toastr.success(response.mensaje);
                listarTecnologias();
                limpiarFormulario('form_tecnologias');
                $('#modal-default').modal('hide');
            },
            error: function (request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("Error al obtener los datos.");
            }
        });
    }
    function eliminarTecnologia(id_tecnologia){
        Swal.fire({
            title: '¿Estas seguro de eliminar la tecnología seleccionada?',
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
                    url: url_tecnologias+"/"+id_tecnologia,
                    type: 'DELETE',
                    data:{
                            '_token': '{{ csrf_token() }}',
                    },
                    success: function (response) {
                        toastr.success(response.mensaje);
                        listarTecnologias();
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
