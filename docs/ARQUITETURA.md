# Arquitetura

## Visão

O navegador consome uma API REST stateless. O Spring Security valida o JWT em
cada requisição protegida. Serviços aplicam regras do domínio e os repositórios
persistem em PostgreSQL. Flyway é a única fonte de evolução do esquema.

## Backend

Pacotes por responsabilidade:

- `controller`: contrato HTTP.
- `dto`: entradas e saídas, sem expor entidades.
- `service`: casos de uso e transações.
- `repository`: acesso a dados.
- `entity`: modelo persistente.
- `mapper`: projeção segura para DTOs.
- `security`: autenticação, JWT e autorização.
- `validation`: regras reutilizáveis.
- `exception`: respostas de erro consistentes.
- `config`: OpenAPI, CORS e beans.

## Rotas da API

Todas exigem JWT, exceto `/api/auth/**`, e só enxergam dados da dupla de quem
está autenticado (buscas sempre por `id` **e** dupla).

| Recurso | Rotas |
| --- | --- |
| Conta | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PATCH /api/me`, `PATCH /api/me/password`, `GET/PUT/DELETE /api/me/avatar` |
| Dupla | `POST /api/couples/invites`, `POST /api/couples/join`, `GET/PATCH /api/couples/me`, `GET/PUT/DELETE /api/couples/me/photo` |
| Agenda | `GET/POST /api/couples/me/events`, `PATCH/DELETE /api/couples/me/events/{id}` |
| Desafios | `GET/POST /api/couples/me/challenges`, `PATCH/DELETE /api/couples/me/challenges/{id}`, `POST /api/couples/me/challenges/{id}/progress`, `DELETE /api/couples/me/challenges/{id}/progress/{progressId}` |
| Placar | `GET /api/couples/me/scoreboard` (semana, mês e totais) |
| Dengos | `GET/POST /api/couples/me/dengos`, `PUT /api/couples/me/dengos/{id}/response`, `PUT /api/couples/me/dengos/{id}/reaction` |
| Foco | `POST /api/couples/me/focus-sessions` |

## Tempo

Semanas (segunda a domingo) e meses dos desafios e do placar são calculados no
fuso do casal, configurado por `APP_TIME_ZONE`. O `Clock` é um bean injetado
nos serviços, o que permite testar viradas de semana com horário fixo. O
progresso de um período é derivado dos avanços registrados nele, então mudar
a frequência de um desafio recalcula o progresso sem migrar dados.

## Frontend

- `src/lib`: regras puras (datas, recorrência, desafios, notificações,
  conquistas), testadas com `node --test`.
- `src/api`: cliente HTTP (timeout, sessão expirada, erros de rede) e a
  emulação do modo apresentação, que segue as mesmas regras do backend.
- `src/hooks`: sincronização com a API a cada 30 s enquanto a aba está
  visível, cronômetro de foco baseado em horário de término e imagens
  privadas carregadas com o token.
- `src/screens`, `src/dashboard`, `src/panels`: telas, blocos do painel e
  painéis modais.

Uma sincronização periódica que cruza uma alteração feita pela pessoa é
descartada e refeita, para não trazer de volta um item recém-excluído nem
duplicar um recém-criado.

## Fronteiras de segurança

- E-mail é normalizado e único.
- Senhas usam BCrypt.
- JWT contém apenas o identificador do usuário.
- O usuário autenticado é resolvido no servidor; IDs de usuário vindos do
  cliente não definem propriedade.
- Casais admitem no máximo duas pessoas.
- Convites são aleatórios, expiram e só podem ser consumidos uma vez.
- A foto fica fora do diretório público e exige autenticação.

## Etapas do MVP

1. Fundação, autenticação, dupla, convite e dashboard inicial. ✅
2. Desafios exclusivamente `WEEKLY` e `MONTHLY`. ✅ (aceite de sugestões pendente)
3. Atualização de progresso, pontuação e histórico. ✅
4. Sessões do modo Foco Juntos por REST. ✅ (sincronização em tempo real pendente)
5. Pedidos “Preciso de um Dengo”. ✅
6. Modo Retomada e consolidação dos testes ponta a ponta.

