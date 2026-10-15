# Monitoramento API — Spring Boot + Prometheus + Grafana

Projeto de exemplo para iniciar API, Prometheus e Grafana com um único comando Docker Compose.

## Requisitos
- Docker Desktop instalado e em execução.
- Docker Compose v2.
- Opcional para executar fora do Docker: JDK 21 e Maven.

## Preparar
No PowerShell, na raiz do projeto:
```powershell
Copy-Item .env.example .env
notepad .env
```
Troque `GRAFANA_PASSWORD` por uma senha forte. Não envie `.env` ao Git.

## Validar e iniciar
```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

## URLs
- API: http://localhost:8080/api/hello
- Status: http://localhost:8080/api/status
- Actuator health: http://localhost:8080/actuator/health
- Métricas: http://localhost:8080/actuator/prometheus
- Prometheus: http://localhost:9090
- Prometheus targets: http://localhost:9090/targets
- Grafana: http://localhost:3000

Credenciais do Grafana: valores definidos no `.env` (usuário padrão `admin`).

## Testar
Abra algumas vezes `/api/hello` e `/api/status` para gerar requisições. Em Prometheus, consulte `up{job="api"}`. O dashboard `Monitoramento API` é provisionado automaticamente.

## Comandos úteis
```powershell
docker compose logs -f
docker compose logs -f api
docker compose restart
docker compose stop
docker compose start
docker compose down
```
`docker compose down -v` remove também os volumes persistentes do Prometheus e Grafana. Use com cuidado.

## Como funciona
A API usa Spring Boot Actuator e Micrometer para expor métricas em `/actuator/prometheus`. Prometheus coleta usando `api:8080`, nome DNS interno do serviço no Compose. Grafana usa o datasource provisionado `http://prometheus:9090`.

## Adaptar para uma API existente
Adicione `spring-boot-starter-actuator` e `micrometer-registry-prometheus`; exponha `prometheus` em `management.endpoints.web.exposure.include`; ajuste o `metrics_path` e o target no `prometheus/prometheus.yml`. Não exponha métricas publicamente sem avaliar segurança. Este projeto é um ponto de partida local, não uma configuração completa de produção.
