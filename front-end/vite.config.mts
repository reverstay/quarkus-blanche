// vite.config.mts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Carrega TODAS as variáveis do .env da raiz (sem prefixo)
  const env = loadEnv(mode, process.cwd(), "");

  // HMR / porta
  const hmrHost = env.VITE_HMR_HOST || "localhost";
  const hmrPort = Number(env.VITE_HMR_PORT || "5173");
  const usePolling =
    (env.CHOKIDAR_USEPOLLING || "").toLowerCase() === "true";

  // Base da API:
  // - Se VITE_API_BASE for uma URL absoluta (http...), o front chama direto essa URL
  // - Se NÃO for absoluta (ou vazia), usamos o proxy do Vite
  const apiBase = env.VITE_API_BASE || "";
  const apiIsAbsolute = /^https?:\/\//i.test(apiBase);

  // Detecta se está rodando em Docker (DOCKER=1 no .env)
  const isDocker = (process.env.DOCKER || env.DOCKER) === "1";

  // Destino do backend:
  // - Em Docker: nome do serviço (quarkus:8080)
  // - Fora do Docker: localhost:8080 (ou override via API_TARGET)
  const targetHost = isDocker
    ? "http://quarkus:8080"
    : env.API_TARGET || "http://localhost:8080";

  const proxy: Record<string, any> = {};

  if (!apiIsAbsolute) {
    // Auth
    proxy["/auth"] = { target: targetHost, changeOrigin: true };

    // (se ainda usar esse endpoint legado)
    proxy["/permissoes"] = { target: targetHost, changeOrigin: true };

    // Empresas / Unidades / Usuários (novo backend Quarkus)
    proxy["/empresas"] = { target: targetHost, changeOrigin: true };
    proxy["/usuarios"] = { target: targetHost, changeOrigin: true };
    proxy["/unidades"] = { target: targetHost, changeOrigin: true };

    // Health / q/...
    proxy["/q"] = { target: targetHost, changeOrigin: true };
  }

  return {
    plugins: [react()],
    server: {
      host: true,
      port: hmrPort,
      strictPort: true,
      hmr: {
        host: hmrHost,
        port: hmrPort,
      },
      watch: { usePolling },
      proxy,
    },
    preview: {
      port: hmrPort,
    },
  };
});
