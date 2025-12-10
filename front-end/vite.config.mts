import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // --- CONFIGURAÇÃO DO HMR (Hot Module Replacement) ---
  // Se as variáveis não existirem (rodando local fora do docker),
  // usa 'ws' e deixa a porta automática (null/undefined faz o vite decidir)
  const hmrHost = env.VITE_HMR_HOST || "localhost";
  const hmrClientPort = env.VITE_HMR_PORT ? Number(env.VITE_HMR_PORT) : undefined;
  const hmrProtocol = env.VITE_HMR_PROTOCOL || "ws";

  // --- CONFIGURAÇÃO DO PROXY (FALLBACK) ---
  // Usado apenas se você acessar http://localhost:5173 direto (pulando o Nginx)
  // ou se rodar fora do Docker.
  const isDocker = (process.env.DOCKER || env.DOCKER) === "1";
  const targetHost = isDocker ? "http://quarkus:8080" : "http://localhost:8080";

  return {
    plugins: [react()],
    server: {
      host: true, // Necessário para Docker (0.0.0.0)
      port: 5173, // Porta interna do Container
      strictPort: true,

      // Permite que o Vite aceite conexões vindas do Nginx ou nomes de domínio
      allowedHosts: [
        "blanche.neuverse.com.br",
        "www.blanche.neuverse.com.br",
        "localhost",
        "frontend" // Útil se o Nginx resolver internamente
      ],

      // Configuração crucial para o WebSocket funcionar atrás do Nginx
      hmr: {
        host: hmrHost,         // "localhost" (definido no docker-compose)
        protocol: hmrProtocol, // "ws" (definido no docker-compose)
        clientPort: hmrClientPort, // 80 (definido no docker-compose)
      },

      // Proxy interno do Vite.
      // Em DEV com Nginx (acessando via porta 80), isso NÃO é usado.
      // O Nginx faz o roteamento antes de chegar aqui.
      // Isso serve de backup se você acessar :5173 direto.
      proxy: {
        "/auth": { target: targetHost, changeOrigin: true },
        "/permissoes": { target: targetHost, changeOrigin: true },
        "/empresas": { target: targetHost, changeOrigin: true },
        "/usuarios": { target: targetHost, changeOrigin: true },
        "/unidades": { target: targetHost, changeOrigin: true },
        "/q": { target: targetHost, changeOrigin: true },
      },

      watch: {
        // Ajuda no Docker em Windows/Mac para garantir que mudanças de arquivo sejam vistas
        usePolling: env.CHOKIDAR_USEPOLLING === "true",
      }
    },
  };
});