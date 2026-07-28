# Diagnóstico inicial

## Estado encontrado

Em 27 de julho de 2026, o diretório continha apenas um repositório Git vazio.
A branch `master` não possuía commits, arquivos ou histórico. Não havia código,
assets ou decisões arquiteturais que pudessem ser reaproveitados.

## Decisão

Foi adotado um monorepo com três áreas explícitas:

- `backend`: núcleo do portfólio, organizado por responsabilidade.
- `frontend`: cliente React desacoplado e consumidor da API REST.
- `docs`: decisões técnicas, etapas e escopo futuro.

## O que será reaproveitado

Como não havia implementação anterior, o único material de referência foi o
briefing do produto. A foto pessoal anexada é usada somente no desenvolvimento
local, nunca como asset versionado. A paleta visual aproveita seu amarelo quente,
preto e branco sem derivar ou editar a imagem.

## Problemas e riscos

- Ausência de baseline executável ou histórico Git.
- Autorização precisa ser aplicada por dupla em todas as consultas futuras.
- Convites expiram e precisam ser consumidos de forma transacional.
- Uploads exigem limite de tamanho, lista de formatos e armazenamento privado.
- Segredos de JWT e banco não podem ter defaults reais no código.
- Testes reais com PostgreSQL dependem de Docker no ambiente de execução.

