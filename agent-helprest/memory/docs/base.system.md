# HelpRest

## Introdução

Esse projeto se chaama "HelpRest" e se trata de um aplicativo como serviço para conectar pessoas com restrições alimentares a estabelecimentos que a sirvam, de maneira que foca nas preferências do usuário como núcleo, criando assim um sistema de "feature flags" ou apenas "flags" onde cada flag é um tipo de restrição alimentar, ou seja, caso um usuário possua a flag "veganismo" apenas estabelecimentos que selecionaram, no momento de sua inscrição ao sistema, que poderiam trabalhar com veganismo, poderão aparecer para aquele usuário, caso o usuário tenha também a flag "intolerante a lactose" então agora existira um sistema algoritmico de escolha, onde aparecerão estabelecimentos com as duas flags selecionadas, ou seja, que possam atender as duas restrições do usuário. Caso o usuário tenha a flag "veganismo" e "intolerante a lactose" e "intolerante a glúten" então o sistema irá mostrar estabelecimentos que possuam as três flags selecionadas, ou seja, que possam atender as três restrições do usuário. Tudo isso levando em consideração questões como distância, preço, avaliações, etc, para melhor apresentar os estabelecimentos ao usuário. Caso não existam as melhores opções possíveis, o sistema priorizará as opções com as flags selecionadas de maneira granular, ou seja, um estabelecimento que possui apenas uma dessas 3 flags porém que possua avaliações melhores que os demais, e também aparecerão outros estabelecimentos com 2 das 3 flags selecionadas.

Por outro lado, o sistema também irá permitir que os estabelecimentos inscrevam-se a ele, ou seja, que possam se inscreverem a ele, e que possam selecionar as flags que desejam, de maneira que se torne um bom anunciador de estabelecimentos que atendam as restrições do usuário.

## Arquitetura

Para que o HelpRest tenha robustez, capacidade de escala, segurança e longevidade tecnológica, a arquitetura deve partir de uma base mobile em React Native com Expo, um backend orientado a serviços usando Bun e persistência em banco NoSQL utilizando o ecossistema da MongoDB, garantindo compatibilidade com ambientes distribuídos, facilidade de replicação e bom suporte a grandes volumes de dados sem necessidade de migrações estruturais frequentes. O uso de mapas deve ser baseado nas APIs oficiais da Google, evitando wrappers abandonados e garantindo atualização contínua, compatibilidade com novas versões do sistema operacional e suporte a recursos modernos como otimização de rotas e geocoding preciso. O Expo, mantido pela Expo, deve ser mantido sempre em versões LTS ou estáveis recentes para evitar breaking changes agressivos e garantir suporte ao ecossistema React Native.

No backend, Bun deve ser utilizado como runtime principal pela performance superior em I/O e inicialização rápida, porém estruturado com separação clara entre camadas de domínio, aplicação, infraestrutura e interface HTTP, preferencialmente seguindo princípios de Clean Architecture ou Hexagonal Architecture para facilitar manutenção futura e troca de tecnologias. A API deve ser construída com validação forte de dados usando bibliotecas modernas de schema validation com tipagem inferida, como Zod ou TypeBox, evitando inconsistências entre runtime e TypeScript. Para ODM, o ideal é utilizar Mongoose apenas se houver necessidade forte de schemas ricos e middleware, mas em arquiteturas modernas de alta escala pode ser melhor usar o driver oficial do MongoDB com validação externa, reduzindo overhead e aumentando previsibilidade de performance.

A camada de segurança deve incluir autenticação baseada em JWT com refresh token rotacionado, armazenamento seguro de credenciais com hashing forte usando Argon2 ou bcrypt com salt adequado, rate limiting por IP e usuário, proteção contra NoSQL Injection com sanitização rigorosa e uso obrigatório de HTTPS com HSTS. O backend deve ser preparado desde o início para escalar horizontalmente com containers e orquestração, preferencialmente com Docker e Kubernetes ou serviços gerenciados equivalentes, e com cache distribuído utilizando Redis para sessões, flags e consultas frequentes.

No mobile, o armazenamento local deve usar MMKV por performance e criptografia opcional, evitando AsyncStorage para dados críticos. O gerenciamento de estado deve priorizar soluções previsíveis e escaláveis como Zustand ou Redux Toolkit, evitando bibliotecas experimentais. Para requisições de rede, deve-se usar uma camada de API desacoplada com React Query ou TanStack Query para cache inteligente, retry automático e sincronização offline. A navegação deve usar React Navigation estável e amplamente suportado, evitando forks ou libs experimentais.

A qualidade do código deve ser garantida com ESLint configurado com regras estritas, Prettier para padronização visual e TypeScript em modo strict completo. Testes no backend devem usar o runner nativo do Bun combinado com testes de integração usando banco MongoDB em ambiente isolado. No mobile, testes unitários devem usar Jest e testes de interface devem usar React Native Testing Library, mantendo cobertura mínima aceitável desde o início para evitar dívida técnica.

Para observabilidade e operação, o sistema deve incluir logging estruturado com correlação de request, métricas de performance, monitoramento de erros e tracing distribuído, usando stacks modernas como OpenTelemetry. O deploy deve ser automatizado com CI/CD validando lint, testes e build antes de qualquer publicação. Variáveis sensíveis devem ser armazenadas apenas em gerenciadores de segredo, nunca em código ou repositório.

Para longevidade, o critério principal deve ser sempre priorizar ferramentas com comunidade ativa, releases frequentes, roadmap público e adoção corporativa real, evitando bibliotecas mantidas por uma única pessoa ou sem atualização há mais de um ano. O projeto deve ser versionado com versionamento semântico e ter contratos de API estáveis para evitar que atualizações quebrem versões antigas do app.

Mobile
- React Native + Expo SDK estável mantido pela Expo
- TypeScript strict mode
- React Navigation (navegação)
- TanStack Query (cache server state, retry, sync offline)
- Zustand (estado global leve e escalável)
- MMKV (storage local criptografável e ultra rápido)
- React Native Maps usando APIs oficiais da Google

Backend
- Bun runtime (HTTP server + tasks + scripts)
- TypeScript strict
- Zod (validação + inferência de tipos)
- Driver oficial da MongoDB (evita overhead do ODM, melhor para escala)
- JWT Access Token + Refresh Token rotativo
- Argon2 para hashing de senha

Banco e Infra de Dados
- MongoDB Atlas (cluster gerenciado com replicação automática)
- Redis (cache distribuído, rate limit, sessões, flags calculadas)

Qualidade de Código
- ESLint (config strict moderna)
- Prettier
- Husky + lint-staged

Testes
- Backend: Bun Test Runner + testes de integração com Mongo isolado
- Mobile: Jest + React Native Testing Library
- E2E: Detox

Infraestrutura e Deploy
- Containers com Docker
- Orquestração com Kubernetes gerenciado (EKS, GKE ou similar)
- CI/CD com GitHub Actions

Observabilidade
- OpenTelemetry (tracing distribuído)
- Logs estruturados (request id, user id, latency)
- Monitoramento de erros com Sentry

Segurança
- HTTPS obrigatório + HSTS
- Secrets em Secret Manager (cloud provider)
- Rate limiting via Redis
- Sanitização contra NoSQL Injection
- Headers de segurança (helmet ou equivalente Bun)

Arquitetura de Código
- Clean Architecture (Domain / Application / Infra / Interface)
- Monorepo (apps/mobile + apps/api + packages/shared-types)
- Versionamento Semântico

Critérios Técnicos Aplicados
- Comunidade ativa
- Releases frequentes
- Adoção corporativa
- Suporte a longo prazo
- Compatível com escala horizontal

## Padrões de arquitetura

Crie e mantenha o projeto HelpRest utilizando uma arquitetura moderna, escalável e de fácil manutenção a longo prazo, garantindo que qualquer desenvolvedor experiente consiga compreender rapidamente a organização do código, as responsabilidades de cada camada e as decisões técnicas adotadas. Todo o sistema deve ser escrito integralmente em inglês, utilizando nomenclaturas, convenções e jargões padrão da indústria de desenvolvimento de software, incluindo nomes de variáveis, funções, classes, commits, documentação e mensagens internas do sistema, garantindo padronização internacional e facilitando colaboração global. O projeto deve ser desenvolvido utilizando TypeScript como linguagem base, mantendo tipagem estrita, consistência estrutural e previsibilidade de comportamento em tempo de desenvolvimento e execução. O backend deve ser desenvolvido sobre runtime Bun, com persistência de dados utilizando o ecossistema da MongoDB, enquanto o aplicativo mobile deve ser construído em React Native utilizando Expo, mantido pela Expo, sempre priorizando versões estáveis e suportadas.

No backend, a arquitetura deve seguir Domain Driven Design como base organizacional, separando claramente domínio, aplicação, infraestrutura e interface externa. As regras de negócio devem existir exclusivamente dentro da camada de domínio, sendo completamente independentes de frameworks, banco de dados, bibliotecas externas ou protocolos de comunicação. O código deve seguir rigorosamente os princípios SOLID, garantindo baixo acoplamento, alta coesão e facilidade de extensão sem necessidade de modificação de código existente. Deve ser obrigatório o uso consciente de padrões clássicos de design quando fizerem sentido, como Factory para criação de entidades complexas, Repository para abstração de persistência, Use Cases ou Services para orquestração de regras de negócio e Strategy para variações de comportamento como algoritmos de recomendação ou filtragem.

O backend deve fazer uso consistente de programação orientada a objetos para modelagem de domínio, principalmente em entidades, agregados, value objects e serviços de domínio, utilizando encapsulamento, imutabilidade quando possível e validações internas. Entretanto, a arquitetura não deve se limitar exclusivamente ao paradigma orientado a objetos, permitindo o uso de programação funcional para operações pequenas, puras ou utilitárias, como validações simples, transformações de dados, pipelines de processamento ou composição de middlewares. O código deve sempre priorizar legibilidade, previsibilidade e testabilidade, evitando abstrações desnecessárias ou complexidade acidental.

A arquitetura deve seguir os princípios de Clean Architecture, garantindo que dependências sempre apontem para o domínio e nunca o contrário. Frameworks devem ser tratados apenas como detalhes de implementação. A comunicação entre camadas deve ocorrer por meio de contratos bem definidos, preferencialmente utilizando interfaces e DTOs explicitamente tipados. O projeto deve ser estruturado para facilitar testes unitários, testes de integração e evolução futura da infraestrutura sem necessidade de refatorações extensas.

No frontend mobile, o projeto deve seguir os padrões modernos do ecossistema React, priorizando programação funcional, imutabilidade de estado e composição de funções. A organização da interface deve seguir Design Atômico, separando componentes em níveis claros como átomos, moléculas, organismos e templates, facilitando reutilização e consistência visual. O frontend deve utilizar padrões consolidados do ecossistema, como custom hooks para isolamento de lógica reutilizável, composed components para flexibilidade estrutural, separation of concerns entre UI e lógica de negócio e container patterns quando necessário para desacoplar renderização de comportamento.

O gerenciamento de estado deve priorizar previsibilidade e simplicidade, evitando complexidade desnecessária e garantindo facilidade de manutenção futura. O acesso a APIs deve ser centralizado em camadas próprias, evitando chamadas diretas dentro de componentes visuais. O armazenamento local deve ser tratado como infraestrutura e nunca misturado com lógica de domínio da aplicação mobile. O frontend deve seguir estritamente as boas práticas do ambiente Expo e do ecossistema React Native, respeitando ciclos de atualização, APIs oficiais e padrões recomendados pela comunidade ativa.

Todo o sistema deve possuir uma arquitetura robusta de internacionalização e regionalização de conteúdo, utilizando padrões modernos de i18n e l10n. Todo texto exibido ao usuário deve ser externalizado para arquivos de tradução, nunca sendo hardcoded dentro do código. O sistema deve suportar múltiplos idiomas desde a base, incluindo fallback automático para idioma padrão quando traduções não estiverem disponíveis. Deve ser implementado suporte a pluralização, formatação regional de datas, horários, moedas, números e unidades de medida. O sistema deve permitir carregamento dinâmico de idiomas para reduzir bundle size e melhorar performance. Deve ser considerado suporte a escrita da direita para esquerda quando necessário. A arquitetura deve permitir expansão futura para novos idiomas sem necessidade de refatoração estrutural.

O projeto como um todo deve priorizar Clean Code, com nomes claros, funções pequenas, responsabilidades únicas, ausência de efeitos colaterais inesperados e documentação mínima porém suficiente para entendimento arquitetural. Todo código deve ser escrito pensando em longevidade, escalabilidade horizontal, facilidade de onboarding de novos desenvolvedores e facilidade de auditoria de segurança. Deve ser evitado qualquer padrão ou biblioteca que comprometa previsibilidade, testabilidade ou manutenção futura.

A estrutura final deve resultar em um sistema modular, testável, extensível e resiliente a mudanças tecnológicas, permitindo crescimento do produto sem necessidade de reescritas estruturais frequentes, mantendo consistência arquitetural entre backend e frontend, respeitando as particularidades de cada paradigma e ambiente de execução. Se novas tecnologias forem introduzidas futuramente, elas devem ser encaixadas respeitando os limites arquiteturais existentes, sem violar princípios de domínio, desacoplamento ou organização estrutural.

## Caminhos de documentação

Atualizações pertinentes ao sistema devem ser documentadas nos seguintes arquivos, tome cuidado ao atualizar conteúdo já escrito, prefira adicionar ao invés de substituir, a não ser que seja explicitamente necessário:

- [Arquitetura do Sistema](./base.system.md)
- [Excalidraw base do Sistema](./base.system.excalidraw.png)
- [Backend](./backend.md)
- [Frontend](./frontend.md)