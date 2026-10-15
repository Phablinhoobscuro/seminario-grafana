package br.com.exemplo.monitoramento.controller;

import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {
    @GetMapping("/hello")
    public Map<String, Object> hello() {
        return Map.of("mensagem", "API funcionando", "timestamp", Instant.now().toString());
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("status", "UP", "aplicacao", "monitoramento-api", "timestamp", Instant.now().toString());
    }
}
