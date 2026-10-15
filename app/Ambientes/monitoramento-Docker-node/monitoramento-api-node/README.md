# API Node.js + Express + Prometheus + Grafana

Projeto ajustado a partir da API enviada (`server.js`), preservando as rotas existentes e acrescentando métricas HTTP reais.

## Estrutura

- `server.js`: API Express e métricas Prometheus.
- `package.json`: Express e prom-client.
- `Dockerfile`: imagem Node.js.
- `docker-compose.yml`: API, Prometheus e Grafana.
- `prometheus/prometheus.yml`: coleta de métricas em `/metrics`.
- `grafana/provisioning/`: datasource e dashboard provisionados automaticamente.
- `grafana/dashboards/monitoramento-api.json`: painel inicial.

## 1. Preparar ambiente

No PowerShell, na pasta do projeto:

```powershell
Copy-Item .env.example .env
notepad .env
```

Troque `GRAFANA_PASSWORD` por uma senha forte. O `.env` não deve ser enviado ao Git.

## 2. Iniciar os serviços

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

## 3. Endereços

- API: http://localhost:3000/
- Teste: http://localhost:3000/api/test
- Usuários: http://localhost:3000/api/users
- Erro simulado (HTTP 500): http://localhost:3000/api/error
- Healthcheck: http://localhost:3000/health
- Métricas: http://localhost:3000/metrics
- Prometheus: http://localhost:9090/
- Alvos do Prometheus: http://localhost:9090/targets
- Grafana: http://localhost:3001/

Login do Grafana: usuário definido por `GRAFANA_USER` (padrão `admin`) e senha definida por `GRAFANA_PASSWORD`.

## 4. Validar métricas

1. Acesse algumas vezes `/api/test`, `/api/users` e `/api/error`.
2. Abra `/metrics` e procure `api_http_requests_total` e `api_http_request_duration_seconds`.
3. Abra Prometheus em `/targets` e confira se o job `api` está `UP`.
4. Abra o Grafana e selecione o dashboard `Monitoramento API Node.js`.

As séries de latência com percentis precisam de algumas amostras antes de ficarem informativas.

## Comandos úteis

```powershell
docker compose logs -f
docker compose logs -f api
docker compose restart
docker compose stop
docker compose start
docker compose down
```

`docker compose down -v` remove os volumes persistentes do Prometheus e Grafana; use apenas se quiser apagar os dados históricos e configurações armazenadas nesses volumes.

## O que foi ajustado

- Mantidas as rotas `/`, `/api/test`, `/api/users` e `/api/error`.
- Mantido o endpoint `/metrics`, agora usando `prom-client` e métricas reais.
- Adicionado `/health` para verificação de saúde.
- Adicionadas métricas de contagem de requisições, latência e métricas padrão do Node.js.
- Configurado o Prometheus para coletar `api:3000/metrics`.
- Configurado o Grafana com datasource e dashboard automáticos.
- API, Prometheus e Grafana compartilham uma rede Docker dedicada.

## Observações de segurança e produção

Este projeto é para desenvolvimento/demonstração. Antes de expor serviços na internet, restrinja portas, proteja credenciais, configure TLS/autenticação e avalie se `/metrics` deve ficar acessível apenas pela rede interna. Em produção, fixe e atualize versões de imagens e dependências conforme política do projeto.
