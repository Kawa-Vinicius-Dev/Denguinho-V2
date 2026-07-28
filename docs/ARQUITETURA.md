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

1. Fundação, autenticação, dupla, convite e dashboard inicial.
2. Desafios exclusivamente `WEEKLY` e `MONTHLY`, com aceite de sugestões.
3. Atualização de progresso, pontuação e histórico.
4. Sessões do modo Foco Juntos por REST.
5. Pedidos “Preciso de um Dengo”.
6. Modo Retomada e consolidação dos testes ponta a ponta.

