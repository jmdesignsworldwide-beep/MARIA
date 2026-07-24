-- ============================================================
--  PRUEBA DE INVIOLABILIDAD — tabla public.bitacora
--  Confirma que UPDATE y DELETE FALLAN a nivel de base de datos
--  para el rol `authenticated` (el que usa la aplicación).
--  Debe terminar con "PRUEBA DE INVIOLABILIDAD: OK".
--
--  Ejecutar dentro de una transacción; hace ROLLBACK al final para
--  no dejar rastro.
-- ============================================================

begin;

-- Actuar como un usuario autenticado real.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', (select id from auth.users order by created_at asc limit 1))::text,
  true
);

do $$
declare
  v_update_bloqueado boolean := false;
  v_delete_bloqueado boolean := false;
begin
  -- Intento de UPDATE: debe fallar.
  begin
    update public.bitacora set descripcion = 'ALTERADO POR PRUEBA';
    -- Si RLS lo dejó pasar sin error pero sin filas, también es un fallo de intención:
    raise exception 'FALLO: el UPDATE no fue rechazado';
  exception
    when insufficient_privilege then v_update_bloqueado := true;
    when others then
      if sqlerrm like 'FALLO:%' then raise;
      else v_update_bloqueado := true; end if;
  end;

  -- Intento de DELETE: debe fallar.
  begin
    delete from public.bitacora;
    raise exception 'FALLO: el DELETE no fue rechazado';
  exception
    when insufficient_privilege then v_delete_bloqueado := true;
    when others then
      if sqlerrm like 'FALLO:%' then raise;
      else v_delete_bloqueado := true; end if;
  end;

  if v_update_bloqueado and v_delete_bloqueado then
    raise notice 'PRUEBA DE INVIOLABILIDAD: OK (UPDATE y DELETE bloqueados)';
  else
    raise exception 'PRUEBA DE INVIOLABILIDAD: FALLIDA';
  end if;
end $$;

rollback;
