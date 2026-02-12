@extends('layout.principal')
@section('tituloModulo', 'Matrices Restringido')
@section('contenido')
<div class="row">
    <div class="col-12">
      <div class="card">
        <!-- /.card-header -->
        <div class="card-body">
          <table id="tabla_matrices" class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Nombre</th>
                    <th class="text-center">Opciones</th>
                </tr>
            </thead>
            <tbody>
                <!--<tr>
                    <td>1</td>
                    <td>Matriz 1</td>
                    <td align="center">
                        <button class="btn btn-info">Detalle</button>
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
<div class="modal fade" id="modal-default" style="overflow-y: scroll;">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title" id="titulo_modal"></h2>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <form id="form_matrices">
            <input type="hidden" name="id_matriz" id="id_matriz">
            <div class="modal-body">
                <div class="row">
                    <label class="col-form-label col-4">Nombre <span class="text-danger">*</span></label>
                    <div class="col-6">
                        <input type="text" name="nombre" class="form-control m-b-5" >
                    </div>
                </div>
                <br>
                <div class="row">
                    <button type="button" class="btn btn-success" onclick="abrirModalDatosMatriz()">Generar</button>
                </div>
                <br>
                <div class="row">
                    <table class="table table-bordered" id="tabla_data_matriz">
                        <thead>
                            <tr>
                                <th>Origen</th>
                                <th>Destino</th>
                                <th>Opciones</th>
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
<!-- Modal -->
<div class="modal fade" id="modal-default2" >
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
            <h4 class="modal-title">Origen</h4>
        </div>
        <form id="form_datos_matrices">
            <div class="modal-body">
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">Equipos</label>
                    <div class="col-sm-10">
                    <select class="form-control" name="select_equipos_origen" onchange="llenarOpcionCanales('select_equipos_origen','select_canales_origen')"></select>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">Canales</label>
                    <div class="col-sm-10">
                    <select class="form-control" name="select_canales_origen" disabled></select>
                    </div>
                </div>
            </div>
            <div class="modal-header">
                <h4 class="modal-title">Destino</h4>
            </div>
            <div class="modal-body">
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">Tipo</label>
                    <div class="col-sm-10">
                    <select class="form-control" name="select_destinos" onchange="seleccionarTipoDestino()">
                        <option value="">Seleccione...</option>
                        <option value="C">Canales</option>
                        <option value="E">Número Externo</option>
                    </select>
                    </div>
                </div>
                <div id="destinos_matriz">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" data-dismiss="modal">Cerrar</button>
                <button type="submit" class="btn btn-success" >Agregar</button>
            </div>
        </form>
      </div>
    </div>
</div>
<div class="modal fade" id="modal-detalle">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Detalle de Matriz</h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="table-responsive">
                    <table id="tabla_detalle" class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Origen</th>
                                <th>Tipo</th>
                                <th>Destino</th>
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
    $(document).ready(function () {
        listarMatrices();
        $.validator.setDefaults({
            submitHandler: function (form) {
                enviarDatosMatriz();
                //console.log(convertirTablaJson());
            }
        });
        $('#form_matrices').validate({
            ignore: 'input[type=hidden]',
            rules: {
                nombre : {
                    required: true
                }
            },
            messages: {
                nombre : {
                    required: "Por favor ingrese nombre."
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
        $('#form_datos_matrices').validate({
            ignore: 'input[type=hidden]',
            rules: {
                select_equipos_origen : {
                    required: true
                },
                select_destinos : {
                    required: true
                }
            },
            messages: {
                select_equipos_origen : {
                    required: "Por favor seleccione equipo de canales de origen."
                },
                select_destinos : {
                    required: "Por favor seleccione el tipo de destino."
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
            },
            submitHandler: function(form) {
                agregarDatos();
            }
        });
    });
    function listarMatrices(){
        $('#tabla_matrices').DataTable().clear().destroy();
        var table =$("#tabla_matrices").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            buttons: [
                {
                    text: 'Generar matriz',
                    className: 'btn btn-success',
                    action: function ( e, dt, node, config ) {
                        //$('#modal-default').modal('show');
                        abrirModal();
                    }
                }
            ],
            initComplete: function () {
                setTimeout( function () {
                    table.buttons().container().appendTo( '#tabla_matrices_wrapper .col-md-6:eq(0)' );
                }, 10 );
            },
            ajax: {
                url: url_matrices,
                dataSrc: "matrices"
            },
            columns: [
                { data: "id_matriz" },
                { data: "nombre" },
                {
                    render: function ( data, type, row ) {
                        return '<button class="btn btn-info btn-sm" onClick="abrirDetalle(' + row.id_matriz + ')"><i class="fas fa-info"></i> Detalle</button> <button class="btn btn-primary btn-sm" onClick="abrirModal('+row.id_matriz+')"><i class="fas fa-edit"></i> Editar</button> ';
                    },
                    targets: 3
                }
            ],
            order: [[0, 'asc']]
        });
    }
    function abrirModal(id_matriz = 0) {
        const titulo_modal = id_matriz == 0 ? 'Generar Matriz' : 'Actualizar Matriz';
        $('#titulo_modal').text(titulo_modal);
        $('#id_matriz').val(id_matriz);
        limpiarFormulario('form_matrices');
        llenarOpcionEquipos('select_equipos_origen');
        $("#tabla_data_matriz > tbody").empty();
        
        if(id_matriz != 0){
            $.ajax({
                type: "GET",
                url: url_matrices+"/"+id_matriz,
                async: false,
                success: function (response) {
                    console.log("response matriz id: ", response);
                    $('input[name="nombre"]').val(response.matriz.nombre);
                    $(response.matriz.conexiones).each(function(i, v){
                        let destino = v.tipo == 'C'? "Canal "+ v.canal_destino.id_canal : v.nombre;
                       
                            if (v.tipo == 'C') {
                                let tecnology = v.canal_origen.tecnologia_operador.tecnologia;
                                let  numero_temp = v.canal_origen.numero;
                                
                                $("#tabla_data_matriz > tbody").append("<tr><td>"+v.id_canal_origen+"-Canal "+" - "+ tecnology.nombre+" - "+ v.canal_origen.tecnologia_operador.operador.nombre+" - "+numero_temp+ "</td><td>"+v.canal_destino.id_canal+"-Canal "+" - "+ v.canal_destino.tecnologia_operador.tecnologia.nombre+ " - " +v.canal_destino.tecnologia_operador.operador.nombre+ " - " +v.canal_destino.numero+"</td></tr>");
                            }
                            else { 
                                let tecnology = v.canal_origen.tecnologia_operador.tecnologia;
                                let numero_externo = v.numero_externo.id_numero_externo ;
                                let  numero_temp = v.canal_origen.numero;

                                $("#tabla_data_matriz > tbody").append("<tr><td>"+v.id_canal_origen+"-Canal "+" - "+ tecnology.nombre+" - "+ v.canal_origen.tecnologia_operador.operador.nombre+" - "+numero_temp+ "</td><td>"+  v.numero_externo.id_numero_externo+ " - "+ v.numero_externo.nombre+ " - " + v.numero_externo.numero+"</td>/tr>");
                            }
                    });
                }
            });
        }
        $('#modal-default').modal('show');
    }
    function enviarDatosMatriz(){
        const id_matriz = $('#id_matriz').val();
        const tipo_envio = id_matriz == 0 ? "POST" : "PUT";
        const url_envio = id_matriz == 0 ? url_matrices : url_matrices+"/"+id_matriz;
        console.log("id_matriz",id_matriz);
        
        console.log("url_envio",url_envio);
        console.log("tipo_envio",tipo_envio);

        const datos_matriz = {
            nombre :  $("input[name='nombre']").val(),
            matriz_data : convertirTablaJson()
        }
        console.log("datos_matriz",datos_matriz);

        $.ajax({
            type: tipo_envio,
            url: url_envio,
            data: JSON.stringify(datos_matriz),
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                toastr.success(response.mensaje);
                listarMatrices();
                limpiarFormulario('form_matrices');
                $('#modal-default').modal('hide');
            },
            error: function (request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("No se puede eliminar ya que este registro se esta usando.");
            }
        });
    }
    function llenarOpcionEquipos(option_select){
        //let equipos = $('select[name="select_equipos"]');
        let equipos = $('select[name="'+option_select+'"]');
        $.ajax({
            type: "GET",
            url: url_equipos,
            async: false,
            success: function (response) {
                equipos.find('option').remove();
                equipos.append('<option value="">Seleccione</option>');
                $(response.equipos).each(function(i, v){
                    equipos.append('<option value="' + v.id_equipo + '">' + v.nombre + '</option>');
                })
            },
            error: function (request, status, error) {
                toastr.error("Error al obtener los datos.");
            }
        });
    }
    function llenarOpcionCanales(option_select_equipo,option_select_canal_origen){
        if($('select[name="select_equipos_origen"]').val() == ''){
            $('select[name="select_canales_origen"]').attr('disabled','disabled');
            return false;
        }
        let canales = $('select[name="'+option_select_canal_origen+'"]');
        const id_equipo = $('select[name="'+option_select_equipo+'"]').val();
        $.ajax({
            type: "GET",
            url: url_equipos+'/'+id_equipo,
            async: false,
            success: function (response) {
                canales.removeAttr('disabled');
                canales.find('option').remove();
                canales.append('<option value="">Seleccione</option>');
                $(response.equipo_response.canales).each(function(i, v){
                    if (v.numero != undefined) {
                        canales.append('<option value="' + v.id_canal + '"> Canal ' + v.id_canal +' - '+v.nombre_operador+' - '+v.nombre_tecnologia+' - '+v.numero+'</option>');
                    }
                })
            },
            error: function (request, status, error) {
                toastr.error("Error al obtener los datos.");
            }
        });
    }
    function llenarOpcionNumerosExternos(){
        let numeros_externos = $('select[name="select_numeros_externos"]');
        $.ajax({
            type: "GET",
            url: url_externos,
            async: false,
            success: function (response) {
                numeros_externos.find('option').remove();
                numeros_externos.append('<option value="">Seleccione</option>');
                $(response.numerosExternos).each(function(i, v){
                    numeros_externos.append('<option value="' + v.id_numero_externo + '"> ' + v.nombre +' - '+v.numero+'</option>');
                })
            },
            error: function (request, status, error) {
                toastr.error("Error al obtener los datos.");
            }
        });
    }
    function seleccionarTipoDestino(){
        const tipo_destino = $('select[name="select_destinos"]').val();
        const div = $('#destinos_matriz');
        div.html('');
        if(tipo_destino == 'C'){
            const select_equipos  = 'select_equipos_destino';
            const select_canales = 'select_canales_destino';
            let html_c = '<div class="form-group row">';
            html_c += '    <label class="col-sm-2 col-form-label">Equipos</label>';
            html_c += '    <div class="col-sm-10">';
            html_c += '      <select class="form-control" name="select_equipos_destino" onchange="llenarOpcionCanales(\''+select_equipos+'\',\''+select_canales+'\')"></select>';
            html_c += '    </div>';
            html_c += '</div>';
            html_c += '<div class="form-group row">';
            html_c += '    <label class="col-sm-2 col-form-label">Canales</label>';
            html_c += '    <div class="col-sm-10">';
            html_c += '      <select class="form-control" name="select_canales_destino" disabled required></select>';
            html_c += '    </div>';
            html_c += '</div>';
            div.html(html_c);
            llenarOpcionEquipos('select_equipos_destino');
        }else
        if(tipo_destino == 'E'){
            let html_e = '<div class="form-group row">';
            html_e += '    <label class="col-sm-2 col-form-label">Números Externos</label>';
            html_e += '    <div class="col-sm-10">';
            html_e += '      <select class="form-control" name="select_numeros_externos" required></select>';
            html_e += '    </div>';
            html_e += '</div>';
            div.html(html_e);
            llenarOpcionNumerosExternos();
        }
    }
    function abrirModalDatosMatriz() {
        $('select[name="select_canales_origen"]').attr('disabled','disabled');
        $('#destinos_matriz').html('');
        $('#form_datos_matrices')[0].reset();
        $('#modal-default2').modal('show');
    }
    function agregarDatos() {
        let origen = datoFila("select_canales_origen");
        let tipo  = $('select[name="select_canales_destino"]').val() ? 'C' : 'E' ;
        let destino  = $('select[name="select_canales_destino"]').val() ? datoFila("select_canales_destino") : datoFila("select_numeros_externos") ;
        const fila = "<tr><td>"+origen+"</td><td>"+destino+"</td><td><button class='btn btn-danger btn-sm' onClick='eliminarDato(this)'><i class='fas fa-times'></i> </button></td></tr>"
        $("#tabla_data_matriz > tbody").append(fila);
        $('#modal-default2').modal('hide');
    }
    function eliminarDato(element) {
        $(element).closest('tr').remove();
    }
    function datoFila(select_name){
        const nombre = $('select[name="'+select_name+'"]').val()+"-"+$('select[name="'+select_name+'"] option:selected').text();
        // const nombre = $('select[name="'+select_name+'"]').val()+"__"+$('select[name="'+select_name+'"]option:selected').text();
        return nombre;
    }
    function convertirTablaJson(){
        var rows = [];
        $('#tabla_data_matriz tbody tr').each(function(i, n){
            var $row = $(n);
            let id_canal_origen = $row.find('td:eq(0)').text().trim().split('-')[0];
            let id_destino = $row.find('td:eq(1)').text().trim().split('-')[0];
            let tipo = $row.find('td:eq(1)').text().trim().split('-')[1].includes('Canal') ? 'C' : 'E';
            rows.push({
                id_canal_origen: $row.find('td:eq(0)').text().trim().split('-')[0],
                id_destino:   $row.find('td:eq(1)').text().trim().split('-')[0],
                tipo : tipo
            });
        });
        //return JSON.stringify(rows);
        return rows;
    }

    function abrirDetalle(id_matriz) {
        const titulo_modal = 'Detalle de Matriz';
        $('#tabla_detalle').DataTable().clear().destroy();
        var table_d = $("#tabla_detalle").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            ajax: {
                url: url_matrices + "/" + id_matriz,
                dataSrc: "matriz.conexiones"
            },
            columns: [
                {
                    data: "canal_origen.id_canal",
                    render: function(data, type, row) {
                        return "Canal " + data 
                        +' - '+ row.canal_origen.tecnologia_operador.tecnologia.nombre
                        +' - '+ row.canal_origen.tecnologia_operador.operador.nombre
                        +' - '+ row.canal_origen.numero;
                       
                    }
                },
                {
                    data: "tipo",
                    render: function(data, type, row) {
                        return row.tipo == 'C' ? 'Canal -> Canal' : 'Canal -> Número Externo';
                    }
                },
                {
                    data: "data_destino",
                    render: function(data, type, row) {
                        let data_destino = row.tipo === 'C' ? 
                        "Canal "+ row.canal_destino.id_canal 
                        + ' - ' + row.canal_destino.tecnologia_operador.tecnologia.nombre
                        + ' - ' + row.canal_destino.tecnologia_operador.operador.nombre 
                        + ' - ' + row.canal_destino.numero
                        : 
                        ""+ row.numero_externo.id_numero_externo 
                        + ' - ' + row.numero_externo.nombre
                        + ' - ' + row.numero_externo.numero

                        return data_destino;
                    }
                }
            ],
            order: [
                [0, 'asc']
            ]
        });
        $('#modal-detalle').modal('show');
    }

    function eliminarMatriz(id_matriz){
        Swal.fire({
            title: '¿Estas seguro de eliminar la matriz seleccionada?',
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
                    url: url_matrices+"/"+id_matriz,
                    type: 'DELETE',
                    success: function (response) {
                        toastr.success(response.mensaje);
                        listarMatrices();
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
