@extends('layout.principal')
@section('tituloModulo', 'Configuración de API')
@section('contenido')
<div class="row">
    <div class="col-12">
      <div class="card">
        <!-- /.card-header -->
        <div class="card-body">
          <table id="example1" class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Contraseña</th>
                    <th>Estado</th>
                    <th>Opciones</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>UsuarioPrueba</td>
                    <td>1234568782222</td>
                    <td>Activo</td>
                    <td>
                        <button class="btn btn-primary" id="btn-editar">Editar</button>
                    </td>
                </tr>
            </tbody>
            <!--<tfoot>
                <tr>
                <th>Rendering engine</th>
                <th>Browser</th>
                <th>Platform(s)</th>
                <th>Engine version</th>
                <th>CSS grade</th>
                </tr>
            </tfoot>-->
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
          <h4 class="modal-title">Editar Configuración</h4>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
            <form id="agregar_usuarios" class="form-nuclear" novalidate="">
                <div class="row">
                    <label class="col-form-label col-4">Usuario <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="email" class="form-control m-b-5" required="" data-parsley-required-message="Por favor ingrese este campo." data-parsley-remote="" data-parsley-remote-validator="cardcode" data-parsley-remote-message="Este correo electrónico se encuentra en uso.">
                        <small class="text-muted"><i class="fas fa-info-circle"></i> Este campo es obligatorio.</small>
                    </div>
                </div>
                <div class="row">
                    <label class="col-form-label col-4">Contraseña <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <input type="text" name="nombres" class="form-control m-b-5" required="" data-parsley-error-message="Este campo es obligatorio">
                        <small class="text-muted"><i class="fas fa-info-circle"></i> Este campo es obligatorio.</small>
                    </div>
                </div>
                <div class="row">
                    <label class="col-form-label col-4">Estado <span class="text-danger">*</span></label>
                    <div class="col-8">
                        <select class="form-control" name="idperfil" >
                            <option value="">Seleccionar</option>
                            <option value="1">Activo</option>
                            <option value="2">Inactivo</option>
                        </select>
                        <small class="text-muted"><i class="fas fa-info-circle"></i> Este campo es obligatorio.</small>
                    </div>
                </div>
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
<!-- /.modal -->
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
            searching: false
            //https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json

        });
        //table.buttons().container().appendTo( '#example1_wrapper .col-md-6:eq(0)' );
        $("#btn-editar").click(function (e) {
            e.preventDefault();
            $("#modal-default").modal('show')
        });
    </script>
@endsection
