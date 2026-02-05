# Intelligent Scheduling SaaS (Multi-Tenant)

Sistema de **agendamento inteligente** multi-tenant desenvolvido com foco em
salões de beleza e prestadores de serviços.

O projeto permite:
- múltiplos salões (tenants)
- profissionais com disponibilidade configurável
- geração automática de horários (slots)
- agendamento público
- cancelamento e reativação de horários
- agenda diária

---

## 🧠 Visão Geral

Fluxo principal do sistema:

1. Admin cadastra:
   - serviços
   - profissionais
   - regras de disponibilidade
   - bloqueios (time-offs)
2. Sistema gera horários disponíveis automaticamente
3. Cliente escolhe horário e agenda
4. Admin visualiza agenda do dia
5. Agendamentos podem ser cancelados ou reativados

---

## 🏗️ Arquitetura

Projeto organizado como **monorepo**:

projeto_agendamento/
├─ apps/
│ └─ api/ # Backend NestJS
│ ├─ prisma/ # Schema, migrations e seed
│ ├─ src/
│ │ ├─ admin/ # Rotas protegidas (JWT)
│ │ ├─ auth/ # Autenticação JWT
│ │ ├─ prisma/ # PrismaService
│ │ └─ public/ # Rotas públicas (agendamento)
│ └─ main.ts
├─ pnpm-workspace.yaml
└─ README.md

---

## ⚙️ Tecnologias Utilizadas

- **Node.js**
- **NestJS**
- **Prisma ORM**
- **PostgreSQL**
- **JWT (Auth)**
- **Luxon (timezone)**
- **pnpm (monorepo)**
- **TypeScript**

---

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js >= 20
- pnpm
- Docker (para o PostgreSQL)

---

### Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/intelligent-scheduling-saas.git
cd intelligent-scheduling-saas

---

Subir o banco de dados (PostgreSQL)
Exemplo usando Docker:

docker run --name scheduler-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=scheduler \
  -p 5432:5432 \
  -d postgres

---

Criar o arquivo .env
📍 apps/api/.env

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scheduler?schema=public
PORT=3001
JWT_SECRET=dev_secret_key
JWT_EXPIRES_IN=7d

---

Instalar dependências
📍 na raiz do projeto

pnpm install

---

Rodar migrations e seed
📍 apps/api

pnpm prisma migrate dev
pnpm prisma generate
pnpm tsx prisma/seed.ts

---

Rodar o backend
📍 apps/api

pnpm start:dev

API disponível em:
http://localhost:3001

---

### Conceitos importantes

- **slug**: identificador único e amigável do salão (usado em URLs públicas)
- **professionalId**: ID interno do profissional
- **serviceId**: ID do serviço
- **bookingId**: ID do agendamento
- **slot**: horário disponível calculado dinamicamente

---

📡 Principais Endpoints

Públicos

### 🔹 Listar serviços do salão
GET /public/tenants/:slug/services

- `slug`: identificador único do salão (ex: salao-bela-arte)
- Retorna os serviços ativos disponíveis para agendamento

---
### 🔹 Listar profissionais do salão
GET /public/tenants/:slug/professionals

- `slug`: identificador único do salão
- Retorna os profissionais ativos do salão

---
### 🔹 Listar horários disponíveis (slots)
GET /public/tenants/:slug/professionals/:id/slots?serviceId=:serviceId&date=YYYY-MM-DD

**Query params**
- `servicoId`: ID do serviço escolhido
- `data`: data no formato YYYY-MM-DD

**Parâmetros**
- `slug`: identificador do salão
- `professionalId`: ID do profissional escolhido

> Gera automaticamente os horários disponíveis com base em:
> - disponibilidade do profissional
> - duração do serviço
> - agendamentos existentes
> - bloqueios (time-offs)

---
### 🔹 Criar agendamento
POST /public/tenants/:slug/bookings

**Body**
```json
{
  "professionalId": "string",
  "serviceId": "string",
  "customerName": "string",
  "customerPhone": "string",
  "startAt": "ISO-8601 com timezone (ex: 2026-01-30T09:30:00-03:00)"
}

---
### 🔹 Agenda do profissional (dia específico)
GET /public/tenants/:slug/professionals/:id/bookings?date=YYYY-MM-DD

**Query params**
- `data`: data no formato YYYY-MM-DD

- Retorna todos os agendamentos do dia (confirmados e cancelados)
---
### 🔹 Cancelar agendamento
PATCH /public/tenants/:slug/bookings/:id/cancel

**Parâmetros**
- `slug`: identificador do salão
- `id`: ID do agendamento

---
### 🔹 Confirmar (reativar) agendamento cancelado
PATCH /public/tenants/:slug/bookings/:id/confirm

**Parâmetros**
- `slug`: identificador do salão
- `id`: ID do agendamento

- Reativa um agendamento cancelado, se o horário ainda estiver disponível

---

Admin (JWT)

### 🔹 Autenticação
POST /auth/login

**Body**
{
  "tenantSlug": "salao-bela-arte",
  "email": "admin@salao.com",
  "password": "admin123"
}

**Retorno**
{
  "access_token": "jwt_token"
}

- Autentica um usuário administrador e retorna um JWT para acesso às rotas administrativas.

---
### 🔹 Listar serviços
GET /admin/services?active=all

**Parâmetros**
- `active`: all, true, false

-Retorna todos os serviços do salão do administrador autenticado
- `true`: Retorna todos serviços ativos
- `false`: Retorna todos os serviços inativos

---
---
### 🔹 Criar serviços
POST /admin/services

**Body**
{
  "name": "Barba",
  "durationMin": 20,
  "priceCents": 3000,
  "active": true
}

- Cria um novo serviço para o salão.

---
### 🔹 Atualizar serviço
PATCH /admin/services/:id

**Body**
{
  "priceCents": 3500,
  "active": true
}

**Parâmetros**
`id`: ID do serviço

- Atualiza dados de um serviço existente.

---
### 🔹 Deletar Serviço
DELETE /admin/services/:id

**Parâmetros**
`id`: ID do serviço

- Coloca um serviço específico como inativo

---
### 🔹 Listar Profissionais
GET /admin/professionals

- Retorna todos os profissionais do salão
- Inclui ativos e inativos

---
### 🔹 Criar Profissionais
POST /admin/professionals

**Body**
{
  "name": "Maria (Cabeleireira)",
  "email": "maria@salao.com",
  "phone": "34999999999",
  "active": true
}

- Cria um profissional para o salão

---
### 🔹 Deleta Profissional
POST /admin/professionals/:id

- `id` ID do profissional

- Marca o profissional como inativo
- Profissionais inativos não recebem novos agendamentos

---
### 🔹 Disponibilidade do Profissional
POST /admin/professionals/:id/availability-rules

**Parâmetros**
`id`: ID do profissional

**Body**
{ 
    "dayOfWeek": 5, 
    "startMin": 540, 
    "endMin": 1080, 
    "intervalMin": 30, 
    "active": true 
}

🔸 dayOfWeek (number)
 - Dia da semana em que a regra se aplica

 - Valores:
 0 → Domingo
 1 → Segunda-feira
 2 → Terça-feira
 3 → Quarta-feira
 4 → Quinta-feira
 5 → Sexta-feira
 6 → Sábado

 Exemplo:
 "dayOfWeek": 5 ➡️ Sexta-feira

🔸 startMin (number)
 - Horário inicial de atendimento em minutos
 - Contado a partir de 00:00

 Exemplo:
 "startMin": 540 ➡️ 09:00 (9 × 60)
 - Define quando o profissional pode atender.

🔸 endMin (number)
 - Horário final de atendimento em minutos
 - Define até que horas o profissional pode atender

 Exemplo:
 "endMin": 1080 ➡️ 18:00 (18 × 60)

 ⚠️ O último horário gerado sempre respeita:
    - duração do serviço
    - intervalos
    - bloqueios (time-offs)

🔸 intervalMin (number)
 - Intervalo (passo) entre os horários disponíveis
 - Usado para gerar os slots

 Exemplo:
 "intervalMin": 30 ➡️ Slots a cada 30 minutos
 (09:00, 09:30, 10:00, ...)

🔸 active (boolean)
 - Indica se a regra está ativa
 - Regras inativas não são consideradas na geração de horários

 Exemplo:
 "active": true

🧠 Como o sistema usa essa regra

    O sistema:

     - Busca regras ativas do dia (dayOfWeek)
     - Converte startMin e endMin em horários reais
     - Gera slots respeitando intervalMin

     - Remove horários:
        - já agendados
        - dentro de bloqueios (time-offs)
        - fora do horário permitido

📎  Exemplo completo (regra típica):

{
  "dayOfWeek": 1,
  "startMin": 540,
  "endMin": 720,
  "intervalMin": 30,
  "active": true
}

➡️ Segunda-feira
➡️ Das 09:00 às 12:00
➡️ Slots de 30 em 30 minutos

⚠️ Observações importantes
 - Um profissional pode ter várias regras no mesmo dia
  - Ex: manhã e tarde
 - Regras sobrepostas são tratadas corretamente
 - Alterar uma regra afeta automaticamente os slots futuros

---
### 🔹 Bloqueios (Time-offs)
POST /admin/professionals/:id/time-offs

 - Cria um bloqueio para impedir agendamentos em períodos específicos.

 **Parâmetros**
`id`: ID do profissional

**Body**
{ 
    "startAt": "2026-01-30T12:00:00-03:00", 
    "endAt": "2026-01-30T13:00:00-03:00", 
    "reason": "Almoço" 
}

Usado para:
 - almoço
 - folga
 - férias
 - ausência pontual

---

📌 Observações Importantes

- Todas as operações administrativas são multi-tenant
- O salão é identificado automaticamente pelo usuário autenticado
- Nenhuma rota admin aceita slug diretamente
- Cancelamentos e reativações impactam diretamente os slots públicos

🧠 Conceitos Importantes (Admin)
- Soft delete: registros não são removidos do banco, apenas desativados
- Availability Rules: definem os dias e horários possíveis de atendimento
- Time-offs: bloqueiam horários específicos
- JWT: controla acesso às rotas administrativas