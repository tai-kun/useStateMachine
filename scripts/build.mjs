// @ts-check

import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const CJS_TARGET = "ES2015";

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

/**
 * @param {"cjs" | "esm"} fmt
 * @returns {import("esbuild").Plugin}
 */
function resolve(fmt) {
  /** @type {Record<string, boolean>} */
  const accessCache = {};

  /** @param {string} file */
  function readOk(file) {
    if (file in accessCache) {
      return accessCache[file];
    }

    try {
      fs.accessSync(file, fs.constants.R_OK);
      accessCache[file] = true;

      return true;
    } catch {
      accessCache[file] = false;

      return false;
    }
  }

  /**
   * @param {string} dir
   * @param {string} file
   */
  function getBuiltPath(dir, file) {
    const name = path.join(dir, file);
    const pairs = Object.entries({
      ".ts": fmt === "cjs" ? ".cjs" : ".mjs",
      "/index.ts": fmt === "cjs" ? "/index.cjs" : "/index.mjs",
    });

    for (const [src, dst] of pairs) {
      if (readOk(name + src)) {
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
          args.resolveDir.includes("node_modules") ||
          !args.path.startsWith(".")
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

/**
 * @param {"esm" | "cjs"} format
 * @param {string} name
 * @returns {import("esbuild").BuildOptions}
 */
function toBundleOptions(format, name) {
  return {
    // General

    bundle: true,
    platform: "node",

    // Input

    entryPoints: [`src/${name}.ts`],

    // Output contents

    format,
    ...(format === "cjs" ? { target: CJS_TARGET } : {}),

    // Output location

    write: true,
    outfile: `.cache/dist/${
      // camelCase to kebab-case
      name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
    }.${format}.production.min.js`,

    // Optimization

    define: {
      __DEV__: "false",
    },
    minify: true,
    packages: "external",
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
    sourcemap: "linked",

    // Output location

    write: true,
    outdir: "dist",
    outbase: "src",
    outExtension: {
      ".js": ".mjs",
    },

    // Plugins

    plugins: [replace(), resolve("esm")],
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
    target: CJS_TARGET,
    lineLimit: 80,
    sourcemap: "linked",

    // Output location

    write: true,
    outdir: "dist",
    outbase: "src",
    outExtension: {
      ".js": ".cjs",
    },

    // Plugins

    plugins: [replace(), resolve("cjs")],
  },
  // Bundled
  ...[
    "index",
    "useStateMachine",
    "useExternalStateMachine",
    "useSyncedStateMachine",
  ].flatMap((name) => [
    toBundleOptions("esm", name),
    toBundleOptions("cjs", name),
  ]),
];

await Promise.all(config.map((c) => build(c)));
