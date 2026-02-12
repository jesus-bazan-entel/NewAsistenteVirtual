@extends('layout.principal')
@section('tituloModulo', 'LDAP')
@section('contenido')
<div class="row">
    <div class="col-12">

        <section class="content">
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-6">
                        <!-- AREA CHART -->
                        <div class="card card-primary">
                            <div class="card-header">
                                <h3 class="card-title">ACCESO LDAP</h3>

                                <div class="card-tools">
                                    <button type="button" class="btn btn-tool" data-card-widget="collapse">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                  
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="chart">
                                    <form id="form_tecnologias">
                                        <h5>Datos de conexión LDAP</h5>
                                        <div class="modal-body">
                                            <input type="hidden" name="id_tecnologia" id="id_tecnologia">
                                            <div class="row">
                                                <label class="col-form-label col-4">Nombre <span class="text-danger">*</span></label>
                                                <div class="col-8">
                                                    <input type="text" name="nombre" class="form-control m-b-5" value="Cesar">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <label class="col-form-label col-4">Servidor IP <span class="text-danger">*</span></label>
                                                <div class="col-8">
                                                    <input type="text" name="servidorIP" class="form-control m-b-5" value="123.123.4.1">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <label class="col-form-label col-4">Servidor Puerto <span class="text-danger">*</span></label>
                                                <div class="col-8">
                                                    <input type="text" name="servidoPuerto" class="form-control m-b-5 " value="21">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <label class="col-form-label col-4">Identificador de Nombre Común(Alias)<span class="text-danger">*</span></label>
                                                <div class="col-8">
                                                    <input type="text" name="alias" class="form-control m-b-5" value="Checho">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <label class="col-form-label col-4">Nombre Distinguido<span class="text-danger">*</span></label>
                                                <div class="col-8">
                                                    <input type="text" name="nombreDistinguido" class="form-control m-b-5" value="cip">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <label class="col-form-label col-4">Tipo de Enlace<span class="text-danger">*</span></label>
                                                <div class="col-8">
                                                    <input type="text" name="tipoEnlace" class="form-control m-b-5" value="DC=231">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <label class="col-form-label col-4">Usuario<span class="text-danger">*</span></label>
                                                <div class="col-8">
                                                    <input type="text" name="usuario" class="form-control m-b-5" value="cesar.laura">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <label class="col-form-label col-4">Contraseña<span class="text-danger">*</span></label>
                                                <div class="col-8">
                                                    <input type="password" name="contraseña" class="form-control m-b-5" value="claura@newip.pe">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-info" data-dismiss="modal">Prueba Conexión</button>
                                            <button type="submit" class="btn btn-primary">Guardar</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <!-- /.card-body -->
                        </div>
                        <!-- /.card -->

                        <!-- DONUT CHART -->

                        <!-- /.card -->

                        <!-- PIE CHART -->

                        <!-- /.card -->

                    </div>
                    <!-- /.col (LEFT) -->
                    <div class="col-md-6">
                        <!-- LINE CHART -->
                        <div class="card card-info">
                            <div class="card-header">
                                <h3 class="card-title">Configuración de usuarios</h3>

                                <div class="card-tools">
                                    <button type="button" class="btn btn-tool" data-card-widget="collapse">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                 
                                </div>
                            </div>
                            <div class="card-body" style="display: block;">
                                <div class="chart">
                                    <form id="form_tecnologias">
                                        <h5>Tipo de autentificación</h5>
                                        <div class="modal-body">
                                            <input type="hidden" name="id_tecnologia" id="id_tecnologia">
                                           
                                            <div class="form-group">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="radio1">
                                                    <label class="form-check-label">Acceso Local</label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="radio1" checked="">
                                                    <label class="form-check-label">Acceso LDAP</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="submit" class="btn btn-primary">Guardar</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <!-- /.card-body -->
                        </div>
                        <!-- /.card -->

                        <!-- BAR CHART -->

                        <!-- /.card -->

                        <!-- STACKED BAR CHART -->

                        <!-- /.card -->

                    </div>
                    <!-- /.col (RIGHT) -->
                </div>
                <!-- /.row -->
            </div><!-- /.container-fluid -->
        </section>
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
                            <input type="text" name="nombre" class="form-control m-b-5" value="Cesar">
                        </div>
                    </div>
                    <div class="row">
                        <label class="col-form-label col-4">Apellido <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" name="nombre" class="form-control m-b-5" value="Laura">
                        </div>
                    </div>
                    <div class="row">
                        <label class="col-form-label col-4">Contraseña <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" name="nombre" class="form-control m-b-5 " value="hasdf12%^">
                        </div>
                    </div>
                    <div class="row">
                        <label class="col-form-label col-4">Correo <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" name="nombre" class="form-control m-b-5" value="claura@newip.pe">
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-form-label col-4">Perfil <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <select class="form-control" name="select-tipo" id="select-tipo">

                                <option value="g">Admin</option>
                                <option value="p">Operador</option>
                            </select>
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
        //  listarTecnologias();
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
        const titulo_modal = id_tecnologia == 0 ? 'Crear LDAP' : 'Actualizar LDAP';
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
                error: function(request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("Error al obtener los datos.");
                }
            });
        }
        $('#modal-default').modal('show');
    }

    function enviarDatosTecnologia() {
        const id_tecnologia = $('#id_tecnologia').val();
        const tipo_envio = id_tecnologia == 0 ? "POST" : "PUT";
        const url_envio = id_tecnologia == 0 ? url_tecnologias : url_tecnologias + "/" + id_tecnologia;
        $.ajax({
            type: tipo_envio,
            url: url_envio,
            data: $('#form_tecnologias').serialize(),
            success: function(response) {
                toastr.success(response.mensaje);
                listarTecnologias();
                limpiarFormulario('form_tecnologias');
                $('#modal-default').modal('hide');
            },
            error: function(request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("Error al obtener los datos.");
            }
        });
    }

    function eliminarTecnologia(id_tecnologia) {
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
                    url: url_tecnologias + "/" + id_tecnologia,
                    type: 'DELETE',
                    success: function(response) {
                        toastr.success(response.mensaje);
                        listarTecnologias();
                    },
                    error: function(request, status, error) {
                        //toastr.error(request.responseText);
                        toastr.error("Error al realizar la accion.");
                    }
                });
            }
        })
    }
</script>
@endsection
