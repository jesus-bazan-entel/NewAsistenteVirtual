@extends('layout.principal')
@section('tituloModulo', 'Lanzador de pruebas')
@section('contenido')
<div class="row">
    <div class="col-12">
      <div class="card">
        <!-- /.card-header -->
        <div class="card-body">
          <table id="tabla_pruebas" class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Nombre</th>
                    <th>Matriz</th>
                    <th>Ejecu-<br/>tado</th>
                    <th>Fecha<br/> Lanzamiento</th>
                    <th>Tipo de<br/> Lanzamiento</th>
                    <th>Programación</th>
                    <th>Ejecución<br/>Actual</th>
                    <th>Opciones</th>
                </tr>
            </thead>
            <tbody>
                <!--<tr>
                    <td>1</td>
                    <td>Lanzador 1</td>
                    <td>Matriz 1</td>
                    <td>rpadilla@newip.pe</td>
                    <td>20 segundos</td>
                    <td>4</td>
                    <td>Inmediato</td>
                    <td>Lanzamiento único</td>
                    <td align="center">
                        <button class="btn btn-primary">Editar</button>
                        <button class="btn btn-danger">Eliminar</button>
                    </td>
                </tr>-->
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
          <h2 class="modal-title" id="titulo_modal"></h2>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <form id="form_pruebas">
            <div class="modal-body">
                <input type="hidden" name="id_prueba" id="id_prueba">
                <div class="form-group row">
                    <label class="col-form-label col-4">Nombre <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="nombre" class="form-control m-b-5">
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Matriz <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <select class="form-control" name="id_matriz"></select>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">E-mail <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="email" name="correo" class="form-control m-b-5">
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Tiempo de timbrado <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="tiempo_timbrado" class="form-control m-b-5">
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Reintentos <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="reintentos" value ="1" class="form-control m-b-5">
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Tipo de lanzamiento <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <select class="form-control" name="tipo_lanzamiento" onchange="cambiarTipoPrueba()">
                            <option value="">Seleccione</option>
                            <option value="Programado">Programado</option>
                            <option value="Instantaneo">Instantaneo</option>
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Programación <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <select class="form-control" name="programacion"  onchange="cambiarProgramacion()" disabled>
                            <option value="">Seleccione</option>
                            <option value="T">Lanzamiento Repetitivo</option>
                            <option value="U">Lanzamiento Único</option>
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Días de Programación <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <select class="form-control" name="dias_lanzamiento" multiple disabled>
                            <option value="Lunes">Lunes</option>
                            <option value="Martes">Martes</option>
                            <option value="Miercoles">Miercoles</option>
                            <option value="Jueves">Jueves</option>
                            <option value="Viernes">Viernes</option>
                            <option value="Sabado">Sabado</option>
                            <option value="Domingo">Domingo</option>
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Fecha de Programación <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="date" name="fecha_lanzamiento" class="form-control" disabled>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Hora de Programación <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="time" name="hora_lanzamiento" class="form-control" disabled>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-form-label col-4">Comentario </label>
                    <div class="col-8">
                        <textarea  cols="30" rows="4" id="comentario" name="comentario" class="form-control"></textarea>
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
        listarPruebas();
        $.validator.setDefaults({
            submitHandler: function (form) {
                enviarDatosPrueba();
                //console.log("dasd");
            }
        });

        $('#form_pruebas').validate({
            ignore: 'input[type=hidden]',
            rules: {
                nombre : {
                    required: true
                },
                id_matriz : {
                    required: true
                },
                correo : {
                    required: true,
                    email: true,
                },
                tiempo_timbrado : {
                    required: true,
                    number: true,
                    max: 30

                },
                reintentos : {
                    required: true,
                    number: true,
                },
                tipo_lanzamiento: {
                    required: true,
                }
            },
            messages: {
                nombre : {
                    required: "Por favor ingrese nombre."
                },
                id_matriz : {
                    required: "Por favor seleccione la matriz."
                },
                correo : {
                    required: "Por favor ingrese correo electrónico.",
                    email: "Por favor ingrese un correo electrónico valido."
                },
                tiempo_timbrado : {
                    required: "Por favor ingrese tiempo de timbrado.",
                    number: "Por favor ingrese un número",
                    max: "Por favor ingrese no mayor a 30 segundos"
                },
                reintentos : {
                    required: "Por favor ingrese tiempo de reintentos.",
                    number: "Por favor ingrese un número"
                },
                tipo_lanzamiento : {
                    required: "Por favor seleccione el tipo de lanzamiento."
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
        $("#tabla_pruebas").on('change','.custom-control-input',function(){
            const id_prueba = $(this).attr('id').replace("switchActivo","");
            const activo = ($(this).prop('checked'))?'S':'N';
            $.ajax({
                type: "PUT",
                url: url_pruebas+"/"+id_prueba,
                data: {
                    activo : activo,
                    '_token': '{{ csrf_token() }}',
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
    function listarPruebas() {
        $('#tabla_pruebas').DataTable().clear().destroy();
        var table =$("#tabla_pruebas").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            buttons: [
                {
                    text: 'Crear Prueba',
                    className: 'btn btn-success',
                    action: function ( e, dt, node, config ) {
                        abrirModal();
                    }
                }
            ],
            initComplete: function () {
                setTimeout( function () {
                    table.buttons().container().appendTo( '#tabla_pruebas_wrapper .col-md-6:eq(0)' );
                }, 10 );
            },
            ajax: {
                url: url_pruebas,
                dataSrc: "pruebas"
            },
            columns: [
                { data: "id_prueba" },
                { data: "nombre" },
                { data: "matriz.nombre" },
                { data: "ejecutado" },
                { 
                    data: "fecha_lanzamiento",
                    render: function( data, type, row ) {
                        let fecha_lanzamiento= '' ;
                        if (row.programacion == 'T') { //T es CONCURRENTE
                            fecha_lanzamiento = row.dias_lanzamiento;
                        }else {
                            fecha_lanzamiento = row.fecha_lanzamiento;
                        }

                        //Carbon::parse(fecha_lanzamiento)->format('d-m-Y')
                        //date('d-m-Y', strtotime(fecha_lanzamiento));
                        return fecha_lanzamiento + ' ' +row.hora_lanzamiento;
                    }
                },
                //{ data: "tiempo_timbrado" },
                //{ data: "reintentos" },
                { 
                    data: "tipo_lanzamiento",
                    render: function (date, type, row) {
                        let tipo_lanzamiento = row.tipo_lanzamiento;
                        let is_success_danger = tipo_lanzamiento == 'Programado' ? 'success' : 'info';
                        return '<h6><span class="badge badge-'+is_success_danger+'">'+tipo_lanzamiento+'</span></h6>';
                    }
                },
                {
                    data: "programacion",
                    render: function ( data, type, row ) {
                        let programacion= '' ;
                        if (row.programacion == 'U') {
                            programacion = 'ÚNICO';
                        }else if (row.programacion == 'T') {
                            programacion = 'CONCURRENTE';
                        }
                        return  programacion;
                    }
                },
                {
                    render: function ( data, type, row ) {
                        if(row.tipo_lanzamiento === 'Programado' && row.programacion === 'T'){
                            const checked = row.activo == 'S'? 'checked' : '';
                            return '<div class="custom-control custom-switch"><input type="checkbox" '+checked+' class="custom-control-input" id="switchActivo'+row.id_prueba+'"><label class="custom-control-label" for="switchActivo'+row.id_prueba+'"></label></div>';
                        }
                        return '';
                        //return row.tipo_lanzamiento === 'Programado' && row.programacion === 'T'?' <button class="btn btn-danger btn-sm" onClick="eliminarPrueba('+row.id_prueba+')"><i class="fas fa-times"></i> Eliminar</button>' : '';                  
                    },
                    targets: 8
                },
                {
                    render: function(data, type, row) {
                        if(row.tipo_lanzamiento === 'Programado'){
                            return '<button class="btn btn-primary btn-sm" onClick="abrirModal(' + row.id_prueba + ')"><i class="fas fa-edit"></i> Editar</button> <button class="btn btn-danger btn-sm" onClick="eliminarPrueba(' + row.id_prueba + ')"><i class="fas fa-times"></i> Eliminar</button>';
                        }    
                        else if(row.tipo_lanzamiento === 'Instantaneo'){
                            return '<button class="btn btn-danger btn-sm" onClick="eliminarPrueba(' + row.id_prueba + ')"><i class="fas fa-times"></i> Eliminar</button>';
                        }
                    },
                    targets: 5
                }
                /*{
                    render: function ( data, type, row ) {
                        return ' <button class="btn btn-primary btn-sm" onClick="detallePrueba('+row.id_prueba+')"><i class="fas fa-edit"></i> Detalle</button>';                  
                    },
                    targets: 9
                }*/
            ],
            order: [[0, 'desc']]
        });
    }

    function abrirModal(id_prueba = 0) {
        const titulo_modal = id_prueba == 0 ? 'Crear Prueba' : 'Actualizar Prueba #' + id_prueba;
        $('#titulo_modal').text(titulo_modal);
        $('#id_prueba').val(id_prueba);

        limpiarFormulario('form_pruebas');
        llenarOpcionMatriz();
        $('select[name="tipo_lanzamiento"]').trigger('change');
        if(id_prueba != 0){

            /*$.ajax({
                type: "GET",
                url: url_pruebas+"/"+id_prueba,
                async: false,
                success: function (response) {
                    console.log(response)
                    $('input[name="nombre"]').val(response.prueba.nombre);
                    $('select[name="id_matriz"]').val(response.prueba.id_matriz);
                    $('input[name="correo"]').val(response.prueba.correo);
                    $("input[name='tiempo_timbrado']").val(response.prueba.tiempo_timbrado);
                    $("input[name='reintentos']").val(response.prueba.reintentos);
                    $("select[name='tipo_lanzamiento']").val(response.prueba.tipo_lanzamiento);
                    $("#comentario").val(response.prueba.comentario);
                    if (response.prueba.tipo_lanzamiento == 'Programado') {
                        $('select[name="tipo_lanzamiento"]').trigger('change');
                        $('select[name="programacion"]').val(response.prueba.programacion);
                        $('select[name="programacion"]').trigger('change');
                        if (response.prueba.programacion == 'U') {
                            $('input[name="fecha_lanzamiento"]').val(response.prueba.fecha_lanzamiento);
                            $('input[name="hora_lanzamiento"]').val(response.prueba.hora_lanzamiento);
                        } else
                        if (response.prueba.programacion == 'T'){
                            $('select[name="dias_lanzamiento"]').val(response.prueba.dias_lanzamiento.split('-'));
                            $('input[name="hora_lanzamiento"]').val(response.prueba.hora_lanzamiento);
                        }
                    }
                }
            });*/
        }
        $('#modal-default').modal('show');
    }

    function enviarDatosPrueba(){
        const id_prueba = $('#id_prueba').val();
        const tipo_envio = id_prueba == 0 ? "POST" : "PUT";
        const url_envio = id_prueba == 0 ? url_pruebas : url_pruebas+"/"+id_prueba;

        //Datos dinamicos
        let programacion = $('select[name="programacion"]').attr('disabled') == 'disabled' ? null : $('select[name="programacion"]').val();
        let dias_lanzamiento = $('select[name="dias_lanzamiento"]').attr('disabled') == 'disabled' ? null : $('select[name="dias_lanzamiento"]').val().join('-');
        let fecha_lanzamiento = $('input[name="fecha_lanzamiento"]').attr('disabled') == 'disabled' ? null : $('input[name="fecha_lanzamiento"]').val();
        let hora_lanzamiento = $('input[name="hora_lanzamiento"]').attr('disabled') == 'disabled' ? null : $('input[name="hora_lanzamiento"]').val();
        const datos_prueba = {
            nombre :  $("input[name='nombre']").val(),
            id_matriz : $("select[name='id_matriz']").val(),
            correo : $("input[name='correo']").val(),
            tiempo_timbrado : $("input[name='tiempo_timbrado']").val(),
            reintentos : $("input[name='reintentos']").val(),
            tipo_lanzamiento : $("select[name='tipo_lanzamiento']").val(),
            programacion : programacion,
            dias_lanzamiento : dias_lanzamiento,
            fecha_lanzamiento : fecha_lanzamiento,
            hora_lanzamiento : hora_lanzamiento,
            '_token': '{{ csrf_token() }}',
            'putAll': 'yes',
            id_usuario : {{Session::get('datos_usuario')['id_usuario']}},
            comentario : $("#comentario").val(),
        }
        $.ajax({
            type: tipo_envio,
            url: url_envio,
            data: JSON.stringify(datos_prueba),
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                toastr.success(response.mensaje);
                listarPruebas();
                limpiarFormulario('form_pruebas');
                $('select[name="tipo_lanzamiento"]').trigger('change');
                $('#modal-default').modal('hide');
            },
            error: function (request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("No se puede eliminar ya que este registro se esta usando.");
            }
        });
    }
    function llenarOpcionMatriz() {
        let matrices = $('select[name="id_matriz"]');
        $.ajax({
            type: "GET",
            url: url_matrices,
            async: false,
            success: function (response) {
                matrices.find('option').remove();
                matrices.append('<option value="">Seleccione</option>');
                $(response.matrices).each(function(i, v){
                    matrices.append('<option value="' + v.id_matriz + '">' + v.nombre + '</option>');
                })
            },
            error: function (request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("Error al obtener los datos.");
            }
        });
    }
    function cambiarTipoPrueba() {
        let tipo_lanzamiento = $('select[name="tipo_lanzamiento"]').val();
        $('select[name="programacion"]').attr('disabled', 'disabled');
        $('select[name="programacion"]').val('');
        deshabilitarLimpiar();
        if (tipo_lanzamiento == 'Programado') {
            $('select[name="programacion"]').removeAttr('disabled');
        }
    }
    function cambiarProgramacion() {
        let programacion = $('select[name="programacion"]').val();
        deshabilitarLimpiar();
        if (programacion == 'U') {
            $('input[name="fecha_lanzamiento"]').removeAttr('disabled');
            $('input[name="hora_lanzamiento"]').removeAttr('disabled');
        } else
        if (programacion == 'T'){
            $('select[name="dias_lanzamiento"]').removeAttr('disabled');
            $('input[name="hora_lanzamiento"]').removeAttr('disabled');
        }
    }
    function deshabilitarLimpiar() {
        $('select[name="dias_lanzamiento"]').attr('disabled', 'disabled');
        $('select[name="dias_lanzamiento"]').val('');
        $('input[name="fecha_lanzamiento"]').attr('disabled', 'disabled');
        $('input[name="fecha_lanzamiento"]').val('');
        $('input[name="hora_lanzamiento"]').attr('disabled', 'disabled');
        $('input[name="hora_lanzamiento"]').val('');
    }
    function detallePrueba(){
        $.ajax({
            type: "GET",
            url: url_pruebas+"/"+id_prueba,
            async: false,
            success: function (response) {
                console.log(response)
                $('input[name="nombre"]').val(response.prueba.nombre);
                $('select[name="id_matriz"]').val(response.prueba.id_matriz);
                $('input[name="correo"]').val(response.prueba.correo);
                $("input[name='tiempo_timbrado']").val(response.prueba.tiempo_timbrado);
                $("input[name='reintentos']").val(response.prueba.reintentos);
                $("select[name='tipo_lanzamiento']").val(response.prueba.tipo_lanzamiento);
                $("#comentario").val(response.prueba.comentario);
                if (response.prueba.tipo_lanzamiento == 'Programado') {
                    $('select[name="tipo_lanzamiento"]').trigger('change');
                    $('select[name="programacion"]').val(response.prueba.programacion);
                    $('select[name="programacion"]').trigger('change');
                    if (response.prueba.programacion == 'U') {
                        $('input[name="fecha_lanzamiento"]').val(response.prueba.fecha_lanzamiento);
                        $('input[name="hora_lanzamiento"]').val(response.prueba.hora_lanzamiento);
                    } else
                    if (response.prueba.programacion == 'T'){
                        $('select[name="dias_lanzamiento"]').val(response.prueba.dias_lanzamiento.split('-'));
                        $('input[name="hora_lanzamiento"]').val(response.prueba.hora_lanzamiento);
                    }
                }
            }
        });
    }
    function eliminarPrueba(id_prueba){
        Swal.fire({
            title: '¿Estas seguro de eliminar la prueba seleccionada?',
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
                    url: url_pruebas+"/"+id_prueba,
                    type: 'DELETE',
                    data:{
                            '_token': '{{ csrf_token() }}',
                    },
                    success: function (response) {
                        toastr.success(response.mensaje);
                        listarPruebas();
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
