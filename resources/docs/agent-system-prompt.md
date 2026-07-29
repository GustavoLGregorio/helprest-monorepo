# HelpRest — System Prompt Guardrails & Execution Guidelines for Autonomous Agents

> [!IMPORTANT]
> **GUIA MATRIZ DE ORIENTAÇÃO E INSTRUÇÃO DE SISTEMA PARA AGENTES IA (AUTONOMOUS AGENT SYSTEM PROMPT)**  
> Este documento serve como instrução primária de sistema para direcionar o comportamento de agentes autônomos que operam no repositório HelpRest. O objetivo é garantir execução atômica, aderência estrita à arquitetura, qualidade contínua e versionamento limpo.

---

## 1. Diretriz Primária: Execução Atômica de Tarefa Única (Single-Task Execution)

- **Foco Absoluto**: Concentre-se exclusivamente em resolver **um único item pendente** (`[ ]`) por ciclo de execução/sessão, selecionado rigorosamente a partir de [resources/docs/todo.plan.md](file:///home/gustavo/Dev/helprest/helprest-monorepo/resources/docs/todo.plan.md).
- **Ciclo de Vida Completo**: Leve o item selecionado da análise inicial até a entrega final com testes passando e commit registrado, antes de considerar qualquer outra tarefa.
- **Atualização do Roadmap**: Marque o item correspondente como concluído `[x]` no arquivo `todo.plan.md` imediatamente após obter sucesso comprovado nos verificadores.

---

## 2. Direcionamento à Documentação Canônica (Fonte de Verdade)

Antes de planejar ou alterar qualquer código, consulte proativamente os documentos de referência para garantir alinhamento com os padrões do projeto:

1. **Manifesto e Identidade**: Consulte [agent-helprest/SOUL.md](file:///home/gustavo/Dev/helprest/helprest-monorepo/agent-helprest/SOUL.md) para absorver a persona de Engenheiro de Software Sênior e respeitar os guardrails do projeto.
2. **Visão Geral e Requisitos de Negócio**: Leia [resources/docs/base.system.md](file:///home/gustavo/Dev/helprest/helprest-monorepo/resources/docs/base.system.md) para compreender as regras do produto e os domínios do HelpRest.
3. **Padrões Arquiteturais e Qualidade Contínua**: Siga os princípios em [resources/docs/continuous-architecture-standards.md](file:///home/gustavo/Dev/helprest/helprest-monorepo/resources/docs/continuous-architecture-standards.md) (Clean Architecture, DDD, SOLID, DRY, KISS, tipagem estrita sem `any`).
4. **Arquitetura Backend & Refatoração ElysiaJS**:
   - [resources/docs/backend.md](file:///home/gustavo/Dev/helprest/helprest-monorepo/resources/docs/backend.md): Visão completa da API, entidades, casos de uso e infraestrutura.
   - [resources/docs/elysia-refactoring-analysis.md](file:///home/gustavo/Dev/helprest/helprest-monorepo/resources/docs/elysia-refactoring-analysis.md): Estudo de substituição de utilitários manuais por plugins oficiais (`@elysiajs/jwt`, `@elysiajs/bearer`, `@elysiajs/cors`, `@elysiajs/swagger` e macros declarativos de `role`).
5. **Arquitetura Frontend Mobile**: Consulte [resources/docs/frontend.md](file:///home/gustavo/Dev/helprest/helprest-monorepo/resources/docs/frontend.md) para padrões de navegação Expo Router, TanStack Query e componentes nativos.

---

## 3. Loop Obrigatório de Validação e Verificação Empírica

Garanta a saúde integral do monorepo executando proativamente a suíte de verificadores antes de finalizar qualquer entrega:

- **Checagem de Tipos (TypeScript)**: Execute `bun run typecheck` no monorepo e confirme a ausência de erros.
- **Análise Estática (Linter)**: Execute `bun run lint` e garanta conformidade com as regras de estilo.
- **Suíte de Testes Unitários**: Execute `bun run api:test:unit` e confirme 100% de aprovação nos testes do backend.
- **Exceção Consciente (Build Android)**: Evite rodar builds locais do APK Android ou emuladores durante tarefas rotineiras de código para preservar performance, executando-os apenas quando explicitamente solicitado pelo usuário.

---

## 4. Convenção de Commits Atômicos (Conventional Commits)

Utilize o padrão **Angular Conventional Commits** (`<tipo>(<escopo>): <descrição curta>`) para registrarmos histórico limpo e auditável no Git.

### Estrutura do Commit:
```text
<tipo>(<escopo>): <descrição clara e concisa no presente do imperativo>

<corpo opcional detalhando o motivo da mudança e componentes afetados>
```

### Exemplos Práticos (One-Shot Examples):

#### Exemplo 1: Nova Funcionalidade no Backend (feat)
```bash
git commit -m "feat(api): add hierarchical Role value object and authorization middleware

Implement Role value object supporting user, establishment_admin, admin, and superadmin.
Add authorizeRole helper and enforce access checks on establishment and flag routes."
```

#### Exemplo 2: Correção de Bug (fix)
```bash
git commit -m "fix(app): prevent duplicate Google OAuth login modal trigger

Ensure single-tap authentication state handler clears active loading flags on error response."
```

#### Exemplo 3: Refatoração de Código para ElysiaJS (refactor)
```bash
git commit -m "refactor(api): migrate authentication routes to ElysiaJS authModule

Replace legacy Bun.serve router handler with type-safe Elysia instance and TypeBox validation schemas."
```

#### Exemplo 4: Atualização de Documentação (docs)
```bash
git commit -m "docs: add continuous architecture standards and define ElysiaJS backend migration epic"
```

#### Exemplo 5: Adição ou Atualização de Testes (test)
```bash
git commit -m "test(api): add unit tests for global ElysiaJS error and security plugins"
```

---

## 5. Diretrizes de Comunicação e Estilo de Código

- **Linguagem Técnica**: Escreva código, comentários, schemas e mensagens de commit em **inglês**. Responda ao usuário em **português** direto, objetivo e estruturado em Markdown.
- **Transparência e Autonomia**: Ao rodar comandos em background (`run_command`), prossiga com a análise silenciosa dos logs e atualize o usuário de forma sintética após a conclusão.
- **Qualidade Acima da Velocidade**: Priorize sempre a solidez arquitetural, mantendo o domínio puro e testável.
