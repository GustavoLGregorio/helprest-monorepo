# HelpRest — Análise Profunda do Ecossistema ElysiaJS & Plano de Refatoração

> [!IMPORTANT]
> **ESTUDO DE MIGRAÇÃO ARQUITETURAL: CUSTOM CODEBASE → ECOSISTEMA NATIVO ELYSIAJS**
> Este documento apresenta o diagnóstico completo do backend atual (`helprest-api`), comparando cada implementação customizada com a solução nativa do ecossistema oficial do **ElysiaJS** no **Bun**.

---

## 1. Visão Geral do Diagnóstico

A codebase atual do `helprest-api` foi construída com foco em **Clean Architecture & DDD**. No entanto, a camada de entrega HTTP apoiava-se em utilitários manuais sobre o runtime `Bun.serve`:
- Roteamento via expressões regulares personalizadas em [router.ts](file:///home/gustavo/Dev/helprest/helprest-monorepo/helprest-api/src/interface/http/router.ts) (440+ linhas).
- Assinatura/Verificação JWT manual com `jose` em `jwt.ts`.
- Extração imperativa de token Bearer em `auth.middleware.ts`.
- Manipulação manual de cabeçalhos CORS em `cors.middleware.ts`.
- Validação manual de requisições com `parseBody()` e `parseQuery()`.
- Checagem manual de autorização por `Role` imperativa dentro do corpo das rotas.

A migração para o ecossistema oficial do **ElysiaJS** visa substituir completamente esses utilitários manuais por **ferramentas nativas de primeira classe** mantidas pela equipe do Elysia, reduzindo o volume de código, eliminando bugs potenciais de boilerplate e trazendo segurança de tipos ponta a ponta (End-to-End Type Safety).

---

## 2. Matriz Comparativa: Codebase Atual vs. Ecossistema ElysiaJS

| Componente Arquitetural | Implementação Atual (Customizada) | Solução Oficial ElysiaJS | Benefício da Refatoração |
|---|---|---|---|
| **Roteamento & Controllers** | Custom regex router em `router.ts` com `addRoute()` e `matchRoute()` | **Elysia Core (`new Elysia()`)** com composição modular de controllers (`.use(authModule)`) | Elimina regex manual, traz tipagem encadeada, suporte nativo a HTTP/1.1 e WebSockets no Bun. |
| **Token Bearer** | Leitura manual de `request.headers.get("Authorization")?.slice(7)` | **Plugin `@elysiajs/bearer`** | Extrai e injeta a propriedade `bearer` no contexto com tipagem forte. |
| **Autenticação JWT** | Wrapper manual da biblioteca `jose` em `jwt.ts` (`SignJWT` / `jwtVerify`) | **Plugin `@elysiajs/jwt`** | Assinatura e verificação integradas via `.jwt.sign()` e `.jwt.verify()` direto no contexto e macros. |
| **Manipulação CORS** | Script `cors.middleware.ts` ajustando headers manualmente | **Plugin `@elysiajs/cors`** | Configuração declarativa global de origens, métodos, headers e preflight OPTIONS. |
| **Validação de Inputs** | Schemas Zod v4 parseados por utilitários customizados `parseBody` / `parseQuery` | **Schema Nativo (TypeBox `t` ou Zod)** declarados em cada rota (`{ body, query, params, response }`) | Resposta de erro 400 automática, inferência de tipos em tempo de compilação e geração OpenAPI. |
| **Autorização por Role** | Chamadas imperativas `authorizeRole(auth, "admin")` dentro dos handlers | **Macros Elysia (`.macro({ role: ... })`)** | Checagem declarativa de papéis nas opções da rota: `{ role: 'admin' }`. O handler fica 100% limpo! |
| **Tratamento de Erros** | Catch block manual em `router.ts` encaminhando para `error.middleware.ts` | **Lifecycle `.onError(({ error, status }) => ...)`** | Captura centralizada das exceções de domínio (`AppError`, `NotFoundError`, `ForbiddenError`, `ValidationError`). |
| **Documentação da API** | Arquivo texto `api.http` mantido manualmente | **Plugin `@elysiajs/swagger`** | Interface gráfica interativa Swagger UI gerada automaticamente em `/swagger` em tempo de execução. |
| **Injeção de Dependências** | Instanciação de repositórios no escopo global de arquivos | **Context Extensions (`.decorate()`, `.state()`, `.derive()`)** | Injeta repositórios e serviços no contexto da aplicação, permitindo mocks limpos em testes. |
| **Tipagem Frontend-Backend** | Interfaces DTO duplicadas ou compartilhadas manualmente | **Eden Treaty (`@elysiajs/eden`)** | Cliente RPC type-safe para o app Expo consumir a API sem precisar redeclarar tipos de rota. |

---

## 3. Padrões Elegantes do ElysiaJS a Adotar

### 3.1 Macro de Autorização por Role (`roleMacro`)

Em vez de verificar permissões manualmente no corpo da função de cada rota, criaremos uma Macro reutilizável no Elysia:

```typescript
// src/interface/plugins/auth.plugin.ts
import { Elysia, t } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { Role } from "@domain/value-objects/Role";
import type { RoleType } from "@domain/value-objects/Role";
import { UnauthorizedError, ForbiddenError } from "@shared/errors";

export const authPlugin = new Elysia({ name: "auth" })
    .use(bearer())
    .use(
        jwt({
            name: "jwtService",
            secret: process.env.JWT_SECRET ?? "default-secret",
        })
    )
    .macro({
        role(requiredRole: RoleType) {
            return {
                async beforeHandle({ bearer, jwtService }) {
                    if (!bearer) {
                        throw new UnauthorizedError("Missing Bearer token");
                    }
                    const payload = await jwtService.verify(bearer);
                    if (!payload) {
                        throw new UnauthorizedError("Invalid or expired token");
                    }

                    const userRole = Role.create(payload.role as string);
                    if (!userRole.hasPermission(requiredRole)) {
                        throw new ForbiddenError(`Role level '${requiredRole}' required`);
                    }
                },
            };
        },
    });
```

Uso declarativo nos controllers:

```typescript
// Exemplo em product.controller.ts
app.post("/api/products", ({ body, user }) => createProductUseCase.execute(body), {
    role: "establishment_admin", // ← Checagem declarativa limpa!
    body: t.Object({
        name: t.String(),
        price: t.Number({ minimum: 0 }),
    }),
});
```

---

### 3.2 Interceptador Global de Erros (`errorPlugin`)

```typescript
// src/interface/plugins/error.plugin.ts
import { Elysia } from "elysia";
import { AppError } from "@shared/errors";

export const errorPlugin = new Elysia({ name: "error-handler" })
    .onError(({ error, code, set }) => {
        if (error instanceof AppError) {
            set.status = error.statusCode;
            return {
                error: error.name,
                message: error.message,
                details: error.details ?? null,
            };
        }

        if (code === "VALIDATION") {
            set.status = 400;
            return {
                error: "ValidationError",
                message: "Invalid request data",
                details: error.all,
            };
        }

        set.status = 500;
        return {
            error: "InternalServerError",
            message: "An unexpected error occurred",
        };
    });
```

---

### 3.3 Estrutura de Pastas Recomendada (Feature Modules + Clean Architecture)

```
helprest-api/src/
├── domain/                      → Intacto (Entities, Value Objects, Services, Repositories)
├── application/                 → Intacto (Use Cases, DTOs)
├── infrastructure/              → Intacto (MongoDB, Redis, Repositories)
└── interface/                   → Camada de Entrega Refatorada para ElysiaJS
    ├── app.ts                   → Instância principal do Elysia unificando módulos
    ├── plugins/                 → Plugins Globais em ecossistema nativo
    │   ├── auth.plugin.ts       → JWT, Bearer & Macro de Role
    │   ├── error.plugin.ts      → Mapeador de Exceções de Domínio
    │   └── security.plugin.ts   → CORS e Sanitização NoSQL
    └── modules/                 → Controllers Modulares por Domínio
        ├── auth/                → POST /api/auth/google, POST /api/auth/refresh
        ├── user/                → GET /api/users/me, PATCH /api/users/me, PATCH /api/users/me/flags
        ├── establishment/       → GET /api/establishments, /recommended, /nearby, /search, /:id
        ├── product/             → POST /api/products, PATCH/DELETE /api/products/:id
        ├── flag/                → GET /api/flags, POST /api/flags
        ├── visit/               → POST /api/visits, GET /api/visits/user/:userId, /api/social/feed
        └── favorite/            → GET /api/favorites, POST/DELETE /api/favorites/:id
```

---

## 4. Plano de Execução da Refatoração

1. **Fase 1 — Instalação dos Plugins Adicionais do Elysia**:
   - `bun add @elysiajs/bearer @elysiajs/jwt` em `helprest-api`.
2. **Fase 2 — Criação dos Plugins Globais Nativo-Primeiros**:
   - Desenvolver `error.plugin.ts`, `security.plugin.ts` (integração CORS + NoSQL sanitize) e `auth.plugin.ts` (Bearer + JWT + Role Macro).
3. **Fase 3 — Construção dos Módulos Controllers**:
   - Criar cada módulo em `src/interface/modules/*` com TypeBox/Zod schemas e handlers desacoplados que delegam para os Use Cases.
4. **Fase 4 — Unificação no Server (`app.ts` / `src/index.ts`)**:
   - Integrar Swagger em `/swagger`, registrar todos os módulos e conectar Graceful Shutdown.
5. **Fase 5 — Atualização das Suítes de Testes**:
   - Atualizar testes de integração utilizando `app.handle(new Request(...))` do ElysiaJS.
