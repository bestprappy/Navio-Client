// Starts `next dev` against the deployed VM backend.
//
// The VM serves a self-signed certificate, so Node rejects every server-side
// HTTPS call to it — OIDC discovery, token exchange, and the /api/** gateway
// proxies alike — with DEPTH_ZERO_SELF_SIGNED_CERT. NODE_EXTRA_CA_CERTS fixes
// that, but Node reads it once at process start-up, before .env.local is
// loaded, so it cannot live in the env file. This wrapper puts it in the
// environment and then spawns Next as a fresh child process.
//
// It also loads .env.local.prod (the VM settings) into the child's environment.
// Next never overrides a variable that is already set, so those values win over
// .env.local, which stays pointed at the local Docker/Spring stack for
// `npm run dev`.
//
// Delete the certificate handling once the VM serves a publicly trusted
// certificate.

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const certificatePath = resolve(scriptDirectory, "..", "certs", "navio-vm.pem");
const vmEnvPath = resolve(scriptDirectory, "..", ".env.local.prod");

if (!existsSync(vmEnvPath)) {
  console.error(
    `Missing ${vmEnvPath}.\n` +
      "Create it from .env.example with the deployed VM values (see the\n" +
      "comments in .env.example for each production counterpart).",
  );
  process.exit(1);
}

const vmEnv = parseEnv(readFileSync(vmEnvPath, "utf8"));

if (!existsSync(certificatePath)) {
  console.error(
    `Missing ${certificatePath}.\n` +
      "Re-export it with:\n" +
      "  openssl s_client -connect navio.sit.kmutt.ac.th:443 -servername navio.sit.kmutt.ac.th </dev/null \\\n" +
      "    | openssl x509 > client/certs/navio-vm.pem",
  );
  process.exit(1);
}

const child = spawn("next", ["dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ...vmEnv, NODE_EXTRA_CA_CERTS: certificatePath },
});

child.on("exit", (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
