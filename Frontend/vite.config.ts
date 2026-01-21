import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  const build: UserConfig["build"] = {
    outDir: "dist",
    minify: !isDev,
    rollupOptions: {
      output: {
        manualChunks: isDev ? undefined : undefined,
      },
    },
  };

  return {
    plugins: [react()],

    build,

    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
      __DEV__: JSON.stringify(isDev),
    },

    resolve: {
      alias: {
        "@": "/src",
      },
    },

    optimizeDeps: {
      exclude: ["lucide-react"],
    },
  };
});
