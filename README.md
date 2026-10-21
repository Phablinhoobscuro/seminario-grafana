# Seminário Grafana — Monitoramento e Observabilidade de API Node.js

Projeto acadêmico desenvolvido para um **seminário técnico introdutório sobre Grafana**, com fundamentação teórica e demonstração prática de monitoramento de uma API Node.js utilizando **Prometheus**, **Grafana** e **Docker Compose**.

O projeto evoluiu de uma configuração local simples para um ambiente containerizado e reproduzível, com coleta de métricas reais, dashboard funcional e geração de carga para validação do comportamento observado.

---

## Objetivo

Demonstrar, de forma prática, como uma aplicação pode ser instrumentada e monitorada utilizando a seguinte arquitetura:

```text
Aplicação Node.js
      │
      │ /metrics
      ▼
Prometheus
      │
      │ PromQL
      ▼
Grafana
      │
      ▼
Dashboard
```

Na versão atual, os três serviços são executados de forma integrada com Docker Compose.

---

## Tecnologias utilizadas

- Node.js
- Express
- prom-client
- Prometheus
- Grafana
- Docker
- Docker Compose
- PowerShell
- Git/GitHub

---

## Arquitetura atual

### Ambiente Docker

```text
┌─────────────────────────────────────────────┐
│              Rede Docker                   │
│                                            │
│  API Node.js :3000                         │
│        │                                   │
│        ▼                                   │
│  Prometheus :9090                          │
│        │                                   │
│        ▼                                   │
│  Grafana :3000                             │
└─────────────────────────────────────────────┘
```

No ambiente de testes validado, as portas externas foram configuradas para evitar conflito com os serviços locais:

```text
API Docker        → http://localhost:3100
Prometheus Docker → http://localhost:9190
Grafana Docker    → http://localhost:3101
```

Internamente, os containers se comunicam pelos nomes dos serviços:

```text
Prometheus → http://api:3000/metrics
Grafana    → http://prometheus:9090
```

---

## Estrutura atual do repositório

```text
seminario-grafana/
├── app/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   └── .dockerignore
│
├── prometheus/
│   └── prometheus.yml
│
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   └── dashboards/
│   └── dashboards/
│       └── monitoramento-api.json
│
├── docs/
├── slides/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

O ambiente Docker foi consolidado na estrutura principal do repositório durante a Fase 4. A antiga estrutura intermediária `app/Ambientes/...` foi removida após a validação da nova organização.

---

# Status do projeto

## Fase 1 — Pesquisa e planejamento

**Status: Concluída ✅**

Foram realizadas pesquisas sobre:

- problema que o Grafana resolve;
- casos de uso;
- conceitos fundamentais;
- dashboard, panel, datasource, query e alert;
- arquitetura Grafana + Prometheus;
- vantagens e limitações;
- exemplos práticos.

---

## Fase 2 — Preparação do ambiente

**Status: Concluída ✅**

Foram concluídas as seguintes atividades:

- criação da API Node.js básica;
- validação da API localmente;
- configuração do Prometheus;
- configuração do Grafana;
- conexão do Grafana ao Prometheus;
- validação da métrica `api_up`;
- criação e validação do Docker Compose;
- integração entre API, Prometheus e Grafana.

### Validação local realizada

```text
API Node.js  → localhost:3000
Prometheus   → localhost:9090
Grafana      → localhost:3001
```

A configuração local foi importante para validar individualmente cada componente antes da containerização.

### Validação via Docker

O ambiente integrado foi iniciado com:

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Resultado validado:

```text
API          → running / healthy
Prometheus   → running
Grafana      → running
```

Também foram criados:

- rede Docker;
- volume do Prometheus;
- volume do Grafana;
- healthcheck da API;
- provisioning automático do Prometheus no Grafana;
- provisioning automático do dashboard.

---

## Fase 3 — Instrumentação e coleta

**Status: Concluída ✅**

As quatro tarefas da fase foram concluídas.

### 1. Instrumentar requisições HTTP

A aplicação utiliza `prom-client` para expor:

```text
api_http_requests_total
```

A métrica registra labels como:

```text
method
route
status_code
application
```

Exemplo:

```text
api_http_requests_total{
  method="GET",
  route="/api/test",
  status_code="200"
}
```

### 2. Instrumentar erros e latência

A latência é coletada por meio do histograma:

```text
api_http_request_duration_seconds
```

O histograma permite calcular percentis como p50 e p95.

O planejamento inicial previa uma métrica separada chamada `http_errors_total`. Durante a implementação, optou-se por utilizar a própria métrica de requisições com a label `status_code`.

Por exemplo:

```promql
api_http_requests_total{status_code="500"}
```

Ou, para todos os erros de servidor:

```promql
api_http_requests_total{status_code=~"5.."}
```

Essa abordagem evita duplicação de informação.

### 3. Validar coleta no Prometheus

O Prometheus foi validado com os targets:

```text
api:3000/metrics        → UP
prometheus:9090/metrics → UP
```

Além das métricas HTTP da aplicação, o `prom-client` também expõe métricas padrão do processo Node.js, incluindo:

- CPU;
- memória;
- heap;
- garbage collection;
- event loop;
- recursos ativos.

### 4. Gerar carga e observar comportamento

Foram geradas requisições reais utilizando PowerShell:

```powershell
1..50 | ForEach-Object {
    Invoke-WebRequest http://localhost:3100/api/test -UseBasicParsing | Out-Null
}
```

```powershell
1..30 | ForEach-Object {
    Invoke-WebRequest http://localhost:3100/api/users -UseBasicParsing | Out-Null
}
```

```powershell
1..20 | ForEach-Object {
    try {
        Invoke-WebRequest http://localhost:3100/api/error -UseBasicParsing -ErrorAction Stop | Out-Null
    }
    catch {
        # erro esperado
    }
}
```

O dashboard refletiu as alterações, incluindo:

- aumento da taxa de requisições;
- requisições HTTP 200;
- requisições HTTP 404;
- requisições HTTP 500;
- novas rotas monitoradas;
- alteração das métricas de latência.

---

# Dashboard atual

O Grafana já possui um dashboard funcional provisionado automaticamente:

```text
Monitoramento API Node.js
```

Atualmente estão disponíveis os seguintes painéis:

- disponibilidade da API;
- taxa de requisições HTTP;
- requisições por código HTTP;
- latência das requisições (p50 / p95);
- requisições por rota;
- memória do processo Node.js.

O datasource Prometheus também é criado automaticamente e utiliza internamente:

```text
http://prometheus:9090
```

---

## Fase 4 — Consolidação do ambiente e finalização do dashboard

**Status: Em andamento 🟡**

Como parte do dashboard e da infraestrutura já foi adiantada durante as Fases 2 e 3, a Fase 4 foi reformulada para consolidar a estrutura atual e finalizar os elementos necessários para a demonstração.

### Tarefa 1 — Consolidar o ambiente Docker no repositório principal

**Status: Concluída ✅**

O ambiente Docker foi consolidado na estrutura principal do repositório.

Foram realizadas as seguintes alterações:

- remoção da estrutura intermediária `app/Ambientes/...`;
- incorporação do `docker-compose.yml` à raiz do projeto;
- manutenção da API Node.js e do `Dockerfile` dentro de `app/`;
- consolidação do `prometheus.yml` em `prometheus/`;
- consolidação do provisioning e do dashboard em `grafana/`;
- criação do `.dockerignore`;
- atualização do `package.json` e `package-lock.json`;
- proteção do arquivo `.env` por meio do `.gitignore`;
- remoção de `node_modules` do controle de versão;
- normalização do nome `prometheus.yml`.

Após a remoção da estrutura antiga, o ambiente foi reconstruído utilizando:

```powershell
docker compose down
docker compose up -d --build
docker compose ps
```

Resultado:

```text
API          → Up / healthy
Prometheus   → Up
Grafana      → Up
```

Também foram validados:

- `GET /` → HTTP 200;
- `GET /health` → HTTP 200;
- `GET /api/test` → HTTP 200;
- `GET /metrics` → HTTP 200;
- target `api` → UP no Prometheus;
- target `prometheus` → UP no Prometheus;
- provisioning automático do datasource;
- provisioning automático do dashboard;
- atualização dos gráficos após geração de carga.

A reconstrução realizada depois da exclusão de `app/Ambientes/...` comprovou que o ambiente consolidado não depende mais da antiga estrutura intermediária.

### Tarefa 2 — Ajustar instrumentação e excluir `/health`

**Status: Próxima tarefa ⏳**

O Docker executa requisições periódicas em:

```text
/health
```

Como essas chamadas atualmente entram nas métricas HTTP, elas geram tráfego artificial nos gráficos.

A instrumentação será ajustada para ignorar:

```text
/metrics
/health
```

O healthcheck continuará funcionando normalmente, mas as requisições automáticas de `/health` deixarão de incrementar:

```text
api_http_requests_total
```

e:

```text
api_http_request_duration_seconds
```

Essa alteração permitirá que os indicadores representem apenas o tráfego relevante da aplicação.

### Tarefa 3 — Completar os indicadores do dashboard

**Status: Pendente ⬜**

Serão adicionados painéis do tipo **Stat** para:

- total de requisições;
- total de erros.

As consultas existentes também serão revisadas.

### Tarefa 4 — Finalizar layout, filtros/variáveis e alerta

**Status: Pendente ⬜**

Serão realizados:

- revisão do layout;
- criação de variáveis/filtros;
- possibilidade de filtro por rota;
- possibilidade de filtro por código HTTP;
- criação de pelo menos um alerta;
- validação final do dashboard.

---

## Fase 5 — Slides e demonstração

**Status: Pendente ⬜**

Será preparada a apresentação do seminário contendo:

- problema e contexto;
- conceitos fundamentais;
- arquitetura;
- Grafana e Prometheus;
- demonstração prática;
- métricas utilizadas;
- dashboard;
- vantagens;
- limitações;
- casos de uso;
- conclusão.

A demonstração prática deverá utilizar o ambiente Docker consolidado.

---

## Fase 6 — Validação final

**Status: Pendente ⬜**

Antes da entrega serão realizados:

- revisão técnica;
- revisão dos slides;
- revisão das referências;
- teste completo do ambiente;
- teste da demonstração;
- gravação de backup da demonstração;
- ensaio da apresentação;
- validação do arquivo final para envio.

---

# API monitorada

A aplicação disponibiliza endpoints utilizados na demonstração, incluindo:

```text
GET /
GET /api/test
GET /api/users
GET /api/error
GET /health
GET /metrics
```

### Funções principais

`/api/test`

Gera uma requisição HTTP normal para testes de monitoramento.

`/api/users`

Retorna dados simulados e permite gerar tráfego adicional.

`/api/error`

Retorna propositalmente um erro HTTP 500 para validar métricas de falha.

`/health`

Utilizado pelo healthcheck do Docker.

`/metrics`

Expõe as métricas no formato Prometheus.

---

# Métricas principais

## Total de requisições HTTP

```text
api_http_requests_total
```

## Duração das requisições

```text
api_http_request_duration_seconds
```

## Erros HTTP 500

```promql
api_http_requests_total{status_code="500"}
```

## Taxa de requisições

```promql
sum(rate(api_http_requests_total[1m]))
```

## Disponibilidade da API

No ambiente Docker, a disponibilidade pode ser obtida pelo próprio Prometheus:

```promql
up{job="api"}
```

---

# Como executar o ambiente Docker

## Pré-requisitos

- Docker Desktop;
- Docker Compose;
- WSL 2 no Windows;
- Git.

### Validar instalação

```powershell
docker --version
docker compose version
docker info
```

## Configurar variáveis de ambiente

Após clonar o projeto, crie o arquivo `.env` com base no exemplo:

```powershell
Copy-Item .env.example .env
```

Exemplo utilizado durante os testes:

```env
API_PORT=3100
PROMETHEUS_PORT=9190
GRAFANA_PORT=3101
GRAFANA_USER=admin
GRAFANA_PASSWORD=defina_uma_senha_local
```

> O arquivo `.env` contém configurações locais e não deve ser versionado.

## Subir o ambiente

Na raiz do repositório:

```powershell
docker compose config --quiet
docker compose up -d --build
```

Consultar os containers:

```powershell
docker compose ps
```

Resultado esperado:

```text
API          → Up / healthy
Prometheus   → Up
Grafana      → Up
```

## Acessar os serviços

No ambiente de testes atual:

```text
API          http://localhost:3100
Prometheus   http://localhost:9190
Grafana      http://localhost:3101
```

Targets do Prometheus:

```text
http://localhost:9190/targets
```

Dashboard do Grafana:

```text
Dashboards
└── Monitoramento
    └── Monitoramento API Node.js
```

## Encerrar o ambiente

```powershell
docker compose down
```

Para reconstruir a API após alterações:

```powershell
docker compose up -d --build
```

---

# Evolução do projeto

```text
Fase 1
Pesquisa e planejamento
        ↓
Fase 2
API + Prometheus + Grafana configurados individualmente
        ↓
Docker Compose e integração dos serviços
        ↓
Fase 3
Instrumentação + coleta + testes de carga
        ↓
Fase 4
Consolidação + refinamento do dashboard
        ↓
Fase 5
Slides e demonstração
        ↓
Fase 6
Validação e entrega
```

---

# Situação atual

```text
Fase 1  ✅ Concluída
Fase 2  ✅ Concluída
Fase 3  ✅ Concluída
Fase 4  🟡 Em andamento — Tarefa 1 concluída
Fase 5  ⬜ Pendente
Fase 6  ⬜ Pendente
```

O ambiente já foi validado de ponta a ponta:

```text
Requisição
    ↓
API Node.js
    ↓
prom-client
    ↓
/metrics
    ↓
Prometheus
    ↓
Grafana
    ↓
Dashboard
```

A consolidação do ambiente Docker foi concluída e validada após a remoção da antiga estrutura intermediária.

A próxima etapa é a **Fase 4 — Tarefa 2: ajustar a instrumentação para que as requisições automáticas do healthcheck em `/health` continuem funcionando, mas deixem de contaminar os indicadores de tráfego da aplicação**.
