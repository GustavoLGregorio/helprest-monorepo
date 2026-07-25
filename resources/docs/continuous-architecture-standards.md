# HelpRest — Diretrizes de Arquitetura & Padrões de Qualidade Contínua

> [!IMPORTANT]
> **GUIA DE REVISÃO E MANUTENÇÃO DE CÓDIGO (CONTINUOUS CODE QUALITY & ARCHITECTURE STANDARDS)**
> Este documento define os padrões obrigatórios de engenharia de software para o projeto HelpRest. Qualquer refatoração, funcionalidade ou adição de código no Monorepo (Backend e Frontend) deve respeitar estritamente estas diretrizes.

---

## 1. Princípios Gerais e Filosofia de Código

1. **Clean Architecture & Domain-Driven Design (DDD)**:
   - O coração do negócio reside na camada de **Domínio** (`src/domain`), que deve ser inteiramente livre de frameworks, bibliotecas de UI, drivers de banco de dados ou detalhes de infraestrutura.
   - Dependências devem sempre apontar para dentro (**Interface / Infra → Aplicação → Domínio**). Nunca o inverso.
   - Entidades e Value Objects do domínio devem manter imutabilidade e autocontenção de validações de regra de negócio.

2. **SOLID, DRY & KISS**:
   - **Single Responsibility Principle (SRP)**: Cada arquivo, classe ou hook deve possuir uma única razão para mudar.
   - **Open/Closed Principle (OCP)**: Código aberto para extensão, fechado para modificação (uso de interfaces, estratégias e polimorfismo).
   - **Dependency Inversion Principle (DIP)**: Casos de uso dependem de interfaces abstratas (`IRepository`), nunca de implementações concretas (`MongoRepository`).
   - **Don't Repeat Yourself (DRY)**: Centralização de lógicas reutilizáveis em utilitários puramente testáveis ou Value Objects.
   - **Keep It Simple, Stupid (KISS)**: Evitar sobre-engenharia ou abstrações prematuras.

3. **Tipagem Estrita em TypeScript**:
   - Uso obrigatório de `strict: true` no `tsconfig.json`.
   - **Proibição Absoluta do uso de `any`**: Utilizar `unknown`, genéricos fortemente tipados ou tipos derivados (`z.infer`, `typeof`).
   - Todas as funções públicas, métodos de repositório e DTOs de API devem ter tipos de entrada e retorno explicitados.

---

## 2. Padrões do Backend (`helprest-api`)

### 2.1 Padrão de Camadas (Clean DDD Architecture)

```
helprest-api/src/
├── domain/                  → Regras de negócio puras (sem dependências externas)
│   ├── entities/            → Entidades (User, Establishment, Product, Flag, Visit)
│   ├── value-objects/       → Value Objects imutáveis (Location, Rating, SocialLinks, Role)
│   ├── services/            → Serviços de domínio (RecommendationService)
│   └── repositories/        → Contratos e Interfaces (IUserRepository, etc.)
├── application/             → Orquestração dos Casos de Uso (Use Cases)
│   ├── use-cases/           → Classes de caso de uso com método `execute()`
│   └── dtos/                → Data Transfer Objects de entrada e saída
├── infrastructure/          → Implementações técnicas e conectores externos
│   ├── database/            → Conexões MongoDB e Redis
│   ├── repositories/        → Repositórios concretos (MongoUserRepository, etc.)
│   ├── security/            → Assinatura JWT, hashing e rate limiting
│   └── cache/               → Serviço de Cache Redis
├── interface/               → Camada de entrega HTTP / Framework Server (ElysiaJS)
│   ├── controllers/         → Controllers / Handlers HTTP
│   ├── validation/          → Schemas de validação (Zod / TypeBox)
│   └── middleware/          → Autenticação, Autorização (Role), CORS, Erros e Segurança
└── shared/                  → Erros customizados, loggers e utilitários globais
```

### 2.2 Padrão de Nomenclatura e Arquivos

- **Arquivos**: `kebab-case.ts` (ex: `auth.middleware.ts`, `location.schema.ts`, `mongo-user-repository.ts`).
- **Classes / Interfaces / Tipos**: `PascalCase` (ex: `User`, `IUserRepository`, `RecommendationService`, `Role`).
- **Funções / Métodos / Instâncias**: `camelCase` (ex: `authenticateRequest`, `calculateDistance`, `userRepo`).
- **Constantes Globais**: `UPPER_SNAKE_CASE` (ex: `JWT_ACCESS_EXPIRATION`, `MAX_RECOMMENDATIONS`).

### 2.3 Padrões de Design de Código (Design Patterns)

1. **Factory Pattern**:
   - Entidades e Value Objects devem ser instanciados via métodos estáticos `create()` ou `fromDocument()`.
   ```typescript
   export class Location {
       private constructor(readonly state: string, readonly city: string, ...) {}
       static create(props: LocationProps): Location { ... }
   }
   ```
2. **Repository Pattern**:
   - A camada de aplicação solicita dados via interfaces (`IUserRepository`). O repositório concreto converte documentos de banco para Entidades de Domínio via `.fromDocument()` e vice-versa via `.toDocument()`.
3. **Value Object Pattern**:
   - Atributos com comportamento conceitual próprio (`Location`, `Rating`, `Role`, `SocialLinks`) devem ser Value Objects imutáveis.
4. **Strategy / Pure Domain Service Pattern**:
   - Algoritmos como o `RecommendationService` devem ser funções/classes puras sem efeito colateral.

---

## 3. Padrões de Framework Backend (Diretrizes ElysiaJS)

Na transição para **ElysiaJS sobre Bun**, devem ser seguidas as recomendações oficiais do ecossistema:

1. **Modularização por Domínio/Feature**:
   - Cada domínio da API deve ser um plugin encapsulado Elysia (`authModule`, `userModule`, `establishmentModule`, `productModule`, `flagModule`, `visitModule`, `favoriteModule`).
2. **Validação de Entrada e Resposta (Standard Schema / TypeBox / Zod)**:
   - Todas as rotas devem declarar `body`, `query`, `params` e `response` schemas explicitamente nos handlers.
3. **Tratamento de Erros Unificado**:
   - Erros de domínio (`AppError`, `NotFoundError`, `ValidationError`, `ForbiddenError`) são capturados no gancho `.onError()` do Elysia e mapeados para códigos HTTP sem vazar stack traces em produção.
4. **Documentação OpenAPI Integrada**:
   - Uso de `@elysiajs/swagger` com descrições e tags para geração automática da especificação OpenAPI em `/swagger`.

---

## 4. Padrões do Frontend Mobile (`helprest-app`)

1. **Design Atômico & Componentes Pequenos**:
   - Componentes visuais limpos, desacoplados de chamadas diretas de rede.
   - Uso de inline styles com o token de cores unificado (`Color` de `expo-router` / `Colors.light.tint`).
2. **Gerenciamento de Estado de Servidor (TanStack Query)**:
   - Proibido manter estados manuais de fetch dentro dos componentes quando TanStack Query for aplicável.
   - Utilizar Query Keys fortemente tipadas via fábrica (`queryKeys`).
3. **Armazenamento Seguro e Rápido (MMKV / SecureStore)**:
   - Tokens de sessão em `SecureStore`/MMKV encapsulado com chaves declaradas em `storage/`.
4. **Respeito aos Insets e Safe Areas**:
   - Uso de `contentInsetAdjustmentBehavior="automatic"` em `ScrollView` e `FlatList`.

---

## 5. Checklist Recorrente de Qualidade (Pre-Commit / Pre-PR)

Antes de concluir qualquer sessão ou PR, o desenvolvedor/agente deve executar a seguinte verificação:

- [ ] **Typecheck**: `bun run typecheck` (0 erros em `helprest-api` e `helprest-app`).
- [ ] **Linter**: `bun run lint` (0 avisos/erros de formatação e sintaxe).
- [ ] **Testes Unitários**: `bun run api:test:unit` (100% de aprovação na suíte isolada).
- [ ] **Sanitização & Validação**: Nenhuma query NoSQL executada sem validação estrita via Zod/TypeBox e sanitização.
- [ ] **Sem vazamento de abstração**: Repositórios e instâncias de banco não são importados na camada de domínio.
- [ ] **Documentação & Registros**: `todo.plan.md` atualizado com o status exato da tarefa executada.
