@extends('layout.principal')
@section('tituloModulo', 'Reporte DISA')
@section('contenido')
<div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-header">
            <div class="row">
                <div class="form-group col-md-3">
                    <h6><strong>Fecha inicial</strong></h6>
                    <input type="date" name="" id="" class="form-control">
                </div>
                <div class="form-group col-md-3">
                    <h6><strong>Fecha final</strong></h6>
                    <input type="date" name="" id="" class="form-control">
                </div>
            </div>
        </div>
        <!-- /.card-header -->
        <div class="card-body">
          <table id="example1" class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Fecha/Hora Inicio</th>
                    <th>Canal</th>
                    <th>Tiempo Timbrado</th>
                    <th>Conversación</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Rogger Padilla</td>
                    <td>13/11/2020 05:45:00</td>
                    <td>Canal 1</td>
                    <td>13 segundos</td>
                    <td>Data</td>
                    <td>OK</td>
                </tr>
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
        <div class="modal-header">
          <h4 class="modal-title">Detalle de prueba</h4>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
            <img src="{{ asset('dist/img/grafico1.png')}}" class="img-fluid" alt="">
            <form id="agregar_usuarios" class="form-nuclear" novalidate="">
                <table id="example2" class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Canal</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Canal 1</td>
                            <td>OK</td>
                        </tr>
                    </tbody>
                </table>
            </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" data-dismiss="modal">Cerrar</button>
          <button type="button" class="btn btn-primary">Guardar</button>
        </div>
      </div>
      <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>
@endsection
@section('javascript')
    <script>
        var table =$("#example1").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            buttons: [ 'excel', 'pdf' ],
            initComplete: function () {
                setTimeout( function () {
                    table.buttons().container().appendTo( '#example1_wrapper .col-md-6:eq(0)' );
                }, 10 );
            }
        });
        var table2 =$("#example2").DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 25,
            lengthChange: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            }
        });
        table.buttons().container().appendTo( '#example1_wrapper .col-md-6:eq(0)' );
        function abrirDetalle() {
            $('#modal-default').modal('show');
        }
    </script>
@endsection
