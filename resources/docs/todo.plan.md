# HelpRest — Roadmap de Features Planejadas

> [!IMPORTANT]
> **PROTOCOLO DE IMPLEMENTAÇÃO MONO-TAREFA (AGENT SINGLE-TASK RULE)**
> Quando um agente de IA iniciar uma sessão de trabalho, ele deve:
> 1. Analisar as pendências deste arquivo e identificar o primeiro item marcado como `[ ]` dentro do módulo prioritário.
> 2. Focar **exclusivamente** na implementação de um único item (ou na sub-tarefa mínima associada).
> 3. É terminantemente proibido tentar resolver múltiplos itens de seções diferentes na mesma run.
> 4. Após implementar e validar (garantir sucesso no loop de typecheck e testes), o agente deve atualizar este arquivo marcando o item correspondente como `[x]` antes de encerrar seu turno.

---

## 1. Painel Administrativo (Admin / SuperAdmin)

### 1.1 Sistema de Roles & Permissões

- [x] Criar entidade `Role` com níveis hierárquicos: `user`, `establishment_admin`, `admin`, `superadmin`
- [x] Implementar middleware de autorização por role no backend
- [ ] `superadmin` tem acesso total ao sistema (gestão de todas as entidades)
- [ ] `admin` pode gerenciar estabelecimentos, flags e usuários dentro de um escopo
- [ ] `establishment_admin` gerencia apenas seu estabelecimento e filiais vinculadas

### 1.2 Painel Admin (SuperAdmin)

- [ ] Dashboard geral com métricas globais: total de usuários, estabelecimentos, visitas, flags mais usadas
- [ ] CRUD completo de flags (criar, editar, desativar, reordenar)
- [ ] Moderação de avaliações (ocultar reviews ofensivas, denúncias)
- [ ] Gerenciamento de usuários (ban, suspensão, histórico)
- [ ] Logs de auditoria de ações administrativas

### 1.3 Painel do Estabelecimento (Establishment Admin)

- [ ] Dashboard personalizado por estabelecimento com métricas próprias
- [ ] Edição de perfil do estabelecimento (nome, logo, localização, contato, redes sociais)
- [ ] Gerenciamento de flags atendidas (adicionar/remover restrições)
- [ ] Visualização de visitas e avaliações recebidas com filtros por data

---

## 2. Sistema de Matriz e Filiais

### 2.1 Hierarquia Matriz → Filiais

- [ ] Criar campo `parentEstablishmentId` (nullable) na entidade `Establishment` para indicar a matriz
- [ ] Criar campo `branchType`: `headquarters` | `branch`
- [ ] A **matriz** pode criar, editar e desativar filiais vinculadas
- [ ] Filiais herdam flags da matriz por padrão, com possibilidade de override local
- [ ] Filiais possuem localização, rating e visitas independentes

### 2.2 Versionamento de Filiais

- [ ] Cada filial pode ter versão independente de cardápio e flags (divergência controlada)
- [ ] Histórico de alterações de filiais (log de mudanças: quem alterou, quando, o quê)
- [ ] Matriz pode aplicar alterações em lote para todas as filiais (propagação de flags/cardápio)
- [ ] Sistema de sync/diff entre configuração da matriz e filiais

### 2.3 Admin de Filiais (via Matriz)

- [ ] `establishment_admin` da matriz pode ler e editar todas as filiais
- [ ] `establishment_admin` de filial pode editar apenas sua própria filial
- [ ] Listagem de filiais com status, localização de cada, e métricas resumidas
- [ ] Filtro por filial no dashboard de métricas

---

## 3. Analytics e Métricas para Estabelecimentos

### 3.1 Métricas de Exposição

- [ ] Contabilizar quantas vezes o estabelecimento apareceu em resultados de busca (impressões)
- [ ] Contabilizar quantas vezes o perfil do estabelecimento foi aberto (cliques / visualizações)
- [ ] Calcular taxa de conversão: visualizações → visitas registradas
- [ ] Gráficos temporais (diário, semanal, mensal) de impressões e visualizações

### 3.2 Análise de Flags

- [ ] Mostrar quais flags trazem mais usuários para o estabelecimento
- [ ] Ranking de flags por volume de buscas que resultaram em exibição
- [ ] Sugestão de novas flags que poderiam ampliar a visibilidade (baseado em demanda de usuários na região)
- [ ] Comparativo de performance antes/depois de adicionar ou remover uma flag

### 3.3 Métricas de Visitas e Avaliações

- [ ] Total de visitas por período com gráficos de tendência
- [ ] Distribuição de notas (percentual de 1★ a 5★)
- [ ] Evolução do rating médio ao longo do tempo
- [ ] Palavras-chave mais frequentes nas avaliações (análise textual simples)
- [ ] Tempo médio entre a primeira visualização e a primeira visita (funil de conversão)

### 3.4 Métricas de Amostragem para Usuários

- [ ] Quantidade de amostras (visitas) por usuário para cada estabelecimento
- [ ] Detecção de usuários recorrentes vs. novos visitantes  
- [ ] Segmentação de visitantes por flags (perfil de restrições do público atendido)

---

## 4. Gestão de Cardápio e Alimentos

### 4.1 Catálogo de Alimentos

- [ ] Criar entidade `FoodItem` com: nome, descrição, preço, foto, flags compatíveis, informações nutricionais
- [ ] Catálogo compartilhado de alimentos comuns (banco de dados base com itens pré-cadastrados)
- [ ] Estabelecimento pode usar itens do catálogo base ou criar alimentos customizados
- [ ] Alimentos devem ter flags vinculadas automaticamente por ingredientes (ex.: prato sem glúten ← flag "sem glúten")

### 4.2 Gestão de Cardápios (Menus)

- [ ] Criar entidade `Menu` vinculada ao estabelecimento, com seções (categorias)
- [ ] Cardápio organizado por categorias: Entradas, Pratos Principais, Sobremesas, Bebidas, etc.
- [ ] Suporte a múltiplos cardápios por estabelecimento (ex.: Almoço, Jantar, Fins de Semana)
- [ ] Ativação/desativação de cardápios e itens (sazonalidade, indisponibilidade)
- [ ] Herança de cardápio entre matriz e filiais com override por filial

### 4.3 Informações Nutricionais e de Restrição

- [ ] Campos de informação nutricional por alimento: calorias, proteínas, carboidratos, gorduras, fibras
- [ ] Lista de alérgenos presentes (leite, ovos, amendoim, soja, trigo, etc.)
- [ ] Validação automática de compatibilidade: o sistema alerta se um item do cardápio contradiz uma flag declarada pelo estabelecimento
- [ ] Filtro de cardápio por flags do usuário (mostrar apenas itens compatíveis na visualização)

---

## 5. Gestão Avançada de Flags

### 5.1 Edição e Ciclo de Vida de Flags

- [ ] Edição de flags existentes (nome, descrição, cores, tag) via painel admin
- [ ] Desativação soft de flags (sem deletar, mantém histórico e referências)
- [ ] Versionamento de flags (log de alterações)
- [ ] Agrupamento de flags por categoria (Dietas, Alergias, Intolerâncias, Estilo de Vida)

### 5.2 Flags Compostas e Dependências

- [ ] Suporte a flags compostas (ex.: "Plant-Based" agrupa "Veganismo" + "Sem Lactose")
- [ ] Sistema de sugestão de flags relacionadas para o usuário durante seleção visual
- [ ] Flags com ícones personalizados e descrições expandidas

---

## 6. Features do Usuário (Extensões)

### 6.1 Favoritos e Listas

- [ ] Usuário pode favoritar estabelecimentos
- [ ] Criação de listas personalizadas de estabelecimentos (ex.: "Pra ir no final de semana")
- [ ] Compartilhamento de listas entre usuários

### 6.2 Social

- [ ] Fotos públicas vinculadas a visitas
- [ ] Feed social com atividade recente de contatos/amigos
- [ ] Sistema de seguir outros usuários

### 6.3 Notificações

- [ ] Push notifications para novos estabelecimentos próximos compatíveis com as flags do usuário
- [ ] Notificações de promoções de estabelecimentos favoritados
- [ ] Alertas quando um estabelecimento favorito adiciona novas flags

---

## 7. Infraestrutura, Qualidade de Código & Atualização de Dependências

### 7.1 Atualização e Alinhamento de Pacotes

- [x] **Alinhamento do Expo SDK 53 (helprest-app)**: Atualizar pacotes para as versões exatas recomendadas pelo `expo install --check`:
  - `expo`: `~53.0.20` → `~53.0.27` (correções de estabilidade)
  - `expo-image`: `~2.4.0` → `~2.4.1`
  - `expo-router`: `~5.1.4` → `~5.1.11`
  - `expo-system-ui`: `~5.0.10` → `~5.0.11`
  - `react-native`: `0.79.5` → `0.79.6`
- [x] **Atualização de Dependências Backend (helprest-api)**:
  - `argon2`: `0.44.0` → `0.45.x`
  - `jose`: `6.1.3` → `6.2.4`
  - `@typescript-eslint/*`: `8.62.1` → `8.65.x`
  - `eslint`: `10.6.0` → `10.8.x`

### 7.2 Melhorias Arquiteturais no Backend (helprest-api)

- [x] **Graceful Shutdown do Servidor Bun & Conexões**: Implementar manipulação de sinais `SIGINT`/`SIGTERM` no entrypoint `src/index.ts` para encerrar graciosamente os pools do MongoDB Atlas e Redis.
- [x] **Suíte de Testes Unitários Isolados**: Criar testes unitários em `tests/unit/` cobrindo regras de negócio puras (entidades do domínio, value objects e `RecommendationService`) sem dependência de banco de dados ativo.
- [x] **Reforço de Sanitização NoSQL**: Auditar e garantir sanitização estrita via Zod em todos os endpoints de busca/query para eliminar o risco de operadores NoSQL injetados (`$gt`, `$ne`, `$where`).
- [x] **Remoção de Autenticação Local (OAuth-Only)**: Remover endpoints, DTOs e fluxos de cadastro/login local (senha/argon2) para unificar autenticação exclusivamente via provedores de identidade (Google OAuth), reduzindo a complexidade do servidor.
- [x] **Mapeamento Arquitetural & Diagramação Visual**: Elaborar especificação detalhada da arquitetura (Frontend, Backend e Banco de Dados), incluindo diagramas Mermaid de classes de domínio, Diagrama de Entidade-Relacionamento (DER NoSQL) e fluxos de dados.

### 7.3 Melhorias Arquiteturais no Frontend (helprest-app)

- [ ] **Mapeamento Arquitetural & Diagramação do Frontend**: Elaborar especificação detalhada da aplicação mobile (Expo Router), incluindo mapa de telas, fluxos de navegação/onboarding, arquitetura de componentes atômicos e mapa de integração com a API.
- [ ] **Query Key Factory para TanStack Query**: Centralizar todas as chaves de query em uma fábrica fortemente tipada (ex: `establishmentKeys`, `userKeys`) eliminando strings mágicas.
- [ ] **Mutex no Auto-Refresh Token Flow (`services/api.ts`)**: Implementar fila de requisições / mutex para evitar chamadas de refresh duplicadas ou concorrentes quando múltiplos requests retornarem status 401.
- [ ] **Tipagem Estrita de Storage MMKV**: Encapsular acessos ao `react-native-mmkv` com chaves e tipos fortemente definidos no módulo `storage/`.

---

## 8. Refatoração Arquitetural e Migração do Backend para ElysiaJS (Elysia + Bun)

### 8.1 Contexto e Justificativa (Como & Por quê)

> **Diagnóstico da Arquitetura Atual (`helprest-api`):**  
> Atualmente, a camada de entrega HTTP é manipulada via roteador customizado baseado em expressões regulares sobre `Bun.serve` concentrado em [router.ts](file:///home/gustavo/Dev/helprest/helprest-monorepo/helprest-api/src/interface/http/router.ts) (440+ linhas). Embora rápido, a ausência de um framework estruturado facilita o crescimento desordenado de boilerplate, duplicidade em parsers de query/body, checagens manuais de ObjectId e acoplamento de middlewares.

> **Objetivo da Migração para ElysiaJS:**  
> Migrar a camada de **Interface HTTP** para o framework **ElysiaJS** mantendo o servidor executando nativamente no **Bun** runtime. A arquitetura de **Clean Architecture & DDD** será rigorosamente preservada: as camadas de **Domínio** (`domain/entities`, `domain/value-objects`, `domain/services`), **Aplicação** (`application/use-cases`) e **Infraestrutura** (`infrastructure/repositories`, `infrastructure/database`) **não serão alteradas**.

> **Vantagens Técnicas Garantidas:**  
> 1. **Modularidade por Domínio**: Organização dos controllers em sub-módulos encapsulados (`src/interface/modules/*`).
> 2. **Validação de Schema Unificada**: Validação automática de `body`, `query`, `params` e `response` via TypeBox ou Zod nativo.
> 3. **Documentação Swagger/OpenAPI Automática**: Geração em tempo de execução via `@elysiajs/swagger` no endpoint `/swagger`.
> **Estratégia de Adoção do Ecossistema Oficial (Primeira Classe):**  
> Priorizar as ferramentas oficiais desenvolvidas pela equipe do ElysiaJS em substituição aos utilitários manuais da codebase:
> - **`@elysiajs/jwt` & `@elysiajs/bearer`**: Substituem o wrapper manual `jose` em `jwt.ts` e o parse imperativo de cabeçalho Bearer.
> - **`@elysiajs/cors`**: Substitui o manipulador manual `cors.middleware.ts`.
> - **`@elysiajs/swagger`**: Documentação Swagger/OpenAPI viva em `/swagger`.
> - **Macros Nativas (`.macro({ role: ... })`)**: Validação declarativa de autorização por `Role` sem poluir as funções de controller.
> - **Estudo Detalhado**: Ver [Análise Profunda do Ecossistema ElysiaJS](./elysia-refactoring-analysis.md).

### 8.2 Sub-tarefas de Implementação

- [x] **Setup de Dependências ElysiaJS**: Instalar `elysia`, `@elysiajs/cors`, `@elysiajs/swagger` e `@elysiajs/jwt` em `helprest-api/package.json`.
- [x] **Plugins Globais Nativo-Primeiros**:
  - Criar `errorPlugin`: Interceptador `.onError()` para capturar `NotFoundError`, `ValidationError`, `ForbiddenError`, `UnauthorizedError`, `ConflictError`, `RateLimitError` e formatar respostas JSON padronizadas.
  - Criar `securityPlugin`: Aplicar sanitização NoSQL (`sanitize`), HSTS e `@elysiajs/cors`.
  - Criar `authPlugin`: Macro/Guard nativo via `@elysiajs/bearer` + `@elysiajs/jwt` com extração de `sub`, `email` e macro declarativo de `role`.
- [ ] **Migração dos Módulos de Rota / Controllers**:
  - [x] `authModule`: Rotas `POST /api/auth/google`, `POST /api/auth/refresh`.
  - [x] `userModule`: Rotas `GET /api/users/me`, `PATCH /api/users/me`, `PATCH /api/users/me/flags`.
  - [ ] `establishmentModule`: Rotas `GET /api/establishments`, `GET /api/establishments/recommended`, `GET /api/establishments/nearby`, `GET /api/establishments/search`, `GET /api/establishments/my-establishment`, `GET /api/establishments/:id`, `POST /api/establishments`.
  - [ ] `productModule`: Rotas `POST /api/products`, `PATCH /api/products/:id`, `DELETE /api/products/:id`.
  - [ ] `flagModule`: Rotas `GET /api/flags`, `POST /api/flags`.
  - [ ] `visitModule`: Rotas `POST /api/visits`, `GET /api/visits/user/:userId`, `GET /api/visits/establishment/:id`, `GET /api/social/feed`.
  - [ ] `favoriteModule`: Rotas `GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites/:id`.
- [ ] **Geração de Documentação OpenAPI/Swagger**: Habilitar a rota `/swagger` no servidor principal com metadados do projeto.
- [ ] **Atualização do Entrypoint `src/index.ts` & Suíte de Testes**:
  - Refatorar `src/index.ts` para inicializar a instância principal do Elysia (`app.listen(PORT)`), integrando o Graceful Shutdown com `app.stop()`.
  - Atualizar os testes de integração para disparar requisições via `app.handle(new Request(...))`.

---

## Priorização Sugerida

| Fase | Módulos | Justificativa |
|---|---|---|
| **Fase 0 (Imediata)** | Atualização de Pacotes & Graceful Shutdown | Manter estabilidade do ecossistema e compatibilidade do Expo SDK 53 |
| **Fase 1** | Roles & Permissões, Painel do Estabelecimento, Gestão de Flags | Fundação para todas as features de gestão |
| **Fase 2** | Migração do Backend para ElysiaJS (Elysia + Bun) | Padronização e robustez arquitetural para suportar escala |
| **Fase 3** | Sistema Matriz/Filiais, Cardápio e Alimentos | Valor direto para estabelecimentos |
| **Fase 4** | Analytics e Métricas | Retenção e engajamento de estabelecimentos |
| **Fase 5** | Painel Admin (SuperAdmin), Favoritos, Social, Notificações | Escala e engajamento de usuários |

---

## Referências Internas

- [Arquitetura do Sistema](./base.system.md)
- [Backend — Arquitetura e Padrões](./backend.md)
- [Frontend — Arquitetura e Padrões](./frontend.md)
- [Diretrizes de Arquitetura & Padrões de Qualidade Contínua](./continuous-architecture-standards.md)
- [Análise Profunda do Ecossistema ElysiaJS](./elysia-refactoring-analysis.md)



