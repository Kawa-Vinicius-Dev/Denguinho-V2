# Denguinho V2

O **Denguinho V2** é uma aplicação privada para casais acompanharem objetivos, cumprirem desafios e manterem uma competição leve e saudável.

O projeto está sendo reconstruído com foco em **Java e Spring Boot**, transformando a primeira versão em uma aplicação mais completa e organizada para portfólio.

> **Status:** em desenvolvimento. As funcionalidades abaixo representam o escopo planejado e serão implementadas por etapas.

## Objetivo

Criar um ambiente exclusivo para duas pessoas que una relacionamento, organização e motivação. Cada pessoa poderá acompanhar seu próprio desempenho, participar de missões em dupla e visualizar a evolução do casal ao longo do tempo.

O Denguinho não terá desafios diários. A dinâmica será baseada apenas em:

- desafios semanais;
- desafios mensais;
- missões individuais;
- disputas competitivas;
- missões realizadas em dupla.

## MVP planejado

A primeira versão funcional terá:

- cadastro e autenticação do casal;
- criação de desafios semanais e mensais;
- definição de participante, categoria, prazo e pontuação;
- registro da conclusão dos desafios;
- placar entre os participantes;
- acompanhamento do progresso individual e conjunto;
- histórico dos desafios;
- definição do vencedor da semana e do mês;
- dashboard com o card **Nossa Jornada**.

## Categorias dos desafios

- Estudos
- Trabalho
- Projetos
- Saúde
- Organização
- Finanças
- Relacionamento
- Diversão
- Outros

## Funcionalidades futuras

Após a conclusão do MVP, o projeto poderá receber:

- **Modo Foco Juntos:** sessões compartilhadas de estudo, trabalho ou organização;
- **Preciso de um Dengo:** pedido rápido de atenção ou apoio;
- **Modo Retomada:** espaço para o casal se reorganizar após um período difícil;
- mural privado com mensagens e registros;
- recompensas definidas pelo casal;
- surpresas semanais e mensais;
- retrospectiva mensal da evolução do casal.

Esses recursos fazem parte do planejamento e ainda não devem ser considerados implementados.

## Tecnologias planejadas

### Backend

- Java 21
- Spring Boot
- Spring Data JPA
- Spring Security
- JWT
- PostgreSQL
- Flyway
- Maven
- Swagger / OpenAPI
- JUnit e Mockito

### Frontend

- React
- Vite
- interface responsiva e mobile-first
- integração com API REST

## Roadmap

- [ ] Definir regras do domínio e estrutura do banco de dados
- [ ] Criar o backend com Java e Spring Boot
- [ ] Implementar autenticação e vínculo do casal
- [ ] Implementar desafios semanais e mensais
- [ ] Criar pontuação, placar e histórico
- [ ] Desenvolver o dashboard principal
- [ ] Integrar frontend e API
- [ ] Adicionar testes automatizados
- [ ] Documentar a API
- [ ] Preparar demonstração do projeto

## Como executar

O projeto ainda está em fase inicial. As instruções de instalação e execução serão adicionadas quando o primeiro MVP estiver disponível.

## Supabase

O banco de produção está no projeto `Denguinho V2`, na região de São Paulo.
O backend usa o Session Pooler com SSL e mantém o esquema exclusivamente pelas
migrations do Flyway. A Data API do Supabase permanece desativada porque o
frontend conversa apenas com a API Spring Boot.

Configure no ambiente do backend:

- `DB_URL`: URL JDBC do Session Pooler indicada em `.env.example`.
- `DB_USERNAME`: usuário do pool indicado em `.env.example`.
- `DB_PASSWORD`: senha do banco, armazenada somente como segredo do ambiente.
- `JWT_SECRET`: segredo aleatório com pelo menos 32 caracteres.
- `APP_CORS_ALLOWED_ORIGINS`: domínio público do frontend.

O pool do backend usa no máximo cinco conexões por padrão, adequado ao compute
`nano`. Esse valor pode ser ajustado por `DB_POOL_MAX_SIZE`.

## Segurança

Segredos, tokens e fotos pessoais não são versionados. A foto do casal usada no
desenvolvimento fica em `storage/private/couple-photos` e só é entregue pela API
autenticada. A imagem pública é um fallback genérico.

## Versão anterior

A primeira versão do Denguinho permanece disponível para registrar a evolução do projeto:

[Denguinho - versão original](https://github.com/Kawa-Vinicius-Dev/denguinho)

## Autor

Desenvolvido por [Kawã Vinicius](https://github.com/Kawa-Vinicius-Dev).
