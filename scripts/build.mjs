// @ts-check

import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

/** @returns {import("esbuild").Plugin} */
function replace() {
  return {
    name: "replace",
    setup(build) {
      build.onLoad({ filter: /.*/ }, async (args) => {
        if (args.path.includes("node_modules")) {
          return null;
        }

        const source = await fs.promises.readFile(args.path, "utf-8");
        const contents = source
          .replace(/\b__DEV__\b/g, 'process.env.NODE_ENV !== "production"')
          .replace(/Symbol(?=\(|\.)/g, "/* @__PURE__ */ Symbol");

        return {
          contents,
          loader: "default",
        };
      });
    },
  };
}

/** @returns {import("esbuild").Plugin} */
function resolve() {
  /** @type {Record<string, boolean>} */
  const accessCache = {};

  /** @param {string} file */
  function readOk(file) {
    if (file in accessCache) {
      return accessCache[file];
    }

    try {
      fs.accessSync(file, fs.constants.R_OK);

      return (accessCache[file] = true);
    } catch {
      return (accessCache[file] = false);
    }
  }

  /**
   * @param {string} dir
   * @param {string} file
   */
  function getBuiltPath(dir, file) {
    dir = path.join(dir, file);
    const pairs = Object.entries({
      ".ts": ".js",
      ".tsx": ".jsx",
      "/index.ts": "/index.js",
      "/index.tsx": "/index.jsx",
    });

    for (const [src, dst] of pairs) {
      if (readOk(dir + src)) {
        return file + dst;
      }
    }

    return null;
  }

  return {
    name: "resolve",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.namespace !== "file" || args.kind !== "import-statement") {
          return null;
        }

        if (
          args.resolveDir.includes("node_modules")
          || !args.resolveDir.startsWith(".")
        ) {
          return {
            external: true,
          };
        }

        const builtPath = getBuiltPath(args.resolveDir, args.path);

        if (builtPath) {
          return {
            path: builtPath,
            external: true,
          };
        }

        return {
          errors: [
            {
              text: `File not found: ${args.path}`,
            },
          ],
        };
      });
    },
  };
}

/** @type {import("esbuild").BuildOptions[]} */
const config = [
  // ESM
  {
    // General

    bundle: true,
    platform: "node",

    // Input

    entryPoints: ["src/**/*.ts"],

    // Output contents

    format: "esm",
    lineLimit: 80,

    // Output location

    write: true,
    outdir: "dist",
    outbase: "src",
    outExtension: {
      ".js": ".mjs",
    },

    // Plugins

    plugins: [replace(), resolve()],
  },
  // CJS
  {
    // General

    bundle: true,
    platform: "node",

    // Input

    entryPoints: ["src/**/*.ts"],

    // Output contents

    format: "cjs",
    target: "es6",
    lineLimit: 80,

    // Output location

    write: true,
    outdir: "dist",
    outbase: "src",
    outExtension: {
      ".js": ".cjs",
    },

    // Plugins

    plugins: [replace(), resolve()],
  },
  // Bundled
  {
    // General

    bundle: true,
    platform: "node",

    // Input

    entryPoints: ["src/index.ts"],

    // Output contents

    format: "esm",

    // Output location

    write: true,
    outfile: "dist/index.min.mjs",

    // Optimization

    define: {
      __DEV__: "false",
    },
    minify: true,
    packages: "external",

    // Plugins

    plugins: [replace()],
  },
];

await Promise.all(config.map((c) => build(c)));
