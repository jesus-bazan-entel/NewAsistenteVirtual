@extends('layout.principal')
@section('tituloModulo', 'Reporte de pruebas')
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
                            <th>Email</th>
                            <th>Fecha de Inicio</th>                      
                            <th>Tipo de Lanzamiento</th>
                            <th>Programación</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th class="text-center">Opciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!--tr>
                    <td>1</td>
                    <td>Lanzador 1</td>
                    <td>Matriz 1</td>
                    <td>rpadilla@newip.pe</td>
                    <td>20 segundos</td>
                    <td>4</td>
                    <td>Inmediato</td>
                    <td>Lanzamiento único</td>
                    <td align="center">
                        <button onclick="abrirDetalle()" class="btn btn-info">Detalle</button>
                    </td>
                </tr-->
                    </tbody>
                </table>
            </div>
            <!-- /.card-body -->
        </div>
        <!-- /.card -->
    </div>
    <!-- /.col -->
</div>
<div class="modal fade" id="modal-detalle">
    <div class="modal-dialog modal-lg" style="max-width:95%;">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title" id="titulo_modal"></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <!-- <div class="card-body align-items-center d-flex justify-content-center" id="grafico">
                </div> -->
                <!-- <button onclick="generatePDF()"  type="button" id="pdf_generate" class="btn btn-info" data-dismiss="modal">PDF</button> -->
            </div>
            <div class="modal-body">
                <div class="card-body align-items-center d-flex justify-content-center" id="grafico">
                    <!--<div id="donut-chart" style="height: 300px;"></div>-->
                </div>
                <button onclick="generatePDF()"  type="button" id="pdf_generate" class="btn btn-info" data-dismiss="modal">PDF</button>
                <div class="div_detalle" style="overflow-x: auto;">
                    <table id="detalle_prueba" class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Origen</th>
                                <th>Destino</th>
                                <th>Resultado Salida</th>
                                <th>Hora Salida</th>
                                <th>HangUp Cause</th>
                                <th>Resultado Entrada</th>
                                <th>Hora Entrada</th>
                                <th>Resultado Final</th>
                                <th>MOS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!--<tr>
                                <td>Canal 1</td>
                                <td>OK</td>
                            </tr>-->
                        </tbody>
                    </table>
                </div>    
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" data-dismiss="modal">Cerrar</button>
                <!-- <button type="button" class="btn btn-primary">Guardar</button> -->
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>
@endsection
@section('javascript')
<script src="js/jsPDF/dist/jspdf.min.js"></script>
<script>
    let fecha_creacion = "";
    let fecha_lanzamiento = "";
    let nombre_prueba ="";
    let numero_escenarios ="";
    let nombre_ejecutor ="";
    let nombre_matriz ="";
    let idejecucion_v1 = '';
    let resultadoSalida_temp = '';
    let resultadoFinal_temp = '';
    let resultadosMalos = 0;
    let resultadosBuenos = 0;
    let resultadosPendientes = 0;
    let array_ejecuciones = [];

     $(document).ready(function() {
        listarReporte_pruebas();
    });

    function generatePDF(){
        console.log("idEjecucion: ",idejecucion_v1);
        console.log(url_pdf+'/'+idejecucion_v1+'.pdf');
        // console.log(window.open());
        let idejecucion ='';
        

        var doc = new jsPDF('p', 'pt', 'letter','x','y');  
        var htmlstring = '';  
        var tempVarToCheckPageHeight = 0;  
        var pageHeight = 0;  
        var ar = "test"
        pageHeight = doc.internal.pageSize.height;  
        specialElementHandlers = {  
            // element with id of "bypass" - jQuery style selector  
            '#bypassme': function(element, renderer) {  
                // true = "handled elsewhere, bypass text extraction"  
                return true  
            }  
        };  
        margins = {  
            top: 150,  
            bottom: 60,  
            left: 40,  
            right: 40,  
            width: 600  
        };  
        var y = 70;  
        doc.setLineWidth(2); 
        doc.setFontSize(25); 
        doc.setFontStyle('bold');
        doc.text(200, y = y + 30, "Detalle de Ejecución"); 
       
        doc.setFontSize(12); 
        doc.setFontStyle('normal');

        doc.text(40, y = y + 40, "Nombre:");  
        doc.text(200, y, nombre_prueba);  
        doc.text(40, y = y + 20, "Fecha Inicio:");  
        doc.text(200, y, fecha_creacion);  
        doc.text(40, y = y + 20, "Fecha Fin:");  
        doc.text(200, y, fecha_lanzamiento);  
        doc.text(40, y = y + 20, "Usuario ejecutor:");  
        doc.text(200, y, nombre_ejecutor);  
        doc.text(40, y = y + 20, "Matriz aplicada:");  
        doc.text(200, y, nombre_matriz);  
        doc.text(40, y = y + 20, "Cantidad de Escenarios:");  
        doc.text(200, y, numero_escenarios.toString());  

        doc.autoTable({  
            html: '#detalle_prueba',  
            startY: 260,  
            theme: '',  
            columnStyles: {  
                0: {  
                    cellWidth: 70,  
                    
                },  
                1: {  
                    cellWidth: 70,  
                },  
                2: {  
                    cellWidth: 60,  
                }, 
                3: {  
                    cellWidth: 55,  
                },  
                4: {  
                    cellWidth: 60,  
                }, 
                5: {  
                    cellWidth: 55,  
                },
                6: {  
                    cellWidth: 60,  
                },
                // 7: {  
                //     cellWidth: 40,  
                // },
                7: {  
                    cellWidth: 60,  
                }  
            },  
            styles: {  
                minCellHeight: 30  
            }  
        })  
        doc.save('Reporte_Prueba.pdf');  

    }
    function otroajax(id){
        console.log("idEjecucion: ",id);
        let idejecucion =[];

        $.ajax({
            url: url_pruebas+"/"+id,
            method: 'get',
            dataType: 'json',
            async: false,
            success: function (data){
                // console.log("id prueba ajax url_pruebas ",id);
                // console.log("id ejecu url_pruebas ",data.prueba.ejecuciones[0].id_ejecucion);
            //    for (const iterator of data.prueba.ejecuciones) {
            //         idejecucion[iterator] = data.prueba.ejecuciones[iterator].id_ejecucion;
            //    }
                for (let index = 0; index < data.prueba.ejecuciones.length; index++) {
                    const element = data.prueba.ejecuciones[index].id_ejecucion;
                    // console.log('element',element);
                    idejecucion[index] = element;

                }
                // idejecucion[0] = data.prueba.ejecuciones[0].id_ejecucion;


            }
        });
        return idejecucion;
    }
     function listarReporte_pruebas() {
        $('#tabla_pruebas').DataTable().clear().destroy();
        var table = $("#tabla_pruebas").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },/*
            buttons: [
                {
                    extend: 'excel',
                    text: '<i class="fas fa-file-excel"></i> Exportar Excel',
                    className: 'btn btn-success',
                    exportOptions: {
                        columns: ':visible:not(:last-child)'
                    }
                }
            ],*/
            initComplete: function() {
                setTimeout(function() {
                    table.buttons().container().appendTo('#tabla_pruebas_wrapper .col-md-6:eq(0)');
                }, 10);
            },
            /*
            buttons: [{
                text: 'Detalle',
                className: 'btn btn-info',
                action: function(e, dt, node, config) {
                    abrirModal();
                }
            }],*/
            initComplete: function() {
                setTimeout(function() {
                    table.buttons().container().appendTo('#tabla_pruebas_wrapper .col-md-6:eq(0)');
                }, 10);
            },
            ajax: {
                url: url_pruebas,
                dataSrc: "pruebas"
            },
            columns: [{
                    data: "id_prueba"
                },
                {
                    data: "nombre"
                },
                {
                    data: "matriz.nombre"
                },
                {
                    data: "correo"
                },
                {
                    render: function ( data, type, row ) {
                        let fecha_lanzamiento = row.fecha_lanzamiento != null ? (row.fecha_lanzamiento +' | '): '';
                        return  fecha_lanzamiento+row.hora_lanzamiento;
                        // return  row.fecha_lanzamiento+" "+row.hora_lanzamiento;
                    }
                },
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
                        return  data == null || data == 'U' ? 'Único' : 'Concurrente';
                    }
                },
                {
                    data: "tipo",
                    render: function ( data, type, row ) {
                        return  data == 'I' ? 'Interno' : 'Externo';
                    }
                },
                {
                    data: "ejecuciones",
                    render: function ( data, type, row ) {
                        // console.log("estado eje: ",data);
                        let result = '';
                        let valor = '';
                        if (row.ejecuciones.length == 0) {
                            // console.log(" **** ***** es 0 ****" );
                            return  '<h6><span class="badge badge-'+"danger"+'">'+'Sin ejecuciones'+'</span></h6>';
                        }
                        for (const ejecucion  in row.ejecuciones) {
                            // console.log("row eje: ",row.ejecuciones[ejecucion].estado);
                            if (row.ejecuciones[ejecucion].estado !== 'FINALIZADO') {
                                result = 'secondary';
                                valor = row.ejecuciones[ejecucion].estado;
                                break;
                            }
                            
                            else{
                                result =  'success';
                                valor = row.ejecuciones[ejecucion].estado;
                            }
                       
                        }
                        
                        
                        return  '<h6><span class="badge badge-'+result+'">'+valor+'</span></h6>';
                    }
                },
                {
                    render: function(data, type, row) {      
                        let id_prueba;
                        // if (row.ejecuciones.length == 0) {
                        //     console.log(" **** ***** es 0 ****" );
                        //     return '<button class="btn btn-info btn-sm" onClick="abrirDetalle(' + '' + ')"><i class="fas fa-info"></i> Detalle</button>';
                        // }
                        // array_ejecuciones = [];
                        // console.log("for ejecusiones",row.ejecuciones.length );
                        for (const ejecucion  in row.ejecuciones) {
                            // id_prueba = row.ejecuciones[ejecucion].estado === 'FINALIZADO' ? row.ejecuciones[ejecucion].id_ejecucion:'';
                            id_prueba = row.ejecuciones[ejecucion].estado === 'FINALIZADO' ? row.id_prueba:'';
                            // array_ejecuciones[ejecucion]=row.ejecuciones[ejecucion].id_ejecucion;
                            // console.log(" ejecusion ID ",row.ejecuciones[ejecucion].id_ejecucion );

                        }    
                        // console.log(" array ID ",array_ejecuciones );

                        return '<button class="btn btn-info btn-sm" onClick="abrirDetalle(' + id_prueba + ')"><i class="fas fa-info"></i> Detalle</button>';
                    },
                    targets: 5
                }
            ],
            order: [
                [0, 'desc']
            ]
        });
    }


     function abrirDetalle(id_prueba) {
        let idejecucion_array = id_prueba  ? otroajax(id_prueba):'';
        console.log("  idejecucion ",idejecucion_array );

        // let idejecucion = array_ejecuciones  ? array_ejecuciones:'';
        $('#detalle_prueba').DataTable().clear().destroy();
        if (idejecucion_array) {
            idejecucion_v1 = idejecucion_array;
            $('#titulo_modal').text("Detalle Prueba");
            console.log(" detalle id_prueba: ",url_ejecuciones+"/"+idejecucion_array);
            let cont=0;
            resultadosMalos = 0;
            resultadosBuenos = 0;
            resultadosPendientes = 0;
            let resultadoEntrada_temp='';
            let dato_temp = [];
            var dato_temp_ = [];

            let $elie = $("#grafico"), degree = 0, timer;
            for (let idejecucion = 0; idejecucion < idejecucion_array.length; idejecucion++) {
                const element = idejecucion_array[idejecucion];

                $.ajax({
                    url: url_ejecuciones+"/"+element,
                    method: 'get',
                    dataType: 'json',
                    async: false,
                    success: function (data){

                        // console.log("data ajax ",data.ejecucion.escenarios);
                        let data_escenario = [];
                        data_escenarios = data.ejecucion.escenarios;
                        // console.log("data_escenarios ajax ",data_escenarios[1]);
                        // let data_origen = data_escenarios[1]['canal_origen'];
                        // console.log("data_origen ajax ",data_origen);

                        /************************** */
                        for (const i in data_escenarios) {
                            // dato_row = Object.assign({}, data_escenarios[i]);
                            
                            dato_row = {};
                            let dato_array = [];
                            let resultadoEntrada_temp_='';
                            let resultadoFinal_temp_ = '';


                            /**  ORIGEN */
                            let data_origen = data_escenarios[i]['canal_origen'];
                            let id = typeof data_origen['id_canal'] === 'undefined' ? '': data_origen['id_canal'];
                            let operador_nombre = typeof  data_origen['tecnologia_operador']['tecnologia']['nombre'] === 'undefined' ? '':data_origen['tecnologia_operador']['tecnologia']['nombre'];
                            let tecnologia_nombre = typeof data_origen['tecnologia_operador']['operador']['nombre'] === 'undefined' ? '':data_origen['tecnologia_operador']['operador']['nombre'];
                            let numero = typeof data_origen['numero'] === 'undefined' ? '':data_origen['numero'];

                            dato_row['origen'] = 'Canal '+id +' - '+operador_nombre +' - '+tecnologia_nombre+' - '+numero;
                            dato_array[0] = 'Canal '+id +' - '+operador_nombre +' - '+tecnologia_nombre+' - '+numero;

                            /**  DESTINO */
                            let data_destino = data_escenarios[i]['destino'];
                            let data_destino_externo = data_escenarios[i]['numero_externo'];
                            if (data_destino != null) {
                                dato_row['destino'] = 'Canal '+data_destino['id_canal'] +'  '+data_destino['tecnologia_operador']['tecnologia']['nombre']+' - '
                                +data_destino['tecnologia_operador']['operador']['nombre']+' - '+data_destino['numero'];   
                                dato_array[1] = 'Canal '+data_destino['id_canal'] +'  '+data_destino['tecnologia_operador']['tecnologia']['nombre']+' - '
                                +data_destino['tecnologia_operador']['operador']['nombre']+' - '+data_destino['numero']; 

                            }
                            else if (data_destino_externo != null) {
                                dato_row['destino'] = 'Número Externo '+data_destino_externo['id_numero_externo'] +' - '+data_destino_externo['nombre']+' - '+data_destino_externo['numero'];
                                dato_array[1] = 'Número Externo '+data_destino_externo['id_numero_externo'] +' - '+data_destino_externo['nombre']+' - '+data_destino_externo['numero'];                    
                            }

                            /**  HANGUP */
                            let hang = JSON.stringify(data_escenarios[i]['hangupReason'] != null? data_escenarios[i]['hangupReason']:'En Espera');
                            let description = typeof hang.split("\"")[8] !== 'undefined' ? hang.split("\"")[8].replace(/\\/g, '') : hang ;      
                            dato_row['hangup'] =  description!= null ? description :'';
                            dato_array[4] =  description!= null ? description :'';                  


                            /**  RESULTADO_SALIDA */
                            let data_estado = data_escenarios[i]['estado'];
                            if (typeof data_estado ==='undefined' ) {
                                dato_row['resultado_salida'] = '<h6><span class="badge badge-'+'secondary'+'">'+'Pendiente'+'</span></h6>';
                                dato_array[2] = '<h6><span class="badge badge-'+'secondary'+'">'+'Pendiente'+'</span></h6>';                    
                            }
                            let is_success_danger = data_estado === "Success" ? 'success' : data_estado === "PENDIENTE" ? 'secondary':'danger';
                            let is_error_succes = data_estado === "Success" ? 'Exito' : data_estado === "PENDIENTE" ? 'Pendiente': 'Error' ;
                            if (dato_row['hangup'] === "Normal Clearing" && data_estado != "Success") {
                                is_success_danger = 'success';
                                is_error_succes = 'Sin Respuesta';
                            }
                            dato_row['resultado_salida'] = '<h6><span class="badge badge-'+is_success_danger+'">'+is_error_succes+'</span></h6>';
                            dato_array[2] = '<h6><span class="badge badge-'+is_success_danger+'">'+is_error_succes+'</span></h6>';                  

                            /**  HORA_SALIDA */
                            dato_row['hora_salida'] = data_escenarios[i]['hora_saliente'];
                            dato_array[3] = data_escenarios[i]['hora_saliente'];                  



                            /** Resultado Entrada */
                            if (typeof data_escenarios[i]['hora_entrante'] === 'undefined' ) {
                                dato_row['resultado_entrada'] = '';
                                dato_array[5] =  '';                  

                            }
                            if (data_destino != null) {
                                let horas_ = typeof data_escenarios[i]['hora_saliente'] !== 'undefined' ? data_escenarios[i]['hora_saliente'].split(":") : '';
                                let times = new Date();
                                let ti = times.toTimeString();
                                ti = ti.split(' ')[0];
                                ti = ti.split(":")
                                if (horas_ == '') {
                                    dato_row['resultado_entrada'] = '';
                                    dato_array[5] =  '';                  
                                }
                                let secondsA = (+horas_[0]) * 60 * 60 + (+horas_[1]) * 60 + (+horas_[2]); 
                                let secondsB = (+ti[0]) * 60 * 60 + (+ti[1]) * 60 + (+ti[2]); 
                                let diff = Math.abs(secondsA - secondsB);

                                if (data_escenarios[i]['hora_entrante'] == null && diff <= 20) {
                                    resultadoEntrada_temp_ = 'PENDIENTE';
                                    dato_row['resultado_entrada'] = '<h6><span class="badge badge-'+'secondary'+'">'+"PENDIENTE"+'</span></h6>';
                                    dato_array[5] =  '<h6><span class="badge badge-'+'secondary'+'">'+"PENDIENTE"+'</span></h6>';                  

                                }
                                else if (data_escenarios[i]['hora_entrante'] == null && diff > 20) {
                                    resultadoEntrada_temp_ = 'Error';
                                    dato_row['resultado_entrada'] = '<h6><span class="badge badge-'+'danger'+'">'+"Error"+'</span></h6>';
                                    dato_array[5] = '<h6><span class="badge badge-'+'danger'+'">'+"Error"+'</span></h6>';                  

                                }
                                else if (data_escenarios[i]['hora_entrante'] != null) {
                                    resultadoEntrada_temp_ = 'Success';
                                    dato_row['resultado_entrada'] = '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';
                                    dato_array[5] =  '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';                  

                                }                                          
                                // console.log("diferencia: ", diff);
                                // return diff;
                            }
                            else if (data_destino_externo != null) {
                                dato_row['resultado_entrada'] = "-";  
                                dato_array[5] =  '-';                  

                            }

                            /** Hora Entrada */
                            if (data_destino != null) {
                                if (data_escenarios[i]['hora_entrante'] == null) {
                                    dato_row['hora_entrada'] = "-"
                                    dato_array[6] =  '-';                  

                                }
                                else/* if (row.hora_entrante != null)*/{
                                    dato_row['hora_entrada'] = typeof data_escenarios[i]['hora_entrante'] !== 'undefined' ? data_escenarios[i]['hora_entrante']:'';
                                    dato_array[6] =  typeof data_escenarios[i]['hora_entrante'] !== 'undefined' ? data_escenarios[i]['hora_entrante']:'';                  

                                }
                            }
                            else if (data_destino_externo != null) {
                                dato_row['hora_entrada'] = "-";
                                dato_array[6] =  '-';                  

                            }

                            /** Resultado Final */ 
                            if (typeof data_destino === 'undefined' && typeof data_destino_externo === 'undefined') {
                                dato_row['resultado_final'] = '';
                                dato_array[7] =  '-';                  

                            }
                            if (data_destino != null && data_destino_externo == null) {
                                if (data_estado === "PENDIENTE" || resultadoEntrada_temp_ === "PENDIENTE") {
                                    resultadoFinal_temp_ = 'PENDIENTE';
                                    dato_row['resultado_final'] =  '<h6><span class="badge badge-'+'secondary'+'">'+"PENDIENTE"+'</span></h6>';
                                    dato_array[7] =  '<h6><span class="badge badge-'+'secondary'+'">'+"PENDIENTE"+'</span></h6>';                  

                                }
                                else if (data_estado === "Failure" || resultadoEntrada_temp_ === "Error") {
                                    resultadoFinal_temp_ = 'Error';
                                    dato_row['resultado_final'] =  '<h6><span class="badge badge-'+'danger'+'">'+"Error"+'</span></h6>';
                                    dato_array[7] =  '<h6><span class="badge badge-'+'danger'+'">'+"Error"+'</span></h6>';                  

                                }
                                else if (data_estado === "Success" && resultadoEntrada_temp_ === "Success") {
                                    resultadoFinal_temp_ = 'Success';
                                    dato_row['resultado_final'] =  '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';
                                    dato_array[7] =  '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';                  

                                }
                    
                            }
                            else if (data_destino_externo != null) {
                   
                                if (data_estado === "PENDIENTE" ) {
                                    resultadoFinal_temp_ = 'PENDIENTE';
                                    // resultadosPendientes++;
                                    dato_row['resultado_final'] =  '<h6><span class="badge badge-'+'secondary'+'">'+"PENDIENTE"+'</span></h6>';
                                    dato_array[7] =  '<h6><span class="badge badge-'+'secondary'+'">'+"PENDIENTE"+'</span></h6>';                  

                                }
                                else if (data_estado === "Failure") {
                                    resultadoFinal_temp_ = 'Error';
                                    // resultadosMalos ++;
                                    // console.log("malo externo ",resultadosMalos);
                                    // JRBL 09-08-2024
                                    //dato_row['resultado_final'] =  '<h6><span class="badge badge-'+'danger'+'">'+"Exito"+'</span></h6>';
                                    //dato_array[7] =  '<h6><span class="badge badge-'+'danger'+'">'+"Exito"+'</span></h6>';                  
                                    if (dato_row['hangup'] === "Normal Clearing") {
                                        dato_row['resultado_final'] =  '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';
                                        dato_array[7] =  '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';                  
                                    } else {
                                        dato_row['resultado_final'] =  '<h6><span class="badge badge-'+'danger'+'">'+"Error"+'</span></h6>';
                                        dato_array[7] =  '<h6><span class="badge badge-'+'danger'+'">'+"Error"+'</span></h6>';                  
                                    }
                                }
                                else if (data_estado === "Success" ) {
                                    resultadoFinal_temp_ = 'Success';
                                    // resultadosBuenos++;
                                    // console.log("buenos externo",resultadosBuenos);

                                    dato_row['resultado_final'] =  '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';
                                    dato_array[7] =  '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';                  

                                }
                            }

                                            
                            //***  MOS */
                                
                            if (resultadoFinal_temp_==="Success" ) {
                                dato_row['mos'] = '5';
                                dato_array[8] =  '5';                  

                            }
                            else{
                                dato_row['mos'] = '-';
                                dato_array[8] =  '-';                  

                            }
                          

                            dato_temp.push(dato_row);
                            dato_temp_.push(dato_array);
                        }
                        /************************ */

                        for(const col in data.ejecucion.escenarios){
                            //JRBL 09-08-2024
                            let xhang = JSON.stringify(data.ejecucion.escenarios[col].hangupReason != null? data.ejecucion.escenarios[col].hangupReason:'En Espera');
                            let xdescription = typeof xhang.split("\"")[8] !== 'undefined' ? xhang.split("\"")[8].replace(/\\/g, '') : xhang ;      
                            xrelease =  xdescription!= null ? xdescription :'';

                            if (data.ejecucion.escenarios[col].numero_externo != null) {
                                if (xrelease === "Normal Clearing") {
                                    data.ejecucion.escenarios[col].estado = "Success";
                                }
                                if (data.ejecucion.escenarios[col].estado === "PENDIENTE" ) {
                                    resultadosPendientes++;
                                }
                                else if (data.ejecucion.escenarios[col].estado === "Failure") {
                                    resultadosMalos ++;
                                }
                                else if (data.ejecucion.escenarios[col].estado === "Success" ) {
                                    resultadosBuenos++;
                                }
                                
                            }
                            else if (data.ejecucion.escenarios[col].destino != null ) {
                                if (typeof data.ejecucion.escenarios[col].hora_entrante === 'undefined' ) {
                                    return '';
                                }
                                let horas_ = typeof data.ejecucion.escenarios[col].hora_saliente !== 'undefined' ? data.ejecucion.escenarios[col].hora_saliente.split(":") : "";
                                let times = new Date();
                                let ti = times.toTimeString();
                                ti = ti.split(' ')[0];
                                ti = ti.split(":")
                                var secondsA = (+horas_[0]) * 60 * 60 + (+horas_[1]) * 60 + (+horas_[2]); 
                                var secondsB = (+ti[0]) * 60 * 60 + (+ti[1]) * 60 + (+ti[2]); 
                                let diff = Math.abs(secondsA - secondsB);
                                // console.log("diferencia", diff);
                                let resultadoEntrada_temp2 = ''



                                    if (data.ejecucion.escenarios[col].hora_entrante == null && diff <= 20) {
                                        resultadoEntrada_temp2 = 'PENDIENTE';
                                    }
                                    else if (data.ejecucion.escenarios[col].hora_entrante == null && diff > 20) {
                                        resultadoEntrada_temp2 = 'Error';
                                    }
                                    else if (data.ejecucion.escenarios[col].hora_entrante != null) {
                                        resultadoEntrada_temp2 = 'Success';
                                    }                                          
                                
                                
                                if (data.ejecucion.escenarios[col].estado === "PENDIENTE" || resultadoEntrada_temp2 === "PENDIENTE") {
                                    resultadosPendientes++;
                                }
                                else if (data.ejecucion.escenarios[col].estado === "Failure" || resultadoEntrada_temp2 === "Error") {
                                    resultadosMalos ++;
                                }
                                else if (data.ejecucion.escenarios[col].estado === "Success" && resultadoEntrada_temp2 === "Success") {
                                    resultadosBuenos++;
                                }
                        
                            }
                        }


                        nombre_prueba = data.ejecucion.prueba.nombre;
                        // let fecha_lanzamiento_ = data.ejecucion.prueba.fecha_lanzamiento != null ? (data.ejecucion.prueba.fecha_lanzamiento +' | '): '';
                        // fecha_lanzamiento = fecha_lanzamiento_+data.ejecucion.prueba.hora_lanzamiento;
                        fecha_lanzamiento = data.ejecucion.fecha_fin;
                        fecha_creacion = data.ejecucion.fecha_inicio;
                        numero_escenarios = data.ejecucion.escenarios.length;
                        nombre_ejecutor = data.ejecucion.prueba.usuario.nombres +" "+ data.ejecucion.prueba.usuario.apellidos;
                        nombre_matriz = data.ejecucion.prueba.matriz.nombre;
                        // console.log("data nombre_prueba ",nombre_prueba);
                        // console.log("data fecha_lanzamiento ",fecha_lanzamiento);
                        // console.log("data numero_escenarios ",data.ejecucion.escenarios.length);


                        let data_temp = data.ejecucion.escenarios

                        // $('#detalle_prueba').DataTable( {
                        
                        //     dom: 'Bfrtip',  
                        //     buttons: [
                        //         'csv'
                        //     ],   
                        //     data: data.ejecucion.escenarios,                         
                        //     columns: [
                        //                 {
                        //                     "data": "canal_origen",
                        //                     "defaultContent": "<i>Not set</i>",
                        //                     render: function(data, type, row) {     
                                                        
                                                
                        //                         /*console.log("data: ",data);
                        //                         console.log("row: ",row);*/
                        //                         let id = typeof data.id_canal === 'undefined' ? '':data.id_canal;
                        //                         let operador_nombre = typeof data.tecnologia_operador.tecnologia.nombre === 'undefined' ? '':data.tecnologia_operador.tecnologia.nombre;
                        //                         let tecnologia_nombre = typeof data.tecnologia_operador.operador.nombre === 'undefined' ? '':data.tecnologia_operador.operador.nombre;
                        //                         let numero = typeof data.numero === 'undefined' ? '':data.numero;

                        //                         return 'Canal '+id +' - '+operador_nombre +' - '+tecnologia_nombre+' - '+numero;
                        //                     }
                        //                 },
                        //                 {
                        //                     // "data": "destino",
                        //                     render: function(data, type, row) {
                        //                         if (row.destino != null) {
                        //                         return 'Canal '+row.destino.id_canal +'  '+row.destino.tecnologia_operador.tecnologia.nombre+' - '+row.destino.tecnologia_operador.operador.nombre+' - '+row.destino.numero;   
                        //                         }
                        //                         else if (row.numero_externo != null) {
                        //                         return 'Número Externo '+row.numero_externo.id_numero_externo +' - '+row.numero_externo.nombre+' - '+row.numero_externo.numero;                              
                        //                         }
                        //                     }
                        //                 },
                        //                 {
                        //                     // Resultado Salida
                        //                     render: function(data, type, row) {
                        //                         if (typeof row.estado ==='undefined' ) {
                        //                             return '<h6><span class="badge badge-'+'secondary'+'">'+'Pendiente'+'</span></h6>';
                        //                         }
                        //                         let is_success_danger = row.estado === "Success" ? 'success' : row.estado === "PENDIENTE" ? 'secondary':'danger';
                        //                         let is_error_succes = row.estado === "Success" ? 'Exito' : row.estado === "PENDIENTE" ? 'Pendiente': 'Error' ;
                        //                         // resultadoSalida_temp = is_error_succes;
                        //                         return '<h6><span class="badge badge-'+is_success_danger+'">'+is_error_succes+'</span></h6>';
                        //                     }
                        //                 },
                        //                 {
                        //                     "data": "hora_saliente",
                        //                     "defaultContent": "<i>Not set</i>"
                                       
                        //                 },
                        //                 {
                        //                     "data": "hangupReason",
                        //                     render: function(data, type, row) {     
                        //                         let hang = JSON.stringify(data != null? data:'En Espera');
                        //                         // let cause = hang.split("\"")[4].replace(/\\/g, '');         
                        //                         let description = typeof hang.split("\"")[8] !== 'undefined' ? hang.split("\"")[8].replace(/\\/g, '') : hang ;      
                        //                         return /*"Causa: "+cause +" "+ "Descripción: "+*/ description!= null ? description :'';
                        //                     }
                        //                 },
                        //                 {
                        //                     //Resultado Entrada
                        //                     render: function(data, type, row) {
                        //                         if (typeof row.hora_entrante === 'undefined' ) {
                        //                             return '';
                        //                         }
                        //                             // console.log("diferencia", diff);
                        //                         if (row.destino != null) {
                        //                             let horas_ = typeof row.hora_saliente !== 'undefined' ? row.hora_saliente.split(":") : '';
                        //                             let times = new Date();
                        //                             let ti = times.toTimeString();
                        //                             ti = ti.split(' ')[0];
                        //                             ti = ti.split(":")
                        //                             if (horas_ == '') {
                        //                                 return '';
                        //                             }
                        //                             var secondsA = (+horas_[0]) * 60 * 60 + (+horas_[1]) * 60 + (+horas_[2]); 
                        //                             var secondsB = (+ti[0]) * 60 * 60 + (+ti[1]) * 60 + (+ti[2]); 
                        //                             let diff = Math.abs(secondsA - secondsB);

                        //                             if (row.hora_entrante == null && diff <= 20) {
                        //                                 resultadoEntrada_temp = 'PENDIENTE';
                        //                                 return '<h6><span class="badge badge-'+'secondary'+'">'+"PENDIENTE"+'</span></h6>';
                        //                             }
                        //                             else if (row.hora_entrante == null && diff > 20) {
                        //                                 resultadoEntrada_temp = 'Error';
                        //                                 return '<h6><span class="badge badge-'+'danger'+'">'+"Error"+'</span></h6>';
                        //                             }
                        //                             else if (row.hora_entrante != null) {
                        //                                 resultadoEntrada_temp = 'Success';
                        //                                 return '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';
                        //                             }                                          
                        //                             // console.log("diferencia: ", diff);
                        //                             // return diff;
                        //                         }
                        //                         else if (row.numero_externo != null) {
                        //                         return "-";                              
                        //                         }
                        //                     }
                        //                 },
                        //                 {
                        //                     "data": "hora_entrante",
                        //                     "defaultContent": "<i>Not set</i>",
                        //                     render: function(data, type, row) {
                        //                         // console.log("hora", row.hora_entrante.split(":"));
                        //                         if (row.destino != null) {
                        //                             if (row.hora_entrante ==null) {
                        //                                 return "-"
                        //                             }
                        //                             else/* if (row.hora_entrante != null)*/{
                        //                                 return typeof row.hora_entrante !== 'undefined' ? row.hora_entrante:'';
                        //                             }
                        //                         }
                        //                         else if (row.numero_externo != null) {
                        //                             return "-";
                        //                         }
                        //                     }
            
                        //                 },
                        //                 {
                        //                     // Resultado Final
                        //                     // 
                        //                     render: function(data, type, row) {
                        //                         // 
                        //                         if (typeof row.destino === 'undefined' && typeof row.numero_externo === 'undefined') {
                        //                             return'';
                        //                         }
                        //                         if (row.destino != null && row.numero_externo == null) {
                        //                             if (row.estado === "PENDIENTE" || resultadoEntrada_temp === "PENDIENTE") {
                        //                                 resultadoFinal_temp = 'PENDIENTE';
                        //                                 return '<h6><span class="badge badge-'+'secondary'+'">'+"PENDIENTE"+'</span></h6>';
                        //                             }
                        //                             else if (row.estado === "Failure" || resultadoEntrada_temp === "Error") {
                        //                                 resultadoFinal_temp = 'Error';
                        //                                 return '<h6><span class="badge badge-'+'danger'+'">'+"Error"+'</span></h6>';
                        //                             }
                        //                             else if (row.estado === "Success" && resultadoEntrada_temp === "Success") {
                        //                                 resultadoFinal_temp = 'Success';
                        //                                 return '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';
                        //                             }
                                        
                        //                         }
                        //                         else if (row.numero_externo != null) {
                        //                             // console.log("row 2: ", row );
                        //                             // console.log("data 2: ", data );
                        //                             // let is_success_danger = row.estado === "Success" ? 'success' : row.estado === "PENDIENTE" ? 'secondary':'danger';
                        //                             // resultadoFinal_temp = row.estado;
                        //                             // let is_error_succes = row.estado === "Success" ? 'Exito' : row.estado === "PENDIENTE" ? 'Pendiente': 'Error' ;
                        //                             // return '<h6><span class="badge badge-'+is_success_danger+'">'+is_error_succes+'</span></h6>';
                        //                             if (row.estado === "PENDIENTE" ) {
                        //                                 resultadoFinal_temp = 'PENDIENTE';
                        //                                 // resultadosPendientes++;
                        //                                 return '<h6><span class="badge badge-'+'secondary'+'">'+"PENDIENTE"+'</span></h6>';
                        //                             }
                        //                             else if (row.estado === "Failure") {
                        //                                 resultadoFinal_temp = 'Error';
                        //                                 // resultadosMalos ++;
                        //                                 // console.log("malo externo ",resultadosMalos);

                        //                                 return '<h6><span class="badge badge-'+'danger'+'">'+"Error"+'</span></h6>';
                        //                             }
                        //                             else if (row.estado === "Success" ) {
                        //                                 resultadoFinal_temp = 'Success';
                        //                                 // resultadosBuenos++;
                        //                                 // console.log("buenos externo",resultadosBuenos);

                        //                                 return '<h6><span class="badge badge-'+'success'+'">'+"Exito"+'</span></h6>';
                        //                             }
                        //                         }
                        //                     }
                        //                 },
                        //                 {
                        //                     //MOS
                        //                     "data": "estado",
                        //                     render: function(data, type, row) {
                        //                         if (resultadoFinal_temp==="Success" ) {
                        //                             return '5';
                        //                         }
                        //                         else{
                        //                             return '-';
                        //                         }
                        //                         // let MOS = (row.uniqueid_en != null &&  row.mos == null) ? '5' : null;
                        //                         // console.log("MOS: ", MOS);
                        //                         // return MOS ; 
                        //                     }
                        //                 },
                        //             ],
                        //             "stateSave": true,
                        //             "bDestroy": true,
                        //             "retrieve": false,
                        //             "paging": true,
                        // }); 

                        // $('#detalle_prueba tbody').on( 'click', 'tr', function () {
                        //     alert( 'Row index: '+table.row( this ).index() );
                        // } );
                        // $.fn.dataTable.ext.errMode = 'none';

                        // $('#detalle_prueba').on( 'error.dt', function ( e, settings, techNote, message ) {
                        // console.log( 'An error has been reported by DataTables: ', message );
                        // } ) .DataTable();
                        // $('#detalle_prueba').DataTable();

                        //function test(data){
                            //console.log("DATA ", data);
                        //}
                        // console.log("resultado error: ",resultadosMalos);
                        // console.log("resultado buenos: ",resultadosBuenos);
                        // console.log("resultado pendientes: ",resultadosPendientes);
                        // console.log("resultado cont: ",cont);
                        $("#grafico").html('<div id="donut-chart" style="width:450px; height:250px"></div>');
                        var donutData = [
                            {
                                label: 'Exitosos',
                                data :resultadosBuenos,
                                color: '#00a800'
                            },
                            {
                                label: 'Fallidos',
                                data : resultadosMalos,
                                color: '#ed2939'
                            },
                            {
                                label: 'Pendientes',
                                data : resultadosPendientes,
                                color: '#7d7f7d'
                            }
                        ]
                        $.plot('#donut-chart', donutData, {
                            series: {
                                pie: {
                                        show       : true,
                                        radius     : 1,
                                        innerRadius: 0.5,
                                        label      : {
                                        show     : true,
                                        radius   : 2 / 3,
                                        formatter: labelFormatter,
                                        threshold: 0.1
                                    }            
                                }
                            },
                            legend: {
                                show: false
                            }
                        })
                       
                        $('#grafico').stop();
                       
                    }
                });
            }
            var dataSet = [
                [ "Canal 1267 - Analogico - Entel - 7194836", "Número Externo 28 - Cesar - 998844441", "<h6><span class=\"badge badge-danger\">Error</span></h6>", "19:50:40", "Normal Clearing", "-","-","<h6><span class=\"badge badge-danger\">Error</span></h6>","-" ],
                
               
            ];
            console.log("dataSet ajax ",dataSet);
            console.log("dato_temp ajax ",dato_temp_);
            // dataSet = dato_temp_;
            console.log("dataSet 2 ajax ",dataSet);

            $('#detalle_prueba').DataTable( {
                
                dom: 'Bfrtip',  
                buttons: [
                    'csv'
                ],   
                data: dato_temp_,                         
                columns: [
                            {
                                title: "Origen",                
                            },
                            {
                                title: "Destino",
                                
                            },
                            {
                                title: "Resultado Salida",
                                
                            },
                            {
                                title: "Hora Salida",
                                
                            },
                            {
                                title: "HangUp Cause",
                                
                            },
                            {
                                title: "Resultado Entrada",
                            },
                            {
                                title: "Hora Entrada",
                            },
                            {
                                title: "Resultado Final",
                            },
                            {
                                title: "MOS",
                            },
                        ],
                        
            }); 
        }
        else{
            console.log("no hay id prueba");
            const titulo_modal = "Prueba en Ejecucion";
            $('#titulo_modal').text(titulo_modal);
            $("#grafico").html('<div id="donut-chart" style="width:450px; height:250px"></div>');
            var donutData = [
                {
                    label: '',
                    data :1,
                    color: '#00a800'
                },
                {
                    label: '',
                    data : 1,
                    color: '#ed2939'
                },
                {
                    label: '',
                    data : 1,
                    color: '#7d7f7d'
                },
                {
                    label: '',
                    data : 1,
                    color: '#fff'
                }
            ]
            $.plot('#donut-chart', donutData, {
                series: {
                    pie: {
                            show       : true,
                            radius     : 1,
                            innerRadius: 0.5,
                            label      : {
                            show     : true,
                            radius   : 2 / 3,
                            formatter: labelFormatter,
                            threshold: 0.1
                        }            
                    }
                },
                legend: {
                    show: false
                }
                
            })
            let $elie = $("#grafico"), degree = 0, timer;

            rotate();
            function rotate() {
                
                $elie.css({ WebkitTransform: 'rotate(' + degree + 'deg)'});  
                $elie.css({ '-moz-transform': 'rotate(' + degree + 'deg)'});                     
                timer = setTimeout(function() {
                    // ++degree; rotate();
                },5);
            }
        }


        $("#modal-detalle").modal("show");

        }
    /*
    * Custom Label formatter
    * ----------------------
    */
    function labelFormatter(label, series) {
        return '<div style="font-size:13px; text-align:center; padding:2px; color: #fff; font-weight: 600;">'
        + label
        + '<br>'
        + Math.round(series.percent) + '%</div>'
    }
    /*
        var table = $("#tabla_pruebas").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            buttons: ['excel', 'pdf'],
            initComplete: function() {
                setTimeout(function() {
                    table.buttons().container().appendTo('#tabla_pruebas_wrapper .col-md-6:eq(0)');
                }, 10);
            }
        });
        var table2 = $("#tabla_pruebas").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            }
        });
        table.buttons().container().appendTo('#tabla_pruebas_wrapper .col-md-6:eq(0)');

        function abrirDetalle() {
            $('#modal-default').modal('show');
        }
        */
</script>
@endsection
