@extends('layout.principal')
@section('tituloModulo', 'Equipos')
@section('contenido')
<div class="row">
    <div class="col-12">
        <div class="card">
            <!-- /.card-header -->
            <div class="card-body">
                <table id="tabla_equipos" class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Nombre</th>
                            <th>IP</th>
                            <th>Canales</th>
                            <th>Tipo</th>
                            <th>Sede</th>
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
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form id="form_equipos" class="form-nuclear">
                <div class="modal-header">
                    <h4 class="modal-title" id="titulo_modal"></h4>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="hidden" name="id_equipo" id="id_equipo">
                    <div class="form-group row">
                        <label class="col-form-label col-4">Nombre <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" name="nombre" class="form-control m-b-5">
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-form-label col-4">IP <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" name="ip" class="form-control m-b-5">
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-form-label col-4">Sede <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <select class="form-control" name="id_sede"></select>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-form-label col-4">Tipo de equipo <span class="text-danger">*</span></label>
                        <div class="col-8">
                            <select class="form-control" name="select-tipo" id="select-tipo">
                                <option value="">Seleccione</option>
                                <option value="g">Gateway GSM</option>
                                <option value="p">PBX</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-form-label col-4" id="titulo-cr"><span class="text-danger">*</span></label>
                        <div class="col-8">
                            <input type="text" id="ranuras" name="ranuras" class="form-control m-b-5">
                        </div>
                    </div>
                    <div class="modal-header">
                        <h4 class="modal-title">Canales</h4>
                        <button type="button" id="btn-canal" class="btn btn-info"> Validar Canales Seleccionados</button>
                    </div>
                    <table id="tabla_canales" class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <!--<th>Id</th>-->
                                <th>Canal</th>
                                <th>Operador</th>
                                <th>Tecnología</th>
                                <th>Slot</th>
                                <th>Número Telefonico</th>
                                <th>Opciones</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
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
<div class="modal fade" id="modal-detalle">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Detalle de equipo</h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="table-responsive">
                    <table id="tabla_detalle" class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <!--<th>Id</th>-->
                                <th>Canal</th>
                                <th>Operador</th>
                                <th>Tecnología</th>
                                <th>Estado</th>
                                <th>Número Telefonico</th>
                                <!--<th class="text-center">Opciones</th>-->
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
    let ranuras_global = 0;
    let canales_global = 0;
    let response_global = "";
    $(document).ready(function() {
        listarEquipos();
        $.validator.setDefaults({
            submitHandler: function(form) {
                enviarDatosEquipos();
            }
        });
        $('#form_equipos').validate({
            ignore: 'input[type=hidden]',
            rules: {
                nombre: {
                    required: true
                }
            },
            messages: {
                nombre: {
                    required: "Por favor ingrese números "
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
        $('#form_equipos').validate({
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

        const select_tipo = "#select-tipo";
        $(select_tipo).change(function() {
            let tipo = $("#select-tipo").val();
            if (tipo == "g") {
                $('#titulo-cr').text("Ranuras");
            } else
            if (tipo == "p") {
                $('#titulo-cr').text("Canales");
            }
        });

        $("#btn-canal").click(init_tabla_canales);
    });

    function init_tabla_canales() {
        const id_equipo = $('#id_equipo').val();
        // console.log(globales,canales_);
        let tipo = $("#select-tipo").val();
        let canales = $("#ranuras").val();
        console.log("ranuras num", ranuras_global);
        console.log("canal num", canales_global);
        if (tipo == "g") {
            console.log("ranuras global: ",ranuras_global);
            ranuras_global != 0 ? cargarCanales(ranuras_global * 4, response_global) : 4;
            crearCanales(canales * 4, ranuras_global * 4);
        } else
        if (tipo == "p") {
            console.log("canales global: ",canales_global);

            canales_global != 0 ? cargarCanales(canales_global, response_global) : 0;
            crearCanales(canales, canales_global);
        }
    }

    function listarEquipos() {
        $('#tabla_equipos').DataTable().clear().destroy();
        var table_e = $("#tabla_equipos").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            buttons: [{
                text: 'Agregar Equipo',
                className: 'btn btn-success',
                action: function(e, dt, node, config) {
                    abrirModal();
                    // abrirDetalle();
                }
            }],
            initComplete: function() {
                setTimeout(function() {
                    table_e.buttons().container().appendTo('#tabla_equipos_wrapper .col-md-6:eq(0)');
                }, 10);


            },

            ajax: {
                url: url_equipos,
                dataSrc: "equipos",

            },
            columns: [{
                    data: "id_equipo"
                },
                {
                    data: "nombre"
                },
                {
                    data: "ip"
                },
                {
                    data: "canales",
                    render: function(data, type, row) {
                        var count = 0;
                        data.forEach(canal => {
                            count = count + 1;
                        });
                        return count;
                    }
                },
                {
                    data: "tipo",
                    render: function(data, type, row) {
                        return data == 'g' ? 'GSM' : 'PBX';
                    }
                },
                {
                    data: "sede.nombre",
                },
                {
                    data: "estado",
                    render: function (data, type, row) {
                        return data == 'A' ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Desactivado</span>'
                    }
                },
                {
                    render: function(data, type, row) {
                        return '<button class="btn btn-info btn-sm" id="btn-detalle" onClick="abrirDetalle(' + row.id_equipo + ')"><i class="fas fa-info"></i> Detalle</button> <button class="btn btn-primary btn-sm" onClick="abrirModal(' + row.id_equipo + ')"><i class="fas fa-edit"></i> Editar</button> <button class="btn btn-danger btn-sm" onClick="eliminarEquipo(' + row.id_equipo + ')"><i class="fas fa-times"></i> Eliminar</button>';
                    },
                    targets: 7
                }
            ],
            order: [
                [0, 'asc']
            ]
        });
    }

    function listarCanales() {
        $('#tabla_canales').DataTable().clear().destroy();
        var table_c = $("#tabla_canales").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 8,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            initComplete: function() {
                setTimeout(function() {
                    table_c.buttons().container().appendTo('#tabla_canales_wrapper .col-md-6:eq(0)');
                }, 10);

            },
            ajax: {
                url: url_equipos,
                dataSrc: "equipos"
            },
            columns: [{
                    data: "id_equipo"
                },
                {
                    data: "nombre"
                },
                {
                    data: "ip"
                },
                {
                    data: "ranuras",
                    render: function(data, type, row) {
                        let canales = "";
                        canales = data * 4 + " Canales" + '<br>'
                        return canales;
                    }
                },
                {
                    data: "id_sede",
                    render: function(data, type, row) {
                        return resolver_sede(data);
                    }
                },
                {
                    data: "estado",
                    render: function(data, type, row) {
                        let tecnologias = "";
                        tecnologias = " "
                        console.log(tecnologias);
                        return tecnologias;
                    }
                },
                {
                    render: function(data, type, row) {
                        return '<button class="btn btn-info" id="btn-detalle" onClick="abrirDetalle(' + row.id_equipo + ')"">Detalle</button> <button class="btn btn-primary btn-sm" onClick="abrirModal(' + row.id_equipo + ')"><i class="fas fa-edit"></i> Editar</button> <button class="btn btn-danger btn-sm"><i class="fas fa-times"></i> Eliminar</button>';
                    },
                    targets: 5
                }
            ],
            order: [
                [0, 'asc']
            ]
        });
    }

    function borrarFila() {
        $(document).on('click', '.btn', function() {
            $(this).parent().parent('tr').remove();
        });
    }

    function borrarRanura(clase) {
        Swal.fire({
            title: 'Se eliminarán 4 canales de la misma ranura, ¿estás seguro?',
            //text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: 'No',
            confirmButtonText: 'Si'
        }).then((result) => {
            if (result.value) {
               // $("."+clase).remove();
               console.log("elimina ranura",result.value);
            }
        })
    }

    function abrirModal(id_equipo = 0) {
        // init_tabla_canales();
        $('#tabla_canales').DataTable().clear().destroy();
        const titulo_modal = id_equipo == 0 ? 'Crear Equipo' : 'Actualizar Equipo';
        console.log(id_equipo, "ID");
        $('#titulo_modal').text(titulo_modal);
        $('#id_equipo').val(id_equipo);
        limpiarFormulario('form_equipos');
        llenarOpcionSede();
        $('select[name="select-tipo"]').prop('disabled', '');

        $(document).on('click', '.btn-eliminar', function() {
            let tipo = $("#select-tipo").val();
            if (tipo == "g") {
                console.log("eliminar por ranuras",$(this).parent().parent().attr("class"));
                var clase = $(this).parent().parent().attr("class");
                //borrarRanura(clase);
                $("."+clase).remove();

            } else
            if (tipo == "p") {
                $(this).parent().parent('tr').remove();
            }

        });

        if (id_equipo != 0) {
            $.ajax({
                type: "GET",
                url: url_equipos + "/" + id_equipo,
                success: function(response) {
                    console.log(response, " AJAX:");
                    response_global = response;
                    $('input[name="nombre"]').val(response.equipo_response.nombre);
                    $('input[name="ip"]').val(response.equipo_response.ip);
                    $('select[name="id_sede"]').val(response.equipo_response.id_sede);
                    $('select[name="select-tipo"]').val(response.equipo_response.tipo);
                    $('select[name="select-tipo"]').prop('disabled', 'disabled');
                    console.log("TIPO-", response.equipo_response.tipo);
                    console.log("TIPO-", "resppo");

                    if (response.equipo_response.ranuras == 0) {
                        let count = 0;
                        response.equipo_response.canales.forEach(canal => {
                            count = count + 1;
                        });
                        console.log("canales contados: ", count);
                        $('input[name="ranuras"]').val(count);
                        $('#titulo-cr').text("Canales");
                        cargarCanales(count, response);
                        canales_global = count;
                    } else {
                        const ranuras_ = response.equipo_response.ranuras;
                        console.log("numero ranuras:", ranuras_);
                        $('input[name="ranuras"]').val(ranuras_);
                        $('#titulo-cr').text("Ranuras");
                        cargarCanales(ranuras_ * 4, response);
                        ranuras_global = ranuras_;
                    }

                },
                error: function(request, status, error) {
                    //toastr.error(request.responseText);
                    toastr.error("Error al obtener los datos.");
                }
            });
        }
        else{
            response_global = "";
            canales_global = 0;
            ranuras_global = 0;
        }

        $('#modal-default').modal('show');
    }

    function abrirDetalle(id_equipo) {
        const titulo_modal = 'Detalle de equipo';
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
                url: url_equipos + "/" + id_equipo,
                dataSrc: "equipo_response.canales"
            },
            columns: [
                {
                    data: "posicion",
                    render: function(data,type,row){
                        let i = data + 1;
                        return /*"Canal "+*/i;
                    }
                    // data: null,
                },
                {
                    data: "id_operador",
                    render: function(data, type, row) {
                        if (row.id_tecnologia_operador != null) {
                            return row.nombre_operador
                        }
                        return '';
                    }
                },
                {
                    data: "id_tecnologia",
                    render: function(data, type, row) {
                        if (row.id_tecnologia_operador != null) {
                            return row.nombre_tecnologia
                        }
                        return '';
                    }
                },
                {
                    data: "estado"
                },
                {
                    data: "numero",
                }
                ,
                // {
                //     data: "posicion",
                //     render: function(d,t,r){
                //         return " ";
                //     }
                    
                // }
            ],
            "columnDefs": [
                {
                    // "searchable": true,
                    // "orderable": true,
                    "targets": 4
                }
            ],
            order: [
                [0, 'asc']
            ]
        });
        // table_d.on( 'order.dt search.dt', function () {
        //     table_d.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
        //         let numero_canal = i+1;
        //         cell.innerHTML = "Canal "+ numero_canal;
        //     } );
        // } ).draw();
        $('#modal-detalle').modal('show');
    }

    function listarOperadores() {
        let operadores = "";
        let tecnologias = "";
        $.ajax({
            type: "GET",
            async: false,
            url: url_operadores,
            success: function(response) {
                console.log(response, " AJAX:");
                operadores = response.operadores;
                // tecnologias = response.operadores.tecnologias.nombre;
            }
        });
        console.log("obteniendo tecnologias: ", operadores);
        return operadores;
    }

    function listarTecnologias() {
        let tecnologias = "";
        $.ajax({
            type: "GET",
            async: false,
            url: url_tecnologias,
            success: function(response) {
                //console.log(response, " AJAX:");
                tecnologias = response.tecnologias;
            }
        });
        return tecnologias;
    }

    function listarTecnologiasPorOperador(id) {
        let tecnologias = "";
        $.ajax({
            type: "GET",
            async: false,
            url: url_operadores+"/"+id,
            success: function(response) {
                // console.log(" AJAX listarTecnologiasPorOperador:", response.operador.tecnologias );
                tecnologias = response.operador.tecnologias;
            }
        });
        return tecnologias;
    }

    function crearCanales(canales, contador) {

        response_global ? $('#tabla_canales .canales_temporales').DataTable().clear().destroy() : $('#tabla_canales').DataTable().clear().destroy();
        console.log("Canales:  ", canales);
        let counter = 0;
        let operadores = listarOperadores();
        let tecnologias = listarTecnologias();
        let tecnologias2 = listarTecnologiasPorOperador(1);
        console.log("canales canales ", canales);
        for (; contador < canales; contador++) {
            let col_canal = '<tr class="ranura_' + (Math.floor(contador / 4) + 1) + '" id="row_' + (contador + 1) + '" class="canales_temporales"><td>Canal ' + (contador + 1) + '</td>';

            let col_operador = '<td><select name="op_' + contador + '" class="form-control select_operador"  id="op_' + contador +'">'; //<option value="">Movistar del Perú</option><option value="">America Movil</option></select></td>';
            col_operador += '<option value="">Seleccione</option>';
            operadores.forEach(operador => {
                col_operador += '<option value="' + operador.id_operador_telefonico + '">' + operador.nombre + '</option>';
            });
            col_operador += '</select></td>';

            let col_tecnologia = '<td><select name="tec_' + contador + '" class="form-control"id="tec_' + contador +'">';
            col_tecnologia += '<option value="">Seleccione</option>'
   
            col_tecnologia += '</select></td>';

            let col_slot = '<td class="slot_' + (Math.floor(contador / 4) + 1) + '" id="Slot_' + (contador + 1) + '">Slot ' + (Math.floor(contador / 4) + 1) + '</td>';

            let col_numeros = '<td><input type="text" id="numero" name="numero" class="form-control m-b-5"></td>';

            let col_opciones = '<td><button class="btn btn-danger btn-eliminar"><i class="fa fa-trash-o"></i>Eliminar</button></td></tr>';

            let tableBody = $("#tabla_canales tbody");

            tableBody.append(col_canal + col_operador + col_tecnologia + col_slot + col_numeros + col_opciones);
        }

        for(let i = 0; i<canales; i++){
            const op_temp = "#op_"+i;
            const tec_temp = "#tec_"+i;
            $(op_temp).change(function() {
                let tipo = $(op_temp).val();
                console.log("tipo seleccionado: ", tipo);
                console.log("tipo 1: ", tipo);
                let tecnologias_ = listarTecnologiasPorOperador(tipo);
                console.log("sutecnologias_b 1: ", tecnologias_[0].nombre);
                $(tec_temp).empty();
                tecnologias_.forEach(tecnologia => {
                    $(tec_temp).append(`<option value="${tecnologia.id_tecnologia}">
                                    ${tecnologia.nombre}
                                </option>`);
                });
            
            });
        }    
        // var opera = document.getElementById('select_operador');
        // var tecno = document.getElementById('select_tec');

        // opera.addEventListener('change', function () {
        //     selectOptionDynamic(this, 'select_tec', cars)
        // });
    }

    function cargarCanales(canales, response) {
        $('#tabla_canales').DataTable().clear().destroy();
        console.log("Canales cargar:  ", canales);
        console.log("response cargar", response);
        let counter = 0;
        let operadores = listarOperadores();
        let tecnologias = listarTecnologias();
        console.log("operadores crear ", operadores);
        for (let i = 0; i < canales; i++) {
            let id_canal = response.equipo_response.canales[i].id_canal;
            let col_canal = '<tr class="ranura_' + (Math.floor(i / 4) + 1) + '" id="row_' + (i + 1) + '"><td>Canal ' + (i + 1) + '<input name="id_canal" type="hidden" value="'+id_canal+'"></td>';

            let col_operador = '<td><select name="op_' + i + '" id="op_' + i +'" class="form-control" >'; //<option value="">Movistar del Perú</option><option value="">America Movil</option></select></td>';


            operadores.forEach(operador => {
                col_operador += '<option value="' + operador.id_operador_telefonico + '">' + operador.nombre + '</option>';
            });
            col_operador += '</select></td>';

            let col_tecnologia = '<td><select name="tec_' + i + '" id="tec_' + i +'" class="form-control">';
            tecnologias.forEach(tecnologia => {
                col_tecnologia += '<option value="' + tecnologia.id_tecnologia + '">' + tecnologia.nombre + '</option>';
            });
            col_tecnologia += '</select></td>';

            console.log("*************************");
            let posicion = response.equipo_response.canales.filter(function ( canal) { return canal.posicion == i; });
            // console.log(posicion);
            console.log("*************************");

            let col_slot = '<td class="slot_' + (Math.floor(i / 4) + 1) + '" id="Slot_' + (i + 1) + '">Slot ' + posicion[0]["nro_ranura"] + '</td>';

            let col_numeros = '<td><input type="text" id="numero" name="numero" value="' + posicion[0]["numero"]  + '" class="form-control m-b-5"></td>';

            let col_opciones = '<td><button class="btn btn-danger btn-eliminar"><i class="fa fa-trash-o"></i>Eliminar</button></td></tr>';

            let tableBody = $("#tabla_canales tbody");

            tableBody.append(col_canal + col_operador + col_tecnologia + col_slot + col_numeros + col_opciones);

            $('select[name="op_' + i + '"]').val(posicion[0]['id_operador']);
            $('select[name="tec_' + i + '"]').val(posicion[0]['id_tecnologia']);
            console.log("oper", posicion[0]["nombre_operador"]);
            console.log("tec_", posicion[0]["nombre_tecnologia"]);
        }
        $('select[name="op_"]').val(response.equipo_response.canales[0].id_operador);

        for(let i = 0; i<canales; i++){
            const op_temp = "#op_"+i;
            const tec_temp = "#tec_"+i;
            $(op_temp).change(function() {
                let tipo = $(op_temp).val();
                console.log("tipo op_temp: ", op_temp);
                console.log("tipo tec_temp: ", tec_temp);
                // console.log("tipo 1: ", tipo);
                let tecnologias_ = listarTecnologiasPorOperador(tipo);
                // console.log("sutecnologias_b 1: ", tecnologias_[0].nombre);
                $(tec_temp).empty();
                console.log(" $(tec_temp).empty(); ",  $(tec_temp).empty());

                tecnologias_.forEach(tecnologia => {
                    $(tec_temp).append(`<option value="${tecnologia.id_tecnologia}">
                                    ${tecnologia.nombre}
                                </option>`);
                });
            
            });
        }   

    }

    function enviarDatosEquipos() {
        const id_equipo = $('#id_equipo').val();
        const tipo_envio = id_equipo == 0 ? "POST" : "PUT";
        const url_envio = id_equipo == 0 ? url_equipos : url_equipos + "/" + id_equipo;
        //const url_envio = url_equipos;

        console.log("envio url; ", url_envio);
        //Obtener array con los id de los submodulos seleccionados
        let canales = [];
        $("#tabla_canales tbody tr").each(function(index, tr) {
            console.log(tr);
            //console.log(tr.children[0].children[1].value);

            let datos_canal = {
                id_operador: parseInt(tr.children[1].children[0].value),
                id_tecnologia: parseInt(tr.children[2].children[0].value),
                nro_ranura: parseInt(tr.children[3].innerHTML[5]),
                numero: tr.children[4].children[0].value
            }
            if(tr.children[0].children[1]){
                datos_canal.id_canal = parseInt(tr.children[0].children[1].value)
            }
            canales.push(datos_canal);
        });

        //console.log(canales);
        var tipo = $("#select-tipo").val();
        let ranura = tipo == "g" ? $("input[name='ranuras']").val() : 0;
        console.log($("#numero").val());
        const datos_equipo = {
            nombre: $("input[name='nombre']").val(),
            ip: $("input[name='ip']").val(),
            tipo: tipo[0],
            ranuras: parseInt(ranura),
            id_sede: parseInt($("select[name='id_sede']").val()),
            canales: canales,
            '_token': '{{ csrf_token() }}'
        }
        // console.log(datos_equipo);
        // console.log("JSON: ", JSON.stringify(datos_equipo));
        $.ajax({
            type: tipo_envio,
            url: url_envio,
            data: JSON.stringify(datos_equipo),
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function(response) {
                toastr.success(response.mensaje);
                listarEquipos();
                limpiarFormulario('form_equipos');
                $('#modal-default').modal('hide');
            },
            error: function(request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("No se puede eliminar ya que este registro se esta usando.");
            }
        });
    }

    function llenarOpcionSede() {
        let sedes = $('select[name="id_sede"]');
        $.ajax({
            type: "GET",
            url: url_sedes,
            async: false,
            success: function(response) {
                sedes.find('option').remove();
                sedes.append('<option value="">Seleccione</option>');
                $(response.sedes).each(function(i, v) {
                    sedes.append('<option value="' + v.id_sede + '">' + v.nombre + '</option>');
                })
            },
            error: function(request, status, error) {
                //toastr.error(request.responseText);
                toastr.error("Error al obtener los datos.");
            }
        });
    }

    function eliminarEquipo(id_equipo) {
        Swal.fire({
            title: '¿Estas seguro de eliminar el equipo seleccionado?',
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
                    url: url_equipos + "/" + id_equipo,
                    type: 'DELETE',
                    data:{
                            '_token': '{{ csrf_token() }}',
                    },
                    success: function(response) {
                        toastr.success(response.mensaje);
                        listarEquipos();
                    },
                    error: function(request, status, error) {
                        //toastr.error(request.responseText);
                        toastr.error("Error al eliminar : Este registro esta siendo utilizado.");
                    }
                });
            }
        })

    }
</script>
@endsection
