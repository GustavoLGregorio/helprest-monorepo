# Identidade do Projeto — HelpRest

## 1. Propósito e Visão
HelpRest é uma plataforma mobile-first de **descoberta e recomendação de estabelecimentos** com foco em **restrições alimentares e acessibilidade**. O núcleo do sistema são as **flags** — marcadores que representam restrições ou preferências do usuário (veganismo, intolerância à lactose, intolerância ao glúten, etc.). Estabelecimentos se inscrevem na plataforma declarando quais flags conseguem atender; o algoritmo de recomendação cruza as flags do usuário com as dos estabelecimentos próximos, ponderando avaliação, distância e patrocínio para rankear os resultados.

Quando não há correspondência perfeita de flags, o sistema aplica lógica **granular**: prioriza estabelecimentos com maior número de flags compatíveis, desempata por avaliação e distância. A proposta de valor é conectar pessoas a espaços que realmente atendam suas necessidades — sem descoberta aleatória e sem frustração.

## 2. Tipo de Projeto
- [ ] Frontend (SPA/SSR)
- [ ] Backend (API/Worker)
- [x] Monorepo
- [ ] Biblioteca/Pacote
- [ ] Ferramenta CLI

**Sub-projetos:**
- `helprest-app` — Frontend mobile (React Native + Expo)
- `helprest-api` — Backend REST (Bun runtime)

## 3. Stakeholders e Público-Alvo
- **Usuário final**: Pessoas com restrições alimentares (veganos, intolerantes à lactose/glúten, etc.) que buscam estabelecimentos seguros e convenientes.
- **Estabelecimentos**: Negócios que desejam sinalizar as restrições que conseguem atender e atrair o público certo.
- **Mantenedor atual**: Desenvolvedor solo — Gustavo L. Gregorio (`GustavoLGregorio/helprest-monorepo`).
- **Contexto acadêmico**: Projeto apresentado no **MEPI X 2025** (Mostra Estudantil de Pesquisa e Inovação). Há documentação de apresentação em `resources/misc/`.

## 4. Programas e Parcerias em Avaliação
Programas de aceleração e inovação sendo considerados (lista em `resources/misc/checar_depois.txt`):
- Catalisa
- Centelha
- Paraná Anjo Inovador
- Prime / Rocket

## 5. Status Atual
**Feature Development ativo** — infraestrutura core estabelecida (auth, CRUD de establishments, visitas, flags, recomendação). App com rotas e tabs estruturadas. Sem versão de produção publicada. Onboarding de 4 passos implementado para usuários Google.

## 6. Metadados Específicos do Projeto
- **Versionamento**: `1.0.0` nos dois pacotes — SemVer implícito. Contratos de API devem ser estáveis para não quebrar versões antigas do app.
- **Idioma do código**: **Inglês** para todo o código-fonte (variáveis, funções, commits, schemas, logs). Português apenas em documentação interna e texto ao usuário final.
- **Documentação canônica** (fonte de verdade para o projeto):
  - `resources/docs/base.system.md` — Visão geral, decisões arquiteturais, critérios técnicos
  - `resources/docs/backend.md` — Arquitetura detalhada da API, endpoints, padrões
  - `resources/docs/frontend.md` — Arquitetura do app, fluxo de auth, camadas
  - `resources/docs/base.system.excalidraw.png` — Diagrama visual do sistema
- **Testes de API**: `resources/api/api.http` (VS Code REST Client) e `resources/api/insomnia.json`.
- **Assets visuais**: `resources/assets/` — flags, logos, fotos, icons de estabelecimentos.
- **Próximas telas do onboarding** (pendente): nome, email, data nascimento, flags, localização, redes sociais, foto de perfil (ver `resources/misc/helprest next page.txt`).
