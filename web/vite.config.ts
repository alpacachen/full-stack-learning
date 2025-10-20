import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:3000/",
				changeOrigin: true,
			},
			"/sina-api": {
				target: "https://money.finance.sina.com.cn",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/sina-api/, ""),
			},
		},
	},
});
