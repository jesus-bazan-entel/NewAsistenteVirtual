<?php

namespace App\Http\Middleware;

use Closure;
use Session;

class ValidarSesion
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if (!Session::has('logeado') && !Session::get('logeado')) {
            return redirect('/');
        }
        return $next($request);
    }
}
