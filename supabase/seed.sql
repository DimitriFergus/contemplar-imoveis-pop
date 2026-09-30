-- Dados mínimos para o site funcionar: o corretor "de exemplo" dos 24 imóveis ilustrativos.
-- Os imóveis e as fotos são enviados por: npm run supabase:importar
insert into public.corretores (id, nome, creci, whatsapp)
values ('corretor-exemplo', 'Equipe de corretores (exemplo)', 'A_DEFINIR', 'A_DEFINIR')
on conflict (id) do nothing;
