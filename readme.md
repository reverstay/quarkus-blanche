# Blanche – Plataforma de Gestão de Lavanderias

Monorepo com:

- **Back-end** em Quarkus (Kotlin, Hibernate Panache, JWT, Mail, etc.)
- **Front-end** em React + TypeScript (Vite)
- **Infra** com Docker Compose e Nginx (produção)

---

## 1. Como rodar o projeto localmente

### 1.1. Pré-requisitos

- Docker + Docker Compose instalados  
- Acesso a um banco **PostgreSQL** (local ou remoto)  
- Arquivo `.env` configurado na **raiz** do projeto  

---
### 1.2. Rodar tudo com Docker (modo desenvolvimento)

Se você tiver um `docker-compose.dev.yml` expondo as portas `8080` e `5173`, rode:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Então:

- **Front-end**: <http://localhost:5173>  
- **Back-end (Swagger)**: <http://localhost:8080/q/swagger-ui>  

Se estiver usando apenas o `docker-compose.yaml` atual, certifique-se de que os serviços `quarkus` e `frontend` tenham `ports` mapeando `8080:8080` e `5173:5173` para conseguir acessar via navegador.

---

### 1.3. Rodar sem Docker (opcional)

#### Back-end (Quarkus)

```bash
cd back-end
./mvnw quarkus:dev
# ou
mvn quarkus:dev
```

O Quarkus sobe (por padrão) em:  
<http://localhost:8080>

#### Front-end (React + Vite)

```bash
cd front-end
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Acesse:  
<http://localhost:5173>

---

## 2. Visão geral do projeto

A **Blanche** é uma plataforma para gestão de lavanderias, permitindo:

- Cadastro e gestão de **empresas**, **unidades**, **usuários** e **funcionários**
- Fluxo de **autenticação** com JWT
- Integração com **Supabase** (auth / dados auxiliares)
- API REST em **Quarkus** consumida pelo **front-end React**

Arquitetura simplificada:

```text
[ Navegador ]
      │
      ▼
[ Front-end (React/Vite) ]
      │  HTTP/JSON
      ▼
[ Back-end (Quarkus/Kotlin) ]
      │  JDBC
      ▼
[ PostgreSQL ]
```

Em produção, há ainda:

```text
[Nginx] ─► roteia requisições HTTPS para
  ├─ Front-end (build estático)
  └─ Back-end Quarkus
```

---

## 3. Estrutura de pastas

Resumo baseado na estrutura atual:

```text
.
├── .env                      # Variáveis de ambiente (lidas por back e front)
├── docker-compose.yaml       # Compose principal (prod / infra)
├── docker-compose.dev.yml    # (Sugerido) Compose para desenvolvimento
├── back-end                  # Projeto Quarkus (Kotlin)
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main
│       ├── kotlin/org/neuverse
│       │   ├── dto          # DTOs (EmpresaDTO, UsuarioDTO, etc.)
│       │   ├── entity       # Entidades JPA (Empresa, Unidade, Usuario)
│       │   ├── enums        # Enums (Role, etc.)
│       │   ├── repository   # Repositórios Panache
│       │   ├── resource     # Resources REST (AuthResource, EmpresaResource…)
│       │   └── service      # Serviços (JwtService, PasswordService…)
│       └── resources
│           └── application.properties
│
├── front-end                 # Projeto React + Vite
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.mts
│   └── src
│       ├── api              # http.ts, authService.ts
│       ├── components       # Card, CardGrid, NavBar, etc.
│       ├── hooks            # useRole, useSettings, useUserLojas, etc.
│       ├── pages            # Login, Admin, Empresas, Unidades, Pedidos, etc.
│       ├── types            # Tipagens (auth, empresa…)
│       └── utils            # dbInit, role helpers, etc.
│
└── nginx
    └── blanche.conf         # Configuração Nginx (produção)
```

---

## 4. Serviços Docker

### 4.1. `quarkus`

- Contexto: `./back-end`  
- Porta interna: `8080`  
- Usa variáveis do `.env` (`DB_*`, `MAIL_*`, `JWT_SECRET`, etc.)  
- Exponibiliza API REST e Swagger em `/q/swagger-ui`  

### 4.2. `frontend`

- Contexto: `./front-end`  
- Porta interna: `5173` (dev) / build estático em produção  
- Lê `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE`, etc.  
- Usa Vite para HMR em desenvolvimento  

### 4.3. `nginx` (produção)

- Proxy reverso para front-end e back-end  
- Publica portas `80` e `443`  
- Usa `nginx/blanche.conf` e volumes com certificados do **Certbot**  

### 4.4. `certbot` (produção)

- Responsável por obter/renovar certificados TLS  
- Compartilha volume com Nginx (`/etc/letsencrypt` e `/var/www/certbot`)  

---

## 5. Endpoints úteis

- **Swagger UI (API docs)**  
  - Dev: <http://localhost:8080/q/swagger-ui>  
  - Prod: `https://seu-dominio/q/swagger-ui`  

- **Front-end**  
  - Dev: <http://localhost:5173>  
  - Prod: `https://seu-dominio`  

---

## 6. Tecnologias principais

### Back-end

- Quarkus 3.x (JVM)  
- Kotlin  
- Hibernate ORM + Panache (Kotlin)  
- PostgreSQL + Agroal  
- SmallRye JWT  
- Mailer (Office365 / SMTP)  
- Swagger / OpenAPI  

### Front-end

- React + TypeScript  
- Vite  
- Supabase  
- CSS modularizado (`App.css`, `Admin.css`, etc.)  

### Infra

- Docker / Docker Compose  
- Nginx  
- Certbot  

---

## 7. Próximos passos / ideias

- Separar oficialmente `docker-compose.yaml` (produção) e `docker-compose.dev.yml` (dev)  
- Adicionar READMEs específicos para back-end e front-end, se necessário  
- Automatizar migrações de banco (Flyway ou Liquibase)  
- Adicionar testes de integração (Quarkus Test / Playwright para o front)  
