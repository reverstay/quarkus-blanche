// vite.config.mts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Carrega TODAS as variáveis do .env da raiz (sem prefixo)
  const env = loadEnv(mode, process.cwd(), "");

  // HMR / porta
  const hmrHost = env.VITE_HMR_HOST || "localhost";
  const hmrPort = Number(env.VITE_HMR_PORT || "5173");
  const usePolling = (env.CHOKIDAR_USEPOLLING || "").toLowerCase() === "true";

  // Base da API:
  // - Se VITE_API_BASE for uma URL absoluta (http...), o front chama direto essa URL
  // - Se NÃO for absoluta (ou vazia), usamos o proxy do Vite
  const apiBase = env.VITE_API_BASE || "";
  const apiIsAbsolute = /^https?:\/\//i.test(apiBase);

  // Detecta se está rodando em Docker
  // (você já setou DOCKER=1 no .env da raiz)
  const isDocker = (process.env.DOCKER || env.DOCKER) === "1";

  // Para proxy:
  // - Em Docker: backend acessível pelo nome do serviço (quarkus:8080)
  // - Fora de Docker: localhost:8080
  const targetHost = isDocker
    ? "http://quarkus:8080"
    : (env.API_TARGET || "http://localhost:8080");

  const proxy: Record<string, any> = {};

  // Só configura proxy se NÃO tiver uma base absoluta de API
  if (!apiIsAbsolute) {
    // Suas rotas de backend
    proxy["/auth"] = { target: targetHost, changeOrigin: true };
    proxy["/permissoes"] = { target: targetHost, changeOrigin: true };
    // útil pra checar health / q/health etc.
    proxy["/q"] = { target: targetHost, changeOrigin: true };
  }

  return {
    plugins: [react()],
    server: {
      host: true,        // aceita conexões externas (importante no Docker)
      port: hmrPort,
      strictPort: true,
      hmr: { host: hmrHost, port: hmrPort },
      watch: { usePolling },
      proxy,             // ativo se VITE_API_BASE não for absoluto
    },
    preview: {
      port: hmrPort,
    },
  };
});
