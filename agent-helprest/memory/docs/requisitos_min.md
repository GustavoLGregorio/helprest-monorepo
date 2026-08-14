# Requisitos Mínimos (MVP) - HelpRest

Este documento sumariza os requisitos funcionais e não-funcionais essenciais para a primeira versão (Minimum Viable Product - MVP) do sistema HelpRest.

## Requisitos Funcionais (Max 6)

1. **RF01 - Autenticação Básica:** O usuário deve poder se cadastrar e fazer login usando e-mail/senha ou Google OAuth.
2. **RF02 - Perfil com Restrições:** O usuário deve poder configurar seu perfil indicando suas restrições alimentares (flags).
3. **RF03 - Mapa de Estabelecimentos:** O sistema deve exibir um mapa iterável com pontos (pins) de restaurantes próximos que atendam às flags do usuário.
4. **RF04 - Perfil do Estabelecimento:** O usuário deve poder visualizar a página do restaurante, contendo informações básicas (horário, localização) e seu cardápio adaptado.
5. **RF05 - Feed Social Básico:** O estabelecimento deve poder publicar avisos simples ou postagens que aparecerão no feed dos usuários daquele raio de localização.
6. **RF06 - Gestão de Cardápio (Est. Admin):** O administrador do estabelecimento deve poder cadastrar e editar itens do cardápio e associá-los às flags de restrição.

## Requisitos Não-Funcionais (Max 6)

1. **RNF01 - Usabilidade Mobile-First:** A interface deve ser nativa e fluida para dispositivos móveis (React Native/Expo).
2. **RNF02 - Desempenho do Mapa:** A renderização dos pontos no mapa deve ocorrer sem travamentos, com clusterização para alta densidade.
3. **RNF03 - Segurança de Senhas:** O armazenamento de senhas deve utilizar algoritmos fortes de hash (Argon2id).
4. **RNF04 - Proteção de API:** Todos os endpoints devem validar tokens JWT e possuir rate limiting básico contra abusos.
5. **RNF05 - Escalabilidade do Banco:** A estrutura no MongoDB deve suportar buscas geoespaciais e query por arrays de flags de forma rápida.
6. **RNF06 - Disponibilidade:** O backend (Bun) deve ser configurado para reinicialização automática em caso de falhas, visando alto uptime.
