# Arquitetura do Projeto — HelpRest

> **Documentação canônica completa:** `resources/docs/` (ver seção 7).
> Este arquivo é um espelho condensado para consumo rápido do agente. Em caso de conflito, a fonte de verdade é `resources/docs/`.

## 1. Visão Geral do Sistema
Monorepo com dois projetos independentes: app mobile e API REST. Sem orquestrador de monorepo (Turborepo/Nx). A API segue **Clean Architecture + DDD** com separação estrita em quatro camadas. O app segue **file-system routing** (Expo Router) com camadas de serviços, hooks, storage e componentes organizados por Design Atômico.

```
helprest-monorepo/
├── helprest-app/      # Mobile — React Native + Expo
├── helprest-api/      # Backend — Bun + TypeScript
├── resources/         # Documentação, assets, API collections, misc
│   ├── docs/          # Documentação canônica do sistema ← LEITURA OBRIGATÓRIA
│   ├── api/           # api.http (REST Client) + insomnia.json
│   ├── assets/        # Flags, logos, fotos, icons
│   └── misc/          # Excalidraw, apresentações MEPI, brainstorms
└── agent-helprest/    # Infraestrutura de Engenharia (este agente)
    └── memory/
        └── docs/      # Cópia espelho de resources/docs/ para contexto do agente
```

## 2. Stack Tecnológica

### helprest-app (Frontend Mobile)
| Categoria | Tecnologia |
|---|---|
| Framework | React Native 0.79 + Expo SDK 53 |
| Routing | Expo Router v5 (file-based) |
| Server state | TanStack Query v5 |
| Local Storage | react-native-mmkv |
| Mapas | react-native-maps + expo-maps (APIs Google oficiais) |
| Auth | expo-auth-session (Google OAuth2) |
| Imagens | expo-image |
| Animações | react-native-reanimated ~3.17 |
| Ícones | @expo/vector-icons (MaterialCommunityIcons) |
| Notificações | expo-notifications + expo-task-manager |
| Language | TypeScript 5.8 (strict) |

### helprest-api (Backend)
| Categoria | Tecnologia |
|---|---|
| Runtime | Bun (latest) |
| Language | TypeScript 5.9 (strict) |
| HTTP | Bun.serve nativo — router customizado (sem framework) |
| Banco primário | MongoDB (driver oficial v7, **sem Mongoose/ODM**) |
| Cache / Rate Limit | Redis via ioredis (lazy-connect, degradação graciosa) |
| Auth | JWT via `jose` (HS256), Argon2id (hashing) |
| Validação | Zod v4 (runtime + inferência TypeScript) |
| Deploy | Docker + Render |

## 3. Padrões Arquiteturais

### helprest-api — Clean Architecture + DDD

**Regra de Dependência**: `interface → application → domain`. Nunca o inverso. Infraestrutura implementa contratos do domínio.

```
src/
├── domain/            # Regras de negócio — zero dependências externas
│   ├── entities/      # User, Establishment, Flag, Visit
│   │   # Criadas via static create() | Serialização via toDocument()/fromDocument()
│   │   # Imutáveis após criação (ex: Establishment.withNewRating() retorna nova instância)
│   ├── repositories/  # Interfaces (IUserRepository, IEstablishmentRepository, ...)
│   ├── services/      # RecommendationService — algoritmo puro sem dependências externas
│   │   # Score = flagMatchRatio×0.5 + ratingNormalized×0.3 + proximityScore×0.2 + sponsorBonus
│   │   # Usa fórmula Haversine para distância
│   └── value-objects/ # Location (toGeoJSON()), SocialLinks, Rating
├── application/       # Use Cases — orquestração de regras de negócio
│   └── use-cases/
│       ├── auth/      # RegisterUser, LoginUser, RefreshToken, GoogleAuthUser
│       ├── user/      # GetUserProfile, UpdateUserProfile, UpdateUserFlags
│       ├── establishment/ # ListEstablishments, GetEstablishment, GetRecommendedEstablishments,
│       │              #   GetNearbyEstablishments, SearchEstablishments, CreateEstablishment
│       ├── flag/      # ListFlags, CreateFlag
│       └── visit/     # CreateVisit (recalcula rating), ListUserVisits, GetEstablishmentVisits
├── infrastructure/    # Implementações concretas
│   ├── database/mongodb/  # connection.ts (pool 10max/2min), collections.ts, indexes.ts
│   │   # Indexes: 2dsphere em establishments.location.coordinates
│   │   #          text em establishments.companyName
│   │   #          unique em users.email
│   ├── cache/         # RedisCacheService (get/set/delete/TTL/prefix-invalidation)
│   ├── repositories/  # MongoUserRepository, MongoEstablishmentRepository,
│   │              #   MongoFlagRepository, MongoVisitRepository
│   │              #   ($geoNear aggregation pipeline para queries de proximidade)
│   └── security/
│       ├── jwt.ts     # Access tokens (15min) + Refresh tokens (7d) rotacionados
│       ├── password.ts# Argon2id: 64MB memory, 3 iterações
│       └── rateLimiter.ts # Sliding window via Redis sorted sets
│              #   AUTH: 10/min | API: 100/min | SEARCH: 30/min
├── interface/         # Camada de entrada HTTP
│   ├── http/
│   │   ├── router.ts  # Registro via addRoute(method, path, handler) + regex matching
│   │   │              # parseBody() e parseQuery() com Zod + sanitização automática
│   │   └── middleware/
│   │       ├── auth.middleware.ts     # Bearer token → JWT verify → TokenPayload
│   │       ├── error.middleware.ts    # AppError → JSON estruturado; unknown → 500
│   │       ├── cors.middleware.ts     # CORS_ORIGINS env + OPTIONS preflight
│   │       └── security.middleware.ts # HSTS, X-Content-Type-Options, X-Frame-Options
│   └── validation/    # Schemas Zod por recurso: auth, user, establishment, visit
└── shared/
    ├── errors/        # AppError, NotFoundError(404), UnauthorizedError(401),
    │                  # ForbiddenError(403), ValidationError(400), ConflictError(409),
    │                  # RateLimitError(429)
    └── utils/         # sanitize.ts (strip $gt/$ne/etc.), logger.ts (JSON estruturado + requestId)
```

**Design Patterns identificados:**
- **Repository Pattern** — contratos no domínio, implementações na infra
- **Use Case Pattern** — Use cases recebem interfaces por constructor (DI manual); criados fresh por request
- **Factory Method** — `Entity.create()` com validação; `fromDocument()` para hidratação
- **Value Objects imutáveis** — `Location`, `SocialLinks` com factory `create()`
- **Singleton de repositórios** — instanciados uma vez no router e reaproveitados
- **Strategy implícita** — `RecommendationService` encapsula variação de algoritmo
- **Imutabilidade de entidades** — atualizações retornam novas instâncias

**Path Aliases (tsconfig.json):**

| Alias | Target |
|---|---|
| `@domain/*` | `src/domain/*` |
| `@application/*` | `src/application/*` |
| `@infra/*` | `src/infrastructure/*` |
| `@interface/*` | `src/interface/*` |
| `@shared/*` | `src/shared/*` |

### helprest-app — File-system Routing + Design Atômico

```
helprest-app/
├── app/
│   ├── _layout.tsx         # Root layout: QueryClient, auth guard (tokens MMKV → redirect)
│   ├── (auth)/             # Rotas não autenticadas
│   │   ├── home.tsx        # Login (Google OAuth + email/senha)
│   │   └── register/       # Onboarding: step1 (nome), step2 (nasc.), step3 (loc.), step4 (flags)
│   └── (app)/
│       ├── (tabs)/
│       │   ├── (home)/     # Feed / descoberta
│       │   ├── (places)/   # Lista e detalhe de estabelecimentos
│       │   └── (social)/   # Perfil social do usuário
│       └── details/        # Tela de detalhes (fora das tabs)
├── components/
│   ├── atoms/              # Unidades mínimas (MiddleDot, TextDistance)
│   ├── ui/                 # Primitivos UI (Card, StarReview, UserBar)
│   └── login/              # Componentes de auth (Container, LoginOption)
├── services/
│   ├── api.ts              # HTTP client centralizado com auto-refresh (401 → refresh → retry)
│   ├── auth.ts             # Hook useGoogleAuth() via expo-auth-session
│   └── location.ts         # Serviço de localização GPS
├── storage/
│   ├── authTokens.ts       # JWT tokens + Google user info via MMKV
│   └── userLoginStatus.ts  # (depreciado)
├── hooks/queries/          # TanStack Query hooks
├── models/                 # Tipos e modelos de dados
├── constants/              # Colors, configurações
├── styles/                 # Estilos globais
└── utils/                  # saveUserRegisterInfo, saveUserLocation, useHarvesineDistance
```

**Fluxo de autenticação (Google OAuth2):**
1. App inicia → `_layout.tsx` verifica tokens MMKV
2. Tokens presentes → `/(app)/(tabs)/(home)`
3. Sem tokens → `/(auth)/home`
4. Google consent via `expo-auth-session` → ID Token → `POST /api/auth/google`
5. Backend verifica ID Token com Google JWKS → retorna JWT pair + `isNewUser`
6. Novo usuário → onboarding 4 passos → `PATCH /api/users/me` final → home
7. Usuário retornante → home direto

## 4. API Endpoints (Completo)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Registrar + tokens |
| POST | `/api/auth/login` | ❌ | Login + tokens |
| POST | `/api/auth/refresh` | ❌ | Rotacionar refresh token |
| POST | `/api/auth/google` | ❌ | Google OAuth2 (verify ID token) |
| GET | `/api/users/me` | ✅ | Perfil do usuário atual |
| PATCH | `/api/users/me` | ✅ | Atualizar perfil |
| PATCH | `/api/users/me/flags` | ✅ | Atualizar flags alimentares |
| GET | `/api/establishments` | ✅ | Lista paginada |
| GET | `/api/establishments/recommended` | ✅ | Recomendações por flags do usuário |
| GET | `/api/establishments/nearby` | ✅ | Proximidade geoespacial |
| GET | `/api/establishments/search` | ✅ | Busca textual |
| GET | `/api/establishments/:id` | ✅ | Detalhe |
| POST | `/api/establishments` | ✅ | Criar estabelecimento |
| GET | `/api/flags` | ❌ | Listar todas as flags |
| POST | `/api/flags` | ✅ | Criar flag |
| POST | `/api/visits` | ✅ | Criar visita/review (recalcula rating) |
| GET | `/api/visits/user/:userId` | ✅ | Histórico de visitas |
| GET | `/api/visits/establishment/:id` | ✅ | Reviews do estabelecimento |
| GET | `/api/health` | ❌ | Health check |

## 5. Pontos de Integração
- **Google OAuth**: `expo-auth-session` (app) ↔ `POST /api/auth/google` — backend usa `jose.createRemoteJWKSet` para verificar Google ID Tokens sem SDK
- **MongoDB Atlas**: banco primário gerenciado com replicação automática
- **Redis**: cache distribuído e rate limiting (opcional — app degrada graciosamente)
- **Google Maps**: `react-native-maps` + `expo-maps` com APIs oficiais Google
- **Render**: plataforma de deploy da API (Dockerfile presente)
- **EAS Build**: build e distribuição do app mobile

## 6. Variáveis de Ambiente

### helprest-api
| Variável | Propósito |
|---|---|
| `PORT` | Porta do servidor (default: 3000) |
| `NODE_ENV` | development / production / test |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET` | HMAC secret para access tokens |
| `JWT_REFRESH_SECRET` | HMAC secret para refresh tokens |
| `JWT_ACCESS_EXPIRATION` | TTL access token (default: 15m) |
| `JWT_REFRESH_EXPIRATION` | TTL refresh token (default: 7d) |
| `CORS_ORIGINS` | Origens permitidas (default: *) |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth2 client ID |

### helprest-app
| Variável | Propósito |
|---|---|
| `GOOGLE_MAPS_ANDROID_API_KEY` | Google Maps API key (Android) |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth2 client ID |
| `EXPO_PUBLIC_API_URL` | Base URL da API (default: `http://10.0.2.2:3000`) |

## 7. Restrições e Decisões de Design

1. **Sem ODM (Mongoose)** — driver oficial MongoDB para performance e controle total
2. **Sem framework HTTP** — router 100% customizado; novas rotas seguem padrão `addRoute()` em `router.ts`
3. **`jose` over `jsonwebtoken`** — ESM-native, bundle menor
4. **Zod v4** — validação runtime com inferência TypeScript (schemas em `src/interface/validation/`)
5. **Argon2id** — vencedor do Password Hashing Competition; mais seguro que bcrypt
6. **Repositórios singleton, Use Cases por-request** — repositórios stateless reutilizados; use cases frescos por handler para isolamento
7. **Google OAuth server-side** — verification via JWKS sem Google SDK no backend
8. **Redis opcional** — `ioredis` lazy-connect; app funciona sem Redis (sem cache/rate-limit)
9. **MongoDB `$geoNear`** — aggregation pipeline para queries de proximidade nos establishments
10. **i18n obrigatório** — todo texto ao usuário deve ser externalizado (planejado, não implementado)
11. **TypeScript strict** — ambos os pacotes em modo strict completo

## 8. Testes

### helprest-api
- **Runner**: Bun Test Runner (configurado em `bunfig.toml`)
- **Setup**: `tests/setup.ts` — variáveis de ambiente isoladas
- **Unit**: `tests/unit/` — entidades, value objects, `RecommendationService`
- **Integration**: `tests/integration/` — repositórios, HTTP controllers

### helprest-app
- **Unit**: Jest + React Native Testing Library (planejado)
- **E2E**: Detox (planejado)

## 9. Documentação Canônica (Fonte de Verdade)

> Os arquivos abaixo são a fonte de verdade do projeto. Agentes devem priorizá-los sobre qualquer inferência:

| Documento | Caminho | Conteúdo |
|---|---|---|
| Sistema Base | `resources/docs/base.system.md` | Propósito, decisões arquiteturais, critérios técnicos, padrões |
| Backend | `resources/docs/backend.md` | Arquitetura detalhada da API, endpoints, patterns, env vars |
| Frontend | `resources/docs/frontend.md` | Arquitetura do app, auth flow, storage, env vars |
| Diagrama | `resources/docs/base.system.excalidraw.png` | Diagrama visual do sistema |
| API Tests | `resources/api/api.http` | Coleção REST Client para todos os endpoints |
| Insomnia | `resources/api/insomnia.json` | Coleção Insomnia importável |

**Cópia espelho no agente:** `agent-helprest/memory/docs/` — sincronizada manualmente quando `resources/docs/` for atualizado.
