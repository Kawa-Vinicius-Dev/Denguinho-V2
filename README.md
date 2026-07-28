# Denguinho V2

Aplicação privada para duas pessoas cuidarem dos próprios objetivos com apoio,
leveza e competição saudável.

## Estrutura

- `backend`: Java 21, Spring Boot, Security/JWT, JPA, Flyway e PostgreSQL.
- `frontend`: React com Vite, responsivo e mobile-first.
- `docs`: diagnóstico, arquitetura e roadmap do produto.

## Rodando localmente

1. Copie `.env.example` para `.env` e troque todos os valores.
2. Inicie PostgreSQL e backend com `docker compose up --build`.
3. Em outro terminal, execute `cd frontend`, `npm install` e `npm run dev`.
4. Abra `http://localhost:5173`.

O Swagger fica em `http://localhost:8080/swagger-ui.html`.

Sem Docker, o frontend pode ser apresentado isoladamente com
`npm run dev:demo`. Esse modo usa dados fictícios locais e nunca deve ser usado
como ambiente de produção.

## Segurança

Segredos, tokens e fotos pessoais não são versionados. A foto do casal usada no
desenvolvimento fica em `storage/private/couple-photos` e só é entregue pela API
autenticada. A imagem pública é um fallback genérico.

