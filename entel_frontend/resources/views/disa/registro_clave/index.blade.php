@extends('layout.principal')
@section('tituloModulo', 'Registro de Clave')
@section('contenido')
<div class="row">
    <div class="col-12">
      <div class="card">
        <!-- /.card-header -->
        <div class="card-body">
          <table id="tabla_datos" class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Comentario</th>
                    <th>Clave</th>
                    <th>Estado</th>
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
        <form id="form_datos">
            <div class="modal-body">
                <input type="hidden" name="id_registro_clave" id="id_registro_clave">
                <div class="form-group row">
                    <label class="col-form-label col-4">Nombre <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="nombre" class="form-control m-b-5" >
                    </div>
                </div>
                <div class="form-group row m-b-15">
                    <label class="col-form-label col-4">Clave <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="clave" class="form-control m-b-5" >
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Comentario <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <textarea name="comentario" id="comentario" class="form-control" cols="30" rows="10"></textarea>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Canales <span class="text-danger">*</span></label>
                    <table id="tabla_canales" class="table table-bordered table-striped" >
                        <thead>
                            <tr>
                                <th></th>
                                <th style="padding-right: 40px;" >ID</th>
                                <th>Canal</th>
                                <th style="padding-right: 40px;">Tecnología</th>
                                <th style="padding-right: 60px;">Operador Telefónico</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
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
<div class="modal fade" id="modal-default2">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title" id="titulo_detalle"></h4>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
            <div class="form-group row">
                <label class="col-form-label col-4">Canales </label>
                <table id="tabla_canales2" class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Canal</th>
                            <th>Tecnología</th>
                            <th>Operador Telefónico</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-danger" data-dismiss="modal">Cerrar</button>
        </div>
      </div>
      <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>
<!-- /.modal -->
@endsection
@section('javascript')
<script>
    $(document).ready(function(){
        listarDatos();
        $.validator.setDefaults({
            submitHandler: function(form) {
                enviarDatos();
            }
        });
        $('#form_datos').validate({
            ignore: 'input[type=hidden]',
            rules: {
                nombre: {
                    required: true
                },
                comentario: {
                    required: true
                },
                clave: {
                    required: true
                }
            },
            messages: {
                nombre: {
                    required: "Por favor ingrese nombre.",
                },
                comentario: {
                    required: "Por favor ingrese comentario."
                },
                clave: {
                    required: "Por favor ingrese clave.",
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
        $("#tabla_datos").on('change','.custom-control-input',function(){
            const id_registro_clave = $(this).attr('id').replace("switchActivo","");
            const estado = ($(this).prop('checked'))?true:false;
            $.ajax({
                type: "PUT",
                url: url_pruebas+"/"+id_registro_clave,
                data: {
                    estado : estado
                },
                success: function (response) {
                    toastr.success(response.mensaje);
                },
                error: function (request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("Error al actualizar la prueba.");
                }
            });
        });
    });
    function listarDatos(){
        $('#tabla_datos').DataTable().clear().destroy();
        var table =$("#tabla_datos").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            buttons: [
                {
                    text: 'Crear',
                    className: 'btn btn-success',
                    action: function ( e, dt, node, config ) {
                        //alert( 'Button activated' );
                        //$('#modal-default').modal('show');
                        abrirModal();
                    }
                }
            ],
            initComplete: function () {
                setTimeout( function () {
                    table.buttons().container().appendTo( '#tabla_datos_wrapper .col-md-6:eq(0)' );
                }, 10 );
            },
            ajax: {
                url: url_registro_clave,
                dataSrc: "datos"
            },
            columns: [
                {
                    data: "id_registro_clave"
                },
                {
                    data: "nombre"
                },
                {
                    data: "comentario"
                },
                {
                    data: "clave"
                },
                {
                    render: function ( data, type, row ) {
                        if(row.estado == true){
                            //console.log("entro al true");
                            const checked = row.estado == true ? 'checked' : '';
                            return '<div class="custom-control custom-switch"><input type="checkbox" '+checked+' class="custom-control-input" id="switchActivo'+row.id_registro_clave+'"><label class="custom-control-label" for="switchActivo'+row.id_registro_clave+'"></label></div>';
                        }
                        return '';
                        //return row.tipo_lanzamiento === 'Programado' && row.programacion === 'T'?' <button class="btn btn-danger btn-sm" onClick="eliminarPrueba('+row.id_prueba+')"><i class="fas fa-times"></i> Eliminar</button>' : '';                  
                    },
                    targets: 8
                },
                {
                    render: function(data, type, row) {
                        return '<button class="btn btn-info btn-sm" onClick="obtenerDetalle(' + row.id_registro_clave + ')"><i class="fas fa-info"></i> Detalle</button> <button class="btn btn-primary btn-sm" onClick="abrirModal(' + row.id_registro_clave + ')"><i class="fas fa-edit"></i> Editar</button> <button class="btn btn-danger btn-sm" onClick="eliminarDato(' + row.id_registro_clave + ')"><i class="fas fa-times"></i> Eliminar</button>';
                    },
                    targets: 5
                }
            ],
            order: [
                [0, 'asc']
            ]
        });
    }
    function abrirModal(id_registro_clave = 0) {
        const titulo_modal = id_registro_clave == 0 ? 'Crear' : 'Actualizar';
        $('#titulo_modal').text(titulo_modal);
        $('#id_registro_clave').val(id_registro_clave);
        limpiarFormulario('form_datos');
        llenarCanales();
        if (id_registro_clave != 0) {
            $.ajax({
                type: "GET",
                url: url_registro_clave + "/" + id_registro_clave,
                success: function(response) {
                    $('input[name="nombre"]').val(response.dato.nombre);
                    $('input[name="clave"]').val(response.dato.clave);
                    $("#comentario").val(response.dato.comentario);
                    let canales  = response.dato.canales.map((item)=> item.id_canal)
                    setTimeout(function () {
                        llenarCanales(canales)
                    },30)
                },
                error: function(request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("Error al obtener los datos.");
                }
            });
        }
        $('#modal-default').modal('show');
    }
    function enviarDatos() {
        const id_registro_clave = $('#id_registro_clave').val();
        const tipo_envio = id_registro_clave == 0 ? "POST" : "PUT";
        const url_envio = id_registro_clave == 0 ? url_registro_clave : url_registro_clave + "/" + id_registro_clave;
        let canales = $.map($('#tabla_canales').DataTable().rows( { selected: true } ).data(),function (item) {
            return item.id_canal
        });
        const data = {
            nombre : $('input[name="nombre"]').val(),
            clave : $('input[name="clave"]').val(),
            comentario : $('#comentario').val(),
            canales : canales,
            '_token': '{{ csrf_token() }}',
        }
        console.log("data: ",data);
        console.log("tipo_envio: ",tipo_envio);
        console.log("url_envio: ",url_envio);
        $.ajax({
            type: tipo_envio,
            url: url_envio,
            data: JSON.stringify(data),
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function(response) {
                toastr.success(response.mensaje);
                listarDatos();
                $('#form_datos')[0].reset();
                $('#modal-default').modal('hide');
            },
            error: function(request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("No se puede eliminar ya que este registro se esta usando.");
            }
        });
    }
    function llenarCanales(canales=[]){
        $('#tabla_canales').DataTable().clear().destroy();
        var table2 =$("#tabla_canales").DataTable({
            responsive: true,
            autoWidth: true,
            pageLength: 4,
            lengthChange: false,
            searching: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            ajax: {
                url: url_canales,
                dataSrc: "canales",
                async: false
            },
            columnDefs: [
                {
                    orderable: false,
                    className: 'select-checkbox',
                    targets:   0
                }
            ],
            select: {
                style: 'multi',
                selector: 'td:first-child'
            },
            columns: [
                {   data: null, defaultContent: '' },
                {   data: 'id_canal'  },
                {
                    data: "id_canal",
                    render: function(data, type, row) {
                        return 'Canal '+row.id_canal;
                    }
                },
                {
                    data: "tecnologia_operador.nombre_tecnologia",
                    render: function(data, type, row) {
                        return data ? data : '' ;
                    }
                },
                {
                    data: "tecnologia_operador.nombre_operador",
                    render: function(data, type, row) {
                        return data ? data : '';
                    }
                }
            ],
            rowCallback: function (row, data) {
                if (canales.includes(data.id_canal)) {
                    table2.row(row).select()
                }
            },
            order: [[ 1, 'asc' ]]
        });
    }
    function eliminarDato(id_registro_clave){
        Swal.fire({
            title: '¿Estas seguro de eliminar el registro seleccionado?',
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
                    url: url_registro_clave+"/"+id_registro_clave,
                    type: 'DELETE',
                    data:{
                            '_token': '{{ csrf_token() }}',
                    },
                    success: function (response) {
                        toastr.success(response.mensaje);
                        listarDatos();
                    },
                    error: function (request, status, error) {
                        //toastr.error(request.responseText);
                        toastr.error("Error al eliminar : Este registro esta siendo utilizado.");
                    }
                });
            }
        })
    }
    function obtenerDetalle(id_registro_clave) {
        $.ajax({
            type: "GET",
            url: url_registro_clave + "/" + id_registro_clave,
            success: function(response) {
               $('#titulo_detalle').text('Detalle - '+response.dato.nombre);
               llenarCanalesDetalle(id_registro_clave);
               $('#modal-default2').modal('show');
            },
            error: function(request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("Error al obtener los datos.");
            }
        });
    }
    function llenarCanalesDetalle(id_registro_clave){
        $('#tabla_canales2').DataTable().clear().destroy();
        var table2 =$("#tabla_canales2").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 4,
            lengthChange: false,
            searching: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            ajax: {
                url: url_registro_clave + "/" + id_registro_clave,
                dataSrc: "dato.canales",
                async: false
            },
            columns: [
                {   data: 'id_canal'  },
                {
                    data: "id_canal",
                    render: function(data, type, row) {
                        return 'Canal '+row.id_canal;
                    }
                },
                {
                    data: "tecnologia_operador.nombre_tecnologia",
                    render: function(data, type, row) {
                        
                        return data ? data : '' ;
                    }
                },
                {
                    data: "tecnologia_operador.nombre_operador",
                    render: function(data, type, row) {
                        return data ? data : '';
                    }
                }
            ],
            order: [[ 0, 'asc' ]]
        });
    }
</script>
@endsection
