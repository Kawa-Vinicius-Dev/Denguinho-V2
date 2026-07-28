package com.denguinho;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.springframework.boot.SpringApplication;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

final class VercelStartupProxy {
    private static final Set<String> HOP_BY_HOP_HEADERS = Set.of(
            "connection",
            "content-length",
            "host",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailer",
            "transfer-encoding",
            "upgrade"
    );

    private VercelStartupProxy() {
    }

    static boolean isVercelContainer() {
        return "1".equals(System.getenv("VERCEL"));
    }

    static void start(String[] args) {
        int externalPort = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        int internalPort = externalPort == 65_535 ? externalPort - 1 : externalPort + 1;
        AtomicBoolean ready = new AtomicBoolean(false);

        System.setProperty("server.port", Integer.toString(internalPort));

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        HttpServer proxy = createProxy(externalPort, internalPort, ready, client);
        proxy.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        proxy.start();

        try {
            SpringApplication.run(DenguinhoApplication.class, args);
            ready.set(true);
        } catch (RuntimeException exception) {
            proxy.stop(0);
            throw exception;
        }
    }

    private static HttpServer createProxy(
            int externalPort,
            int internalPort,
            AtomicBoolean ready,
            HttpClient client
    ) {
        try {
            HttpServer server = HttpServer.create(
                    new InetSocketAddress("0.0.0.0", externalPort),
                    0
            );
            server.createContext("/", exchange -> forward(
                    exchange,
                    internalPort,
                    ready,
                    client
            ));
            return server;
        } catch (IOException exception) {
            throw new IllegalStateException("Não foi possível abrir a porta da Vercel.", exception);
        }
    }

    private static void forward(
            HttpExchange exchange,
            int internalPort,
            AtomicBoolean ready,
        HttpClient client
    ) throws IOException {
        if (!ready.get()) {
            byte[] body = "API iniciando".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
            exchange.getResponseHeaders().set("Retry-After", "1");
            exchange.sendResponseHeaders(503, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
            return;
        }

        try {
            byte[] requestBody = exchange.getRequestBody().readAllBytes();
            URI target = URI.create(
                    "http://127.0.0.1:"
                            + internalPort
                            + exchange.getRequestURI().toASCIIString()
            );
            HttpRequest.Builder request = HttpRequest.newBuilder(target)
                    .timeout(Duration.ofMinutes(4))
                    .method(
                            exchange.getRequestMethod(),
                            requestBody.length == 0
                                    ? HttpRequest.BodyPublishers.noBody()
                                    : HttpRequest.BodyPublishers.ofByteArray(requestBody)
                    );
            copyHeaders(exchange.getRequestHeaders(), request);

            HttpResponse<byte[]> response = client.send(
                    request.build(),
                    HttpResponse.BodyHandlers.ofByteArray()
            );
            response.headers().map().forEach((name, values) -> {
                if (!isHopByHop(name)) {
                    exchange.getResponseHeaders().put(name, values);
                }
            });
            exchange.sendResponseHeaders(response.statusCode(), response.body().length);
            exchange.getResponseBody().write(response.body());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            sendProxyError(exchange);
        } catch (IOException | RuntimeException exception) {
            sendProxyError(exchange);
        } finally {
            exchange.close();
        }
    }

    private static void copyHeaders(Headers headers, HttpRequest.Builder request) {
        headers.forEach((name, values) -> {
            if (!isHopByHop(name)) {
                values.forEach(value -> request.header(name, value));
            }
        });
    }

    private static boolean isHopByHop(String name) {
        return HOP_BY_HOP_HEADERS.contains(name.toLowerCase(Locale.ROOT));
    }

    private static void sendProxyError(HttpExchange exchange) throws IOException {
        byte[] body = "API temporariamente indisponível".getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
        exchange.sendResponseHeaders(502, body.length);
        exchange.getResponseBody().write(body);
    }
}
