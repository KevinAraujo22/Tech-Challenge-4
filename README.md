# Desenvolvimento de Plataforma de Divulgação Acadêmica: Blog da Escola — Fase 4

## Grupo

- Davi Baestero Silva - RM: 371248
- Kevin da Silva Araujo - RM: 372533
- Lucas Henrique Klein Esteves - RM: 374025
- Lucas Dias Morosini - RM: 372641

---

## 1. Resumo

Aplicativo mobile da plataforma de blog acadêmico construída nas fases anteriores. O app foi
desenvolvido em **React Native + TypeScript** com **Expo (SDK 58)** e **Expo Router**, consumindo
a API REST em **Node.js/Express + MongoDB** da Fase 3. Professores publicam, editam e excluem
posts e administram professores e alunos; alunos leem e comentam os posts.

Nesta fase o back-end recebeu **perfis de acesso** (professor e aluno) dentro do token **JWT**,
**CRUD paginado de professores e alunos**, **comentários** nos posts e um middleware que impede
alunos de alterar dados. A API e o banco sobem juntos via **Docker Compose**, já com dados de
demonstração.

---

## 2. Introdução

Na Fase 3, entregamos a interface web em React e o login de professores. Faltava uma experiência
mobile e o back-end ainda não conhecia alunos: qualquer pessoa podia se cadastrar como professor
e não havia como diferenciar quem pode criar conteúdo de quem só pode ler. A Fase 4 resolve isso:

1. Um **aplicativo React Native** com todas as páginas pedidas: lista e leitura de posts,
   criação/edição de posts, painel administrativo e páginas administrativas de professores e alunos.
2. **Perfis e permissões reais**: professores criam e alteram; alunos apenas visualizam e comentam.
   A regra é validada no app **e** na API.

Diferente da Fase 3, no app todo usuário entra com login. Alunos podem criar a própria conta pela
tela inicial; professores também, desde que informem o código de acesso da escola. Professores
ainda podem cadastrar outros professores e alunos pelas páginas administrativas.

---

## 3. Arquitetura da Aplicação

### Estrutura de Pastas

```
Tech Challenge 4/
├── mobile/                          # App React Native (Expo)
│   ├── src/
│   │   ├── app/                     # Rotas do Expo Router (cada arquivo é uma tela)
│   │   │   ├── _layout.tsx          # AuthProvider + Stack com rotas protegidas
│   │   │   ├── login.tsx            # Login único (professor e aluno)
│   │   │   ├── register.tsx         # Criar conta (aluno livre; professor com código)
│   │   │   ├── (tabs)/              # Abas exibidas após o login
│   │   │   │   ├── _layout.tsx      # Abas Admin/Professores/Alunos só para professores
│   │   │   │   ├── index.tsx        # Página principal: lista + busca de posts
│   │   │   │   ├── admin.tsx        # Página administrativa de posts
│   │   │   │   ├── teachers.tsx     # Listagem paginada de professores
│   │   │   │   ├── students.tsx     # Listagem paginada de alunos
│   │   │   │   └── account.tsx      # Perfil, permissões e sair
│   │   │   ├── posts/
│   │   │   │   ├── [id].tsx         # Leitura do post + comentários
│   │   │   │   ├── new.tsx          # Criação de post
│   │   │   │   └── edit/[id].tsx    # Edição de post
│   │   │   └── people/[kind]/       # kind = teachers | students
│   │   │       ├── new.tsx          # Cadastro de professor/aluno
│   │   │       └── [id].tsx         # Edição de professor/aluno
│   │   ├── components/              # Button, TextField, SearchBar, PostCard, PostForm,
│   │   │                            # PersonForm, PeopleList, Comments, FormScreen, Feedback
│   │   ├── context/AuthContext.tsx  # Sessão (usuário + token), login, logout e restauração
│   │   ├── hooks/                   # usePosts, useResource, useDebouncedValue
│   │   ├── services/
│   │   │   ├── api.ts               # Cliente HTTP tipado, injeta o Bearer token
│   │   │   └── storage.ts           # SecureStore (celular) / localStorage (web)
│   │   ├── constants/               # theme.ts (identidade visual), people.ts (prof. x aluno)
│   │   ├── utils/                   # confirm.ts (diálogo multiplataforma), format.ts
│   │   └── types.ts                 # Contratos: User, Post, Comment, Person, Page
│   ├── assets/                      # Ícones e splash
│   ├── app.json                     # Configuração do Expo
│   └── package.json
│
├── backend/                         # API da Fase 3 estendida (Node + Express + MongoDB)
│   ├── src/
│   │   ├── models/                  # Post, Comment, Professor, Student
│   │   ├── controllers/             # postController, authController, peopleController
│   │   ├── middleware/
│   │   │   └── auth.ts              # requireAuth (JWT) e requireTeacher (perfil professor)
│   │   ├── routes/                  # postRoutes, authRoutes, peopleRoutes
│   │   ├── seed.ts                  # Professor padrão + dados de demonstração
│   │   ├── db.ts                    # Conexão Mongo reutilizável
│   │   ├── app.ts                   # Express, CORS, rotas e erros em JSON
│   │   └── server.ts                # Boot do servidor (Docker / local)
│   ├── tests/                       # Jest + Supertest (auth, posts/comentários, pessoas)
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yml               # api (Node) + mongo, com seed de demonstração
```

### Fluxo de uma Requisição

```
Tela do app (React Native / Expo Router)
        |
   hook (useResource / usePosts) ou handler do formulário
        |
   src/services/api.ts   ← monta a URL, adiciona Content-Type e Authorization: Bearer <jwt>
        |
   fetch HTTP → http://<IP da máquina>:3001  (ou EXPO_PUBLIC_API_URL)
        |
   Express (backend/src/app.ts)
        |
   connectDb()   ← garante a conexão com o MongoDB
        |
   requireAuth   ← 401 se não houver token válido
   requireTeacher ← 403 se o usuário logado for aluno (rotas de escrita e administração)
        |
   Controller  →  Model (Mongoose)  →  MongoDB
        |
   Resposta JSON de volta para a tela
   (401 → AuthContext encerra a sessão e o app volta para o login)
```

### Navegação

```
  (sem sessão) → Login ──► Abas: Posts │ Admin* │ Professores* │ Alunos* │ Conta
                                  │        │          │             │
                     posts/[id] (leitura + comentários)    people/[kind]/new*
                     posts/new*   posts/edit/[id]*         people/[kind]/[id]*
                                                   * somente professores
```

### Stack

| Camada        | Tecnologias                                                              |
|---------------|-------------------------------------------------------------------------|
| Mobile        | React Native 0.88, Expo SDK 58, Expo Router, TypeScript, @expo/vector-icons |
| Estado global | Context API (`AuthContext`)                                              |
| Sessão        | expo-secure-store (Keychain / Keystore)                                   |
| Backend       | Node.js, Express 5, Mongoose 8, JWT, bcryptjs                            |
| Banco         | MongoDB 7                                                                |
| Infra         | Docker, Docker Compose                                                   |

---

## 4. Páginas da Interface e Integração com a API

| Página (requisito)                     | Rota                   | Acesso    | Endpoints consumidos                          |
|----------------------------------------|------------------------|-----------|-----------------------------------------------|
| Login (10)                             | `/login`               | Público   | `POST /auth/login`, `GET /auth/me`            |
| Criar conta                            | `/register`            | Público   | `POST /auth/register`                         |
| Lista de posts + busca (1)             | `/` (aba Posts)        | Logado    | `GET /posts`, `GET /posts/search?q=`          |
| Leitura de post + comentários (2)      | `/posts/:id`           | Logado    | `GET /posts/:id`, `GET/POST/DELETE /posts/:id/comments` |
| Criação de postagem (3)                | `/posts/new`           | Professor | `POST /posts`                                 |
| Edição de postagem (4)                 | `/posts/edit/:id`      | Professor | `GET /posts/:id`, `PUT /posts/:id`            |
| Página administrativa (9)              | `/admin` (aba Admin)   | Professor | `GET /posts`, `DELETE /posts/:id`             |
| Listagem de professores (7)            | `/teachers`            | Professor | `GET /teachers?page=`, `DELETE /teachers/:id` (admin) |
| Cadastro de professor (5)              | `/people/teachers/new` | Admin     | `POST /teachers`                              |
| Edição de professor (6)                | `/people/teachers/:id` | Admin ou a própria conta | `GET /teachers/:id`, `PUT /teachers/:id` |
| Listagem / cadastro / edição de alunos (8) | `/students`, `/people/students/...` | Professor | `/students` (mesmo contrato) |
| Minha conta                            | `/account`             | Logado    | —                                             |

### Endpoints da API

| Método   | Rota                               | Autenticação        | Descrição                                          |
|----------|------------------------------------|---------------------|----------------------------------------------------|
| `POST`   | `/auth/register`                   | —                   | Cria conta de aluno (ou de professor com `accessCode`) e já devolve `{ token, user }` |
| `POST`   | `/auth/login`                      | —                   | Login de professor ou aluno, devolve `{ token, user }` |
| `GET`    | `/auth/me`                         | Bearer JWT          | Retorna o usuário autenticado                      |
| `GET`    | `/posts`                           | —                   | Lista os posts, do mais recente ao mais antigo     |
| `GET`    | `/posts/search?q=`                 | —                   | Busca no título, conteúdo e autor                  |
| `GET`    | `/posts/:id`                       | —                   | Retorna um post pelo ID                            |
| `POST`   | `/posts`                           | Professor           | Cria um post (título, conteúdo e autor)            |
| `PUT`    | `/posts/:id`                       | Professor           | Atualiza um post                                   |
| `DELETE` | `/posts/:id`                       | Professor           | Remove o post e seus comentários                   |
| `GET`    | `/posts/:id/comments`              | —                   | Lista os comentários do post                       |
| `POST`   | `/posts/:id/comments`              | Bearer JWT          | Comenta (professor ou aluno)                       |
| `DELETE` | `/posts/:id/comments/:commentId`   | Autor ou professor  | Remove um comentário                               |
| `GET`    | `/teachers?page=&limit=&q=`        | Professor           | Lista paginada: `{ items, page, limit, total, totalPages }` |
| `GET`    | `/teachers/:id`                    | Professor           | Retorna um professor                               |
| `POST`   | `/teachers`                        | Admin               | Cadastra (`name`, `email`, `password`, `subject`, `isAdmin`) |
| `PUT`    | `/teachers/:id`                    | Admin ou a própria conta | Atualiza (senha opcional; só o admin altera `isAdmin` de outro professor) |
| `DELETE` | `/teachers/:id`                    | Admin               | Remove (não permite excluir a própria conta)       |
| `GET/POST/PUT/DELETE` | `/students...`        | Professor           | Mesmo contrato, com `className` (turma) no lugar de `subject` |

---

## 5. Autenticação e Autorização

- **Login (`POST /auth/login`):** busca o e-mail primeiro entre os professores e depois entre os
  alunos. Senha conferida com **bcrypt**; e-mail ou senha errados retornam `401`. Em caso de
  sucesso é emitido um **JWT** (7 dias) contendo `id`, `name`, `email` e `role` (`teacher` ou
  `student`).
- **Cadastro pela tela de login (`POST /auth/register`):** qualquer pessoa cria uma conta de
  **aluno**. Para criar conta de **professor** é preciso informar o código de acesso da escola,
  definido na variável `TEACHER_SIGNUP_CODE` da API (`403` se o código estiver errado; sem a
  variável, o cadastro de professores pela tela fica desativado). Assim um aluno não consegue se
  "promover" a professor. Após o cadastro o usuário já entra logado.
- **Cadastro pelos professores:** qualquer professor cadastra, edita e exclui alunos
  (`/students`). Já os professores são gerenciados pelo **professor administrador**: só ele
  cria, edita e exclui outros professores e pode tornar outro professor administrador. Um
  professor comum vê a lista de professores e edita apenas a própria conta.
- **Professor administrador:** campo `isAdmin` no professor. O professor padrão criado na
  subida já é administrador; em bancos antigos, o professor mais antigo é promovido
  automaticamente. A API confere esse campo **no banco** a cada requisição (`requireAdmin` e
  `requireAdminOrSelf`), então promover ou rebaixar alguém vale na hora, sem depender do token.
- **Regras comuns:** senhas com no mínimo 6 caracteres, gravadas apenas como hash; o e-mail é
  único entre professores **e** alunos (`409` se repetido).
- **Primeiro acesso:** se o banco não tiver nenhum professor, a API cria um professor padrão ao
  subir (`DEFAULT_TEACHER_EMAIL` / `DEFAULT_TEACHER_PASSWORD`).
- **App:** o `AuthContext` guarda token e usuário no **SecureStore** (armazenamento seguro do
  sistema; `localStorage` na versão web), restaura a sessão ao abrir o app e confirma o token com
  `GET /auth/me`. `src/services/api.ts` injeta `Authorization: Bearer <jwt>` em toda requisição e
  um `401` encerra a sessão automaticamente.
- **Proteção de rotas no app:** o layout usa `Stack.Protected` e `Tabs.Protected` do Expo Router.
  Sem sessão, só a tela de login existe; para alunos, as abas Admin, Professores e Alunos e as
  telas de criação/edição não existem. Abrir uma dessas rotas redireciona para a página principal.
- **Proteção na API:** `requireAuth` bloqueia quem não está logado (`401`) e `requireTeacher`
  bloqueia alunos (`403`) em `POST/PUT/DELETE /posts` e em todo `/teachers` e `/students`.
  `requireAdmin` bloqueia professores comuns (`403`) ao criar, editar outro ou excluir
  professores. A proteção não depende apenas da interface.

---

## 6. Metodologia e Desenvolvimento Técnico

- **Componentes funcionais e hooks:** toda a UI usa componentes funcionais com `useState`,
  `useEffect`, `useContext`, `useCallback` e hooks próprios (`useResource`, `usePosts`,
  `useDebouncedValue`). Não há classes.
- **Expo Router (rotas por arquivo):** cada arquivo em `src/app/` é uma tela; `_layout.tsx` define
  o Stack e as abas. Parâmetros como `:id` e `:kind` vêm de `useLocalSearchParams`.
- **Cliente de API tipado (`api.ts`):** um único `request<T>()` centraliza URL, cabeçalhos, token
  e tratamento de erro. `authApi`, `postsApi` e `peopleApi(kind)` são mapeamentos finos sobre ele.
- **Estado global mínimo:** só a sessão é global (Context API). Lista, formulário, carregamento e
  erro ficam locais em cada tela. Listas recarregam com `useFocusEffect` ao voltar de uma edição.
- **Professores e alunos com o mesmo código:** o requisito 8 pede para replicar as páginas de
  professores para alunos. As telas `PeopleList`, `PersonForm` e as rotas `people/[kind]` recebem
  o tipo e leem rótulos e o campo extra (disciplina ou turma) de `constants/people.ts`. No back-end,
  `makePeopleController` gera o CRUD dos dois a partir do modelo.
- **URL da API automática:** em desenvolvimento o app usa o IP da máquina que roda o Expo
  (`Constants.expoConfig.hostUri`) na porta 3001, então funciona no Expo Go de um celular na mesma
  rede sem configuração. `EXPO_PUBLIC_API_URL` sobrescreve para uma API hospedada.
- **Estilização:** `StyleSheet` com tokens em `constants/theme.ts`, reaproveitando a identidade
  visual da Fase 3 (papel `#f5f3ed`, verde `#31544d`, coral `#d8684c`, títulos em serifa). Telas
  com área segura, teclado tratado nos formulários e largura máxima em tablets/web.
- **Acessibilidade:** botões e campos com `accessibilityRole`/`accessibilityLabel`, erros com
  `accessibilityRole="alert"` e áreas de toque de no mínimo 36–48 px.
- **Backend reaproveitado:** a API da Fase 3 foi copiada para `backend/` e estendida com os modelos
  `Student` e `Comment`, o `peopleController`, o middleware `requireTeacher` e o seed.
- **Containerização:** `docker-compose.yml` sobe `api` e `mongo` na mesma rede, com a API exposta
  na porta 3001 e dados de demonstração.

---

## 7. Como Executar o Projeto

Pré-requisitos: **Node.js 22.13+** (exigido pelo Expo SDK 58) e **Docker** em execução. Para
testar no celular, instale o app **Expo Go** e conecte o aparelho na mesma rede Wi-Fi do computador.

### Opção A — API com Docker + app no Expo

```bash
# 1. API + MongoDB
docker compose up -d --build

# 2. App (em outro terminal)
cd mobile
npm install
npx expo start
```

- API: `http://localhost:3001` (ex.: `curl http://localhost:3001/health`)
- App: escaneie o QR code com o Expo Go (Android) ou com a câmera (iOS). Também é possível abrir
  no emulador Android (tecla `a`) ou no navegador (tecla `w`).
- O endereço da API usado pelo app aparece no rodapé da tela de login. Se o celular não conectar,
  libere a porta 3001 no firewall do computador.

Para encerrar:

```bash
docker compose down
```

### Opção B — Desenvolvimento local (sem Docker)

Pré-requisito adicional: um MongoDB acessível.

```bash
# 1. Backend
cd backend
cp .env.example .env      # ajuste MONGODB_URI e JWT_SECRET se necessário
npm install
npm run seed              # opcional: professor, aluno e posts de demonstração
npm run dev               # API em http://localhost:3001

# 2. App (em outro terminal)
cd mobile
npm install
npx expo start
```

Para usar uma API hospedada em outro endereço, crie `mobile/.env.local` com
`EXPO_PUBLIC_API_URL=https://sua-api.example.com` e reinicie o Expo.

### Primeiro acesso

O Docker Compose já cria os usuários de demonstração:

| Perfil    | E-mail                 | Senha          |
|-----------|------------------------|----------------|
| Professor | `professor@escola.com` | `professor123` |
| Aluno     | `aluno@escola.com`     | `aluno123`     |

Também é possível criar uma conta nova em **Criar conta**, na tela de login. Para o perfil
professor, o código de acesso configurado no `docker-compose.yml` é `professor2026`
(variável `TEACHER_SIGNUP_CODE`). Troque essas senhas e o código antes de publicar a API.

### Gerando o APK (Android)

O `mobile/eas.json` tem o perfil `preview`, que gera um APK instalável pelo EAS Build (nuvem da
Expo, conta gratuita):

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

O endereço da API fica gravado no APK pela variável `EXPO_PUBLIC_API_URL` do perfil (ajuste para
o IP do computador que roda a API ou para uma API hospedada). O app libera HTTP sem TLS
(`usesCleartextTraffic`) para funcionar com a API local; em produção use HTTPS.

### Guia de Uso

**Professor**

1. Entre com o e-mail e a senha de professor.
2. **Posts:** veja todos os posts, busque por palavra-chave e toque em um card para ler. O botão
   **Nova postagem** abre o formulário, com o autor já preenchido.
3. **Admin:** lista de todas as postagens com **Editar** (formulário com os dados atuais) e
   **Excluir** (pede confirmação e apaga também os comentários).
4. **Alunos:** listagem paginada com busca por nome ou e-mail. Cada linha tem **Editar** e
   **Excluir**; **Novo aluno** abre o cadastro. Na edição, deixe a senha em branco para manter a
   atual.
5. **Professores:** mesma listagem. O **administrador** (etiqueta "Administrador") vê
   **Novo professor**, **Editar** e **Excluir** em todos e, na edição, pode marcar outro professor
   como administrador. Um professor comum vê a lista e só tem **Editar** na própria conta.
6. Na leitura de um post é possível comentar e excluir qualquer comentário.
7. **Conta:** perfil, permissões e **Sair**.

**Aluno**

1. Entre com o e-mail e a senha cadastrados por um professor, ou crie a sua conta em
   **Criar conta** escolhendo o perfil **Aluno**.
2. Aparecem apenas as abas **Posts** e **Conta**: o aluno lê, busca e comenta posts e pode apagar
   os próprios comentários.

---

## 8. Testes e Validação

### Mobile

```bash
cd mobile
npx tsc --noEmit     # checagem de tipos
npx eslint src       # lint (eslint-config-expo, inclui as regras de hooks)
```

Os fluxos de professor e de aluno foram validados manualmente contra a API rodando no Docker.

### Backend

```bash
cd backend
npm test          # Jest + Supertest (requer MongoDB em localhost:27017)
```

Cenários cobertos no backend (55 testes):

| Cenário                                                      | Resultado esperado |
|-------------------------------------------------------------|--------------------|
| Login de professor / aluno com credenciais do banco          | 200 + token + role |
| Login com e-mail inexistente ou senha errada                 | 401                |
| Criar conta de aluno pela tela                               | 201 + token        |
| Criar conta de professor sem código / com código errado      | 403                |
| Criar conta de professor com o código da escola              | 201 + token        |
| Criar/editar/excluir post como professor                     | 201 / 200 / 204    |
| Criar/editar/excluir post **sem token**                      | 401                |
| Criar/editar/excluir post **como aluno**                     | 403                |
| Listar, ler e buscar posts (título, autor, caracteres especiais) | 200            |
| Comentar como aluno / comentar sem login / comentário vazio  | 201 / 401 / 400    |
| Aluno excluindo comentário de outra pessoa                   | 403                |
| Excluir post apaga os comentários                            | 204                |
| Cadastrar professor/aluno (hash da senha nunca retornado)    | 201                |
| Cadastro com dados inválidos / e-mail já usado               | 400 / 409          |
| Listagem paginada e busca de professores/alunos              | 200                |
| Editar mantendo a senha / excluir                            | 200 / 204          |
| Acessar `/teachers` ou `/students` como aluno / sem login    | 403 / 401          |
| Professor excluindo a própria conta                          | 400                |
| Professor comum criando, editando outro ou excluindo professor | 403              |
| Professor comum editando a própria conta / se promovendo     | 200 / 403          |
| Admin promove professor (vale sem trocar o token)            | 200                |

---

## 9. Dificuldades Encontradas e Soluções

- **Back-end sem alunos nem perfis:** a API da Fase 3 só conhecia professores e liberava o
  cadastro público. Criamos o modelo `Student`, colocamos o `role` dentro do JWT e separamos dois
  middlewares: `requireAuth` (401, não logado) e `requireTeacher` (403, logado sem permissão).
- **Cadastro público sem abrir brecha de permissão:** na Fase 3 qualquer pessoa podia se
  cadastrar como professor. Agora o cadastro pela tela cria alunos livremente e só cria
  professores com o código de acesso da escola (`TEACHER_SIGNUP_CODE`). Para o banco vazio, a API
  cria um professor padrão na subida (configurável por variáveis de ambiente), e o script
  `npm run seed` gera dados de demonstração.
- **Professor editando a conta de outros professores:** nos testes com o app percebemos que
  qualquer professor podia editar ou excluir outro professor, inclusive pela API. Criamos o
  perfil de professor administrador e as regras `requireAdmin`/`requireAdminOrSelf`, que
  consultam o banco a cada requisição. No app, os botões aparecem conforme o perfil, mas a
  proteção real é a da API.
- **E-mail único em duas coleções:** professores e alunos ficam em coleções diferentes, mas o
  e-mail é o login dos dois. O índice `unique` do MongoDB não cobre isso, então a função
  `emailInUse` consulta as duas coleções antes de criar ou editar.
- **Replicar páginas sem duplicar código:** em vez de copiar as telas de professores para alunos,
  generalizamos com o parâmetro `kind` (rotas `people/[kind]`) e uma fábrica de controllers no
  back-end. A suíte de testes de pessoas também roda uma vez para cada tipo.
- **Celular não acessa `localhost`:** no Expo Go, `localhost` é o próprio telefone. Passamos a ler
  o IP do servidor do Expo para montar a URL da API automaticamente e exibimos esse endereço na tela
  de login, o que facilitou depurar problemas de rede e firewall.
- **Confirmação de exclusão multiplataforma:** `Alert.alert` com botões não funciona na versão
  web; criamos `confirmAction`, que usa `Alert` no celular e `window.confirm` na web e devolve uma
  `Promise<boolean>` nos dois casos.
- **Mudanças do Expo SDK 58:** o componente de abas mudou de pacote (`expo-router/js-tabs`), o
  projeto vem com React Compiler e as novas regras de lint de hooks não aceitam `setState` direto
  dentro de `useEffect`. Criamos o hook `useResource`, que só atualiza o estado quando a requisição
  responde e ignora respostas que chegam depois que o usuário saiu da tela.
- **Teclado cobrindo os campos no Android:** a partir do Android 15 os apps rodam em modo
  edge-to-edge e a janela não encolhe mais quando o teclado abre, então o campo em que se digitava
  ficava escondido. A solução foi usar `KeyboardAvoidingView` com `behavior="padding"` nas duas
  plataformas, descontando a altura do cabeçalho (`HeaderHeightContext`), e colocar o botão
  "Enviar" ao lado do campo de comentário para os dois ficarem visíveis juntos. A biblioteca
  `react-native-keyboard-controller` foi descartada porque não roda no Expo Go.
- **Gerar o APK no Windows:** a compilação C++ do React Native gera caminhos com mais de 260
  caracteres, que o Windows recusa. O APK foi compilado dentro de um container Linux (Docker) e o
  projeto ganhou o perfil `preview` do EAS Build como alternativa na nuvem.
- **Testes interferindo entre si:** com mais suítes usando o mesmo banco, o Jest rodando arquivos
  em paralelo fazia um teste apagar os dados de outro; passamos a usar `--runInBand`.

---

## 10. Vídeo de Demonstração do Projeto

_https://www.youtube.com/watch?v=w5DD-Tf9BmM_
