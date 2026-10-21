const express = require("express");
const client = require("prom-client");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const register = new client.Registry();

register.setDefaultLabels({
  application: "api-seminario-grafana"
});

client.collectDefaultMetrics({
  register,
  prefix: "nodejs_"
});

const requestsTotal = new client.Counter({
  name: "api_http_requests_total",
  help: "Total de requisicoes HTTP recebidas pela API",
  labelNames: ["method", "route", "status_code"],
  registers: [register]
});

const requestDuration = new client.Histogram({
  name: "api_http_request_duration_seconds",
  help: "Duracao das requisicoes HTTP em segundos",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

app.disable("x-powered-by");
app.use(express.json());

// Instrumenta as rotas da aplicacao. A rota /metrics e excluida para
// evitar que as consultas do Prometheus contaminem as metricas de negocio.
app.use((req, res, next) => {
  if (req.path === "/metrics") return next();

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    // Usa a rota resolvida pelo Express quando disponivel, evitando IDs
    // ou valores dinamicos que criariam cardinalidade excessiva.
    const route = req.route?.path
      ? `${req.baseUrl || ""}${req.route.path}`
      : req.path;

    const labels = {
      method: req.method,
      route: route || "unknown",
      status_code: String(res.statusCode)
    };

    requestsTotal.inc(labels);
    requestDuration.observe(labels, durationSeconds);
  });

  next();
});

app.get("/", (req, res) => {
  res.json({
    aplicacao: "API Seminário Grafana",
    status: "online",
    mensagem: "API funcionando corretamente"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

app.get("/api/test", (req, res) => {
  res.json({
    status: "sucesso",
    mensagem: "Requisição recebida com sucesso",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/users", (req, res) => {
  res.json([
    { id: 1, nome: "Alice" },
    { id: 2, nome: "Bruno" },
    { id: 3, nome: "Carla" }
  ]);
});

app.get("/api/error", (req, res) => {
  res.status(500).json({
    status: "erro",
    mensagem: "Erro simulado para monitoramento"
  });
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// Tratamento de rotas inexistentes: contabilizado como HTTP 404.
app.use((req, res) => {
  res.status(404).json({
    status: "erro",
    mensagem: "Rota não encontrada"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API executando na porta ${PORT}`);
});
