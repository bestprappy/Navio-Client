import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

function resolveModule(basePath) {
  for (const candidate of [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    resolvePath(basePath, "index.ts"),
    resolvePath(basePath, "index.tsx"),
    resolvePath(basePath, "index.js"),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (["next/image", "next/link", "next/navigation"].includes(specifier)) {
    return nextResolve(`${specifier}.js`, context);
  }
  if (specifier.startsWith("@/")) {
    const resolved = resolveModule(resolvePath(process.cwd(), specifier.slice(2)));
    if (resolved) return { shortCircuit: true, url: resolved };
  }
  if (specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) && context.parentURL?.startsWith("file:")) {
    const resolved = resolveModule(resolvePath(dirname(fileURLToPath(context.parentURL)), specifier));
    if (resolved) return { shortCircuit: true, url: resolved };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!/\.tsx?$/.test(url)) return nextLoad(url, context);
  return {
    format: "module",
    shortCircuit: true,
    source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
      },
    }).outputText,
  };
}
