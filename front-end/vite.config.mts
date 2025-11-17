// vite.config.mts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // carrega .env (todas as chaves)
  const hmrHost = env.VITE_HMR_HOST || "localhost";
  const hmrPort = Number(env.VITE_HMR_PORT || "5173");
  const usePolling = (env.CHOKIDAR_USEPOLLING || "").toLowerCase() === "true";

  const apiBase = env.VITE_API_BASE || "";
  const apiIsAbsolute = /^https?:\/\//i.test(apiBase);

  // Quando usar proxy (apenas se VITE_API_BASE NÃO é absoluto):
  // - Fora do Docker: localhost:8080
  // - Em Docker: use o nome do serviço (quarkus:8080)
  const isDocker = (process.env.DOCKER || env.DOCKER) === "1";
  const targetHost = isDocker ? "http://quarkus:8080" : (env.API_TARGET || "http://localhost:8080");

  const proxy: Record<string, any> = {};
  if (!apiIsAbsolute) {
    // Ajuste as rotas que seu backend expõe diretamente
    proxy["/auth"] = { target: targetHost, changeOrigin: true };
    proxy["/permissoes"] = { target: targetHost, changeOrigin: true };
    // útil para checar health no dev
    proxy["/q"] = { target: targetHost, changeOrigin: true };
  }

  return {
    plugins: [react()],
    server: {
      host: true,                // aceita conexões externas (Docker)
      port: hmrPort,
      strictPort: true,
      hmr: { host: hmrHost, port: hmrPort },
      watch: { usePolling },     // melhora hot-reload em WSL/VM/volumes
      proxy,                     // só ativa se VITE_API_BASE não for absoluto
    },
    preview: {
      port: hmrPort,
    },
  };
});
