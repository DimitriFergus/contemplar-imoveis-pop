-- Corrige a exclusão de usuários: ao apagar a conta, o banco zera "criado_por" dos imóveis
-- (on delete set null) e o gatilho de proteção desfazia isso, travando a exclusão.
-- Agora o campo continua imutável pela API, mas pode virar nulo.
create or replace function public.antes_de_salvar()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.atualizado_em := now();
    new.atualizado_por := coalesce(auth.uid(), new.atualizado_por);
    -- Campos de controle não podem ser alterados pela API.
    new.criado_em := old.criado_em;
    if tg_table_name = 'imoveis' then
      if new.criado_por is not null then
        new.criado_por := old.criado_por;
      end if;
      new.codigo := old.codigo;
      new.publicado_em := coalesce(old.publicado_em, new.publicado_em);
    end if;
  end if;
  if tg_table_name = 'imoveis' then
    if new.status <> 'rascunho' and new.publicado_em is null then
      new.publicado_em := now();
    end if;
  end if;
  return new;
end
$$;
