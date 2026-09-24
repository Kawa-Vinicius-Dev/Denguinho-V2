# Denguinho V2

O **Denguinho V2** é uma aplicação privada para casais acompanharem objetivos, cumprirem desafios e manterem uma competição leve e saudável.

O projeto está sendo reconstruído com foco em **Java e Spring Boot**, transformando a primeira versão em uma aplicação mais completa e organizada para portfólio.

> **Status:** MVP funcional, em evolução. Desafios, placar, agenda, pedidos de dengo e foco em dupla já funcionam de ponta a ponta; os itens de "Funcionalidades futuras" ainda não foram implementados.

## Objetivo

Criar um ambiente exclusivo para duas pessoas que una relacionamento, organização e motivação. Cada pessoa poderá acompanhar seu próprio desempenho, participar de missões em dupla e visualizar a evolução do casal ao longo do tempo.

O Denguinho não terá desafios diários. A dinâmica será baseada apenas em:

- desafios semanais;
- desafios mensais;
- missões individuais;
- disputas competitivas;
- missões realizadas em dupla.

## MVP

A versão atual entrega:

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
- Lazer
- Outros

Além do MVP, já funcionam:

- **Preciso de um Dengo:** pedido rápido de atenção ou apoio, respondido pela outra pessoa, e "energia" enviada para os desafios dela;
- **Foco juntos:** sessões de 15, 25 ou 45 minutos em que cada minuto concluído soma um ponto para o casal.

## Como funcionam os desafios

- Cada desafio é **semanal** (segunda a domingo) ou **mensal** e tem uma meta de 1 a 20 avanços por período.
- O progresso recomeça a cada período, contado no fuso do casal (`APP_TIME_ZONE`, padrão `America/Sao_Paulo`). Os últimos quatro períodos ficam no histórico.
- Desafios **individuais** valem 25 pontos por avanço e só quem os criou registra avanços; desafios **em casal** valem 40 pontos e os dois avançam.
- Um avanço do período atual pode ser desfeito por quem o registrou. Excluir um desafio o tira da lista, mas mantém os pontos no placar.
- O placar mostra os pontos do mês e da semana; pontos de desafios em casal e de sessões de foco vão para o casal.

## Funcionalidades futuras

Após o MVP, o projeto poderá receber:

- **Modo Foco Juntos em tempo real:** sessões sincronizadas entre os dois aparelhos;
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

- [x] Definir regras do domínio e estrutura do banco de dados
- [x] Criar o backend com Java e Spring Boot
- [x] Implementar autenticação e vínculo do casal
- [x] Implementar desafios semanais e mensais
- [x] Criar pontuação, placar e histórico
- [x] Desenvolver o dashboard principal
- [x] Integrar frontend e API
- [x] Adicionar testes automatizados
- [x] Documentar a API
- [x] Preparar demonstração do projeto

## Como executar

Pré-requisitos: Java 21, Node 22 e Docker (para o PostgreSQL local).

```bash
cp .env.example .env            # ajuste os valores locais
docker compose up -d postgres   # banco em localhost:5432

cd backend
DB_URL=jdbc:postgresql://localhost:5432/denguinho DB_USERNAME=denguinho \
DB_PASSWORD=change-me-locally JWT_SECRET=um-segredo-local-com-pelo-menos-32-caracteres \
./mvnw spring-boot:run          # API em http://localhost:8080/api

cd ../frontend
npm install
npm run dev                     # http://localhost:5173, usando a API local
```

Para ver a interface sem backend, use `npm run dev:demo`: o modo apresentação
guarda tudo no navegador e simula a outra pessoa da dupla.

A documentação interativa da API fica em `http://localhost:8080/swagger-ui.html`.

### Testes

```bash
cd backend && ./mvnw test        # unitários, controller e integração (H2)
cd frontend && npm test          # regras de datas, desafios e notificações
cd frontend && npm run lint
cd frontend && npm run test:e2e  # Playwright no modo apresentação
```

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
- `APP_TIME_ZONE` (opcional): fuso usado para fechar semanas e meses dos
  desafios. Padrão `America/Sao_Paulo`.

O pool do backend usa no máximo cinco conexões por padrão, adequado ao compute
`nano`. Esse valor pode ser ajustado por `DB_POOL_MAX_SIZE`.

## Segurança

Segredos, tokens e fotos pessoais não são versionados. As fotos privadas ficam
no PostgreSQL do Supabase e só são entregues pela API autenticada. A imagem
pública é um fallback genérico.

## Versão anterior

A primeira versão do Denguinho permanece disponível para registrar a evolução do projeto:

[Denguinho - versão original](https://github.com/Kawa-Vinicius-Dev/denguinho)

## Autor

Desenvolvido por [Kawã Vinicius](https://github.com/Kawa-Vinicius-Dev).
