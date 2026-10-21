# Migrações SQL (Supabase)

Rode no **SQL Editor do Supabase**, nesta ordem. Todas são idempotentes (`if not exists` / `create or replace`) e aditivas. Faça backup antes de aplicar em produção.

| # | Arquivo | O que cria |
|---|---------|-----------|
| 1 | `schema.sql` | Base legada: `profiles`, `purchases`, `prompts`, `templates`, `course_progress`, `settings` |
| 2 | `20260925_phase1_rls_and_entitlements.sql` | `entitlements` + RLS nas tabelas base |
| 3 | `lunyon_phase2_5_integration_connections_REVISADO.sql` | `integration_connections` (tokens Google criptografados), **sem** leitura pelo navegador |
| 4 | `20260925_phase2_ai_employees.sql` | `ai_employees` |
| 5 | `20260925_phase3_workflows.sql` | `workflows` |
| 6 | `20261012_google_selected_calendars.sql` | agendas selecionadas por usuário |
| 7 | `20261012_calendar_write_intents.sql` | confirmação de escrita na Agenda + auditoria |
| 8 | `20261013_gmail_send_intents.sql` | confirmação de envio no Gmail + auditoria |
| 9 | `20261014_gmail_send_payload_redaction.sql` | limpeza do payload de envio |
| 10 | `20261019_agent_assistant.sql` | assistente: chaves de IA, conversas, ações, uso diário |
| 11 | `20261021_runtime_activity.sql` | contador de uso atômico, `activity_events`, agendamento e `workflow_runs` |

## Sobre o arquivo de integrações

`20260925_phase2_5_integration_connections.sql` é a versão original e está mantida só como histórico. Ela cria uma policy que permite ao usuário autenticado ler a própria linha, **incluindo os tokens criptografados**, via PostgREST. Use a versão `_REVISADO`.

Se a original já foi aplicada, rode a `_REVISADO` por cima: ela remove a policy e revoga o acesso de `anon` e `authenticated`.

## O que depende da migração 11

Sem `20261021_runtime_activity.sql`, o backend continua funcionando, mas:

- histórico de atividade, estatísticas do painel e notificações ficam vazios (a API responde 503 `ACTIVITY_NOT_READY`);
- workflows manuais podem ser salvos, mas não executados (503 `WORKFLOWS_NOT_READY`), e workflows agendados não podem ser salvos;
- o contador de uso diário de IA usa um fallback não atômico.
