-- ============================================================
--  JM FACTURACIÓN — Endurecimiento del Security Advisor
--  0013 · Las funciones de lectura no necesitan SECURITY DEFINER:
--  con RLS cada usuario ya solo ve sus propias filas. Se pasan a
--  SECURITY INVOKER (más seguro y sin advertencia del advisor).
--  El registro de sesión pasa a INVOKER con una política de INSERT
--  estrecha (solo filas de sesión del propio usuario).
-- ============================================================

-- ---------- Funciones de Finanzas → SECURITY INVOKER ----------
alter function public.fin_flujo(date, date) security invoker;
alter function public.fin_libro(date, date, text, text, int, int) security invoker;
alter function public.fin_estado_resultados(date, date) security invoker;
alter function public.fin_proyeccion() security invoker;
alter function public.fin_rentabilidad(date, date) security invoker;

-- Ejecutable solo por usuarios autenticados (no PUBLIC ni anon).
do $$
declare f text;
begin
  foreach f in array array[
    'public.fin_flujo(date, date)',
    'public.fin_libro(date, date, text, text, int, int)',
    'public.fin_estado_resultados(date, date)',
    'public.fin_proyeccion()',
    'public.fin_rentabilidad(date, date)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- ---------- Registro de sesión → SECURITY INVOKER ----------
-- Permite a un usuario autenticado insertar SOLO eventos de sesión suyos.
-- Las acciones de negocio siguen siendo exclusivas del disparador de
-- auditoría (SECURITY DEFINER de postgres), imposibles de falsificar.
grant insert on public.bitacora to authenticated;

drop policy if exists bitacora_insert on public.bitacora;
drop policy if exists bitacora_insert_sesion on public.bitacora;
create policy bitacora_insert_sesion on public.bitacora
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and accion like 'sesion%'
    and entidad = 'sesion'
    and datos_antes is null
    and datos_despues is null
  );

create or replace function public.fn_registrar_sesion(
  p_tipo text,
  p_email text default null
)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_nombre text;
  v_ip text;
  v_ua text;
  v_desc text;
begin
  -- Sin sesión activa no se puede atribuir el evento (INVOKER + RLS).
  if v_uid is null then return; end if;
  if p_tipo not in ('sesion_inicio','sesion_cierre','sesion_fallida') then
    return;
  end if;

  select email, coalesce(nombre_completo, email) into v_email, v_nombre
    from public.profiles where id = v_uid;
  v_nombre := coalesce(v_nombre, v_email, 'Usuario');

  begin
    v_ip := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-forwarded-for';
    v_ua := nullif(current_setting('request.headers', true), '')::jsonb ->> 'user-agent';
  exception when others then
    v_ip := null; v_ua := null;
  end;

  v_desc := case p_tipo
    when 'sesion_inicio' then v_nombre || ' inició sesión'
    when 'sesion_cierre' then v_nombre || ' cerró sesión'
    else 'Intento fallido de inicio de sesión con el correo ' || coalesce(p_email, v_email)
  end;

  insert into public.bitacora (
    owner_id, usuario_email, accion, entidad, entidad_id,
    descripcion, ip, user_agent)
  values (v_uid, v_email, p_tipo, 'sesion', null, v_desc, v_ip, v_ua);
end $$;

revoke execute on function public.fn_registrar_sesion(text, text) from public, anon;
grant execute on function public.fn_registrar_sesion(text, text) to authenticated;
