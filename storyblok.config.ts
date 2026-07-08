import { defineConfig } from "storyblok/config";

export default defineConfig({
  space: "293691708305852",
  verbose: true,
  ui: {
    enabled: true,
  },
  modules: {
    components: {
      path: "./src/storyblok",
    },
    types: {
      generate: {
        strict: true,
        path: "./src/storyblok",
      },
    },
  },
});
