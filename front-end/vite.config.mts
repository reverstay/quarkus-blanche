// vite.config.mts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const hmrHost = env.VITE_HMR_HOST || "localhost";
  const hmrPort = Number(env.VITE_HMR_PORT || "5173");
  const usePolling =
    (env.CHOKIDAR_USEPOLLING || "").toLowerCase() === "true";

  const apiBase = env.VITE_API_BASE || "";
  const apiIsAbsolute = /^https?:\/\//i.test(apiBase);

  const isDocker = (process.env.DOCKER || env.DOCKER) === "1";

  const targetHost = isDocker
    ? "http://quarkus:8080"
    : env.API_TAssRGET || "http://localhost:8080";

  const proxy: Record<string, any> = {};

  if (!apiIsAbsolute) {
    proxy["/auth"] = { target: targetHost, changeOrigin: true };
    proxy["/permissoes"] = { target: targetHost, changeOrigin: true };
    proxy["/empresas"] = { target: targetHost, changeOrigin: true };
    proxy["/usuarios"] = { target: targetHost, changeOrigin: true };
    proxy["/unidades"] = { target: targetHost, changeOrigin: true };
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
      // 👇 AQUI você libera o domínio que está usando
      allowedHosts: ["blanche.neuverse.com.br"],
    },
    preview: {
      port: hmrPort,
      // se você usar `vite preview` atrás do mesmo domínio:
      allowedHosts: ["blanche.neuverse.com.br"],
    },
  };
});
