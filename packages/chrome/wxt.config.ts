import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Granted",
    commands: import.meta.env.MODE === "production" ? {} : undefined,
    permissions: ["nativeMessaging"],
  },
});
