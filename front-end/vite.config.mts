import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const hmrHost = env.VITE_HMR_HOST || "localhost";
  const hmrClientPort = Number(env.VITE_HMR_PORT) || 443; // Porta que o navegador vê
  const hmrProtocol = env.VITE_HMR_PROTOCOL || "wss";

  const isDocker = (process.env.DOCKER || env.DOCKER) === "1";
  
  // Se estiver no Docker, o proxy interno do Vite aponta para o container
  // Mas em produção com Nginx, isso é menos usado, pois o Nginx faz o roteamento.
  const targetHost = isDocker ? "http://quarkus:8080" : "http://localhost:8080";

  return {
    plugins: [react()],
    server: {
      host: true, // Escuta em 0.0.0.0
      port: 5173,
      strictPort: true,
      allowedHosts: ["blanche.neuverse.com.br", "localhost"],
      hmr: {
        host: hmrHost,
        protocol: hmrProtocol,
        clientPort: hmrClientPort, // Força o navegador a usar a porta 443
      },
      // Proxy de desenvolvimento (fallback se o Nginx não pegar)
      proxy: {
        "/auth": { target: targetHost, changeOrigin: true },
        "/permissoes": { target: targetHost, changeOrigin: true },
        "/empresas": { target: targetHost, changeOrigin: true },
        "/usuarios": { target: targetHost, changeOrigin: true },
        "/unidades": { target: targetHost, changeOrigin: true },
        "/q": { target: targetHost, changeOrigin: true },
      },
    },
  };
});