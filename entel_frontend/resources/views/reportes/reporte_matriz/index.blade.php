@extends('layout.principal')
@section('tituloModulo', 'Reporte de Ejecución de matriz de prueba')
@section('contenido')
<div class="row">
    <div class="col-12">
      <div class="card">
        <!-- /.card-header -->
        <div class="card-body">
          <button class="btn btn-success"><i class="far fa-file-excel"></i> Excel</button>
          <br>
          <table class="table table-bordered table-striped">
            <tbody>
                <tr>
                    <td>Nombre</td>
                    <td>Prueba 12-11-2020</td>
                </tr>
                <tr>
                    <td>Fecha/hora inicio:</td>
                    <td>12/11/2020 16:00:00 pm</td>
                </tr>
                <tr>
                    <td>Fecha/hora fin: </td>
                    <td>12/11/2020 16:10:20 pm</td>
                </tr>
                <tr>
                    <td>Usuario ejecutor</td>
                    <td>jbazanl</td>
                </tr>
                <tr>
                    <td>Matriz aplicada</td>
                    <td>MatrizEnero01</td>
                </tr>
                <tr>
                    <td>Cantidad de escenarios</td>
                    <td>28(canales origen x canales destino)x 2 - numeros externos</td>
                </tr>
            </tbody>
          </table>
          <br>
          <table class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>Origen/Destino</th>
                    <th>Movistar</th>
                    <th>Claro</th>
                    <th>Bitel</th>
                    <th>Bomberos</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Entel 2G</strong></td>
                    <td><span class="badge badge-success">OK</span></td>
                    <td><span class="badge badge-success">OK</span></td>
                    <td><span class="badge badge-success">OK</span></td>
                    <td><span class="badge badge-success">OK</span></td>
                </tr>
                <tr>
                    <td><strong>Entel 3G</strong></td>
                    <td><span class="badge badge-success">OK</span></td>
                    <td><span class="badge badge-success">OK</span></td>
                    <td><span class="badge badge-success">OK</span></td>
                    <td><span class="badge badge-danger">Error</span></td>
                </tr>
                <tr>
                    <td><strong>Entel 4G</strong></td>
                    <td><span class="badge badge-success">OK</span></td>
                    <td><span class="badge badge-success">OK</span></td>
                    <td><span class="badge badge-danger">Error</span></td>
                    <td><span class="badge badge-success">OK</span></td>
                </tr>
                <tr>
                    <td><strong>Americatel Fija</strong></td>
                    <td><span class="badge badge-danger">Error</span></td>
                    <td><span class="badge badge-success">OK</span></td>
                    <td><span class="badge badge-success">OK</span></td>
                    <td><span class="badge badge-success">OK</span></td>
                </tr>
            </tbody>
          </table>
          <br>
          <hr>
          <h2>Detalle de errores</h2>
          <br>
          <table class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Escenario</th>
                    <th>Detalle</th>
                    <th>Código de error</th>
                    <th>Fecha de Falla</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>Entel 2G - Bomberos</td>
                    <td>Llamada sin audio</td>
                    <td>NoMedia</td>
                    <td>26-11-2020 18:47:12</td>
                </tr>
                <tr>
                    <td>2</td>
                    <td>Entel 4G -Bitel</td>
                    <td>Llamada no progresa</td>
                    <td>BUSY</td>
                    <td>26-11-2020 17:47:12</td>
                </tr>
                <tr>
                    <td>3</td>
                    <td>Movistar - Americatel(Fi)</td>
                    <td>Llamada no progresa</td>
                    <td>BUSY</td>
                    <td>26-11-2020 14:47:12</td>
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
@endsection
