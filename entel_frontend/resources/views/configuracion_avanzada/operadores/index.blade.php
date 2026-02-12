@extends('layout.principal')
@section('tituloModulo', 'Operadores')
@section('contenido')
<div class="row">
    <div class="col-12">
        <div class="card">
            <!-- /.card-header -->
            <div class="card-body">
                <div class="table-responsive">
                    <table id="tabla_operadores" class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Nombre</th>
                                <th>Código</th>
                                <th>Tecnologías</th>
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
            <form id="form_operadores" class="form-nuclear">
                <div class="modal-header">
                    <h4 class="modal-title" id="titulo_modal"></h4>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="hidden" name="id_operador_telefonico" id="id_operador_telefonico">
                    <div class="form-group row">
                        <label class="col-form-label col-4">Nombre <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" name="nombre" class="form-control m-b-5" placeholder="Ingrese el nombre">

                        </div>
                    </div>

                    <div class="form-group row">
                        <label class="col-form-label col-4">Código <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" name="codigo" class="form-control m-b-5" placeholder="Ingrese código">

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
                    <h4 class="modal-title">Tecnologías</h4>
                </div>
                <div class="modal-body">
                    <div class="row m-b-10 div_tecnologias">
                    </div>
                    <hr>
                    <div id="error_tecnologias"> </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" data-dismiss="modal">Cerrar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        </div>

    </div>

</div>

@endsection
@section('javascript')
<script>
    $(document).ready(function() {
        $("#token").hide();

        listarOperadores();
        $.validator.setDefaults({
            submitHandler: function(form) {
                enviarDatosOperadores();
            }
        });
        $('#form_operadores').validate({
            ignore: 'input[type=hidden]',
            rules: {
                nombre: {
                    required: true
                },
                codigo: {
                    required: true
                },
                "tecnologias[]": {
                    required: true
                }
            },
            messages: {
                nombre: {
                    required: "Por favor ingrese nombre."
                },
                codigo: {
                    required: "Por favor ingrese código."
                },
                "tecnologias[]": {
                    required: "Debe escoger un sector obligatoriamente."
                }
            },
            errorElement: 'span',
            errorPlacement: function(error, element) {
                if (element.attr("name") == "tecnologias[]") {
                    error.addClass('invalid-feedback');
                    error.insertAfter("#error_tecnologias");
                } else {
                    error.addClass('invalid-feedback');
                    error.insertAfter(element);
                }
            },
            highlight: function(element, errorClass, validClass) {
                var $el = $(element);
                if ($el.is(':radio') || $el.is(':checkbox')) {
                    $el.closest('.block').addClass(errorClass);
                } else {
                    $(element).addClass('is-invalid');
                }
            },
            unhighlight: function(element, errorClass, validClass) {
                $(element).removeClass('is-invalid');
            }
        });
    });

    function listarOperadores() {
        $('#tabla_operadores').DataTable().clear().destroy();
        var table = $("#tabla_operadores").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            buttons: [{
                text: 'Agregar Operador',
                className: 'btn btn-success',
                action: function(e, dt, node, config) {
                    abrirModal();
                }
            }],
            initComplete: function() {
                setTimeout(function() {
                    table.buttons().container().appendTo('#tabla_operadores_wrapper .col-md-6:eq(0)');
                }, 10);

            },
            ajax: {
                url: url_operadores,
                dataSrc: "operadores"
            },
            columns: [{
                    data: "id_operador_telefonico"
                },
                {
                    data: "nombre"
                },
                {
                    data: "codigo"
                },
                {
                    data: "tecnologias",
                    render: function(data, type, row) {
                        let tecnologias = "";
                        data.forEach(tecnologia => {
                            tecnologias += '<i class="fas fa-user"></i> ' + tecnologia.nombre + '<br>'
                        });
                        console.log(tecnologias);
                        return tecnologias;
                    }
                },
                {
                    render: function(data, type, row) {
                        return '<button class="btn btn-primary btn-sm" onClick="abrirModal(' + row.id_operador_telefonico + ')"><i class="fas fa-edit"></i> Editar</button> <button class="btn btn-danger btn-sm" onClick="eliminarOperador(' + row.id_operador_telefonico + ')"><i class="fas fa-times"></i> Eliminar</button>';
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

    function abrirModal(id_operador_telefonico = 0) {
        const titulo_modal = id_operador_telefonico == 0 ? 'Crear Operador' : 'Actualizar Operador';
        console.log(id_operador_telefonico, "ID");
        $('#titulo_modal').text(titulo_modal);
        $('#id_operador_telefonico').val(id_operador_telefonico);
        limpiarFormulario('form_operadores');
        llenarOpcionTecnologias();
        if (id_operador_telefonico != 0) {
            $.ajax({
                type: "GET",
                url: url_operadores + "/" + id_operador_telefonico,
                success: function(response) {
                    console.log(response," AJAX:");

                    $('input[name="nombre"]').val(response.operador.nombre);
                    $('input[name="codigo"]').val(response.operador.codigo);
                    response.operador.tecnologias.forEach(tecnologia => {
                        $("#opt-" + tecnologia.id_tecnologia).attr('checked', true);
                    });
                },
                error: function(request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("Error al obtener los datos.");
                }
            });
        }
        $('#modal-default').modal('show');
    }

    function enviarDatosOperadores() {
        const id_operador_telefonico = $('#id_operador_telefonico').val();
        const tipo_envio = id_operador_telefonico == 0 ? "POST" : "PUT";
        const url_envio = id_operador_telefonico == 0 ? url_operadores : url_operadores + "/" + id_operador_telefonico;
        console.log("envio url; ",url_envio);
        //Obtener array con los id de los submodulos seleccionados
        let tecnologias_seleccionados = []
        $("input[name='tecnologias[]']:checked").each(function() {
            tecnologias_seleccionados.push(parseInt($(this).val()));
        });
        //////////////////////////////////////////////////////////
        const datos_operadores = {
            nombre: $("input[name='nombre']").val(),
            codigo: $("input[name='codigo']").val(),
            tecnologias: tecnologias_seleccionados,
            _token: '{{ csrf_token() }}',
        }
        console.log("JSON: ",JSON.stringify(datos_operadores));
        $.ajax({
            type: tipo_envio,
            url: url_envio,
            data: JSON.stringify(datos_operadores),
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function(response) {
                toastr.success(response.mensaje);
                listarOperadores();
                limpiarFormulario('form_operadores');
                $('#modal-default').modal('hide');
            },
            error: function(request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("No se puede eliminar ya que este registro se esta usando.");
            }
        });
    }

    function llenarOpcionTecnologias() {
        console.log("url: ",url_tecnologias);
        let tecnologias = $('.div_tecnologias');
        $.ajax({
            type: "GET",
            url: url_tecnologias,
            async: false,
            
            success: function(response) {
                let response_html = '';
                $(response.tecnologias).each(function(i, v) {
                    response_html += '<div class="col col-6 form-check form-check-inline"><input class="form-check-input" type="checkbox" name="tecnologias[]" id="opt-' + v.id_tecnologia + '" value="' + v.id_tecnologia +'"><label class="form-check-label" for="opt-' + v.id_tecnologia + '">' + v.nombre + '</label></div>'
                    response_html += '</div></div>'
                })
                tecnologias.html(response_html);
            },
            error: function(request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("Error al obtener los datos.");
            }
        });
    }
    function eliminarOperador(id_operador_telefonico){
        Swal.fire({
            title: '¿Estas seguro de eliminar el operador telefónico seleccionado?',
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
                    url: url_operadores+"/"+id_operador_telefonico,
                    type: 'DELETE',
                    data:{
                            '_token': '{{ csrf_token() }}',
                    },
                    success: function (response) {
                        toastr.success(response.mensaje);
                        listarOperadores();
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
