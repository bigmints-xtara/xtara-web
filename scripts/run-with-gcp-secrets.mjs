#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";

const projectId = process.env.GCLOUD_PROJECT || "bigmints-xtara";
const separator = process.argv.indexOf("--");
const command = separator >= 0 ? process.argv.slice(separator + 1) : [];

if (!command.length) {
  console.error("Usage: node scripts/run-with-gcp-secrets.mjs -- <command> [args...]");
  process.exit(1);
}

const secretEnvironment = {
  "xtara-web-firebase-api-key": "NEXT_PUBLIC_FIREBASE_API_KEY",
  "xtara-web-firebase-auth-domain": "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "xtara-web-firebase-project-id": "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "xtara-web-firebase-storage-bucket": "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "xtara-web-firebase-messaging-sender-id": "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "xtara-web-firebase-app-id": "NEXT_PUBLIC_FIREBASE_APP_ID",
  "xtara-web-firebase-measurement-id": "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
};

const runtimeEnvironment = { ...process.env };
runtimeEnvironment.NEXT_PUBLIC_XTARA_API_BASE_URL ||= "/xtara-service";
// Keep one-service localhost development usable. Developers working on the API
// can still override this with http://127.0.0.1:3111 explicitly.
runtimeEnvironment.XTARA_API_PROXY_TARGET ||= "https://xtara-api-h7awati5ja-uc.a.run.app";
let configurationSource = "Secret Manager";
try {
  for (const [secretName, environmentKey] of Object.entries(secretEnvironment)) {
    runtimeEnvironment[environmentKey] = execFileSync(
      "gcloud",
      ["secrets", "versions", "access", "latest", "--secret", secretName, "--project", projectId],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  }
} catch {
  console.warn("Managed-secret access is unavailable; reading the public Firebase web configuration from https://xtara.ai.");
  Object.assign(runtimeEnvironment, await readPublicFirebaseConfiguration("https://xtara.ai"));
  configurationSource = "the verified public Xtara application";
}
validateFirebaseConfiguration(runtimeEnvironment, projectId);

console.log(`Starting ${command[0]} with Firebase configuration from ${configurationSource} (${projectId}).`);
const child = spawn(command[0], command.slice(1), {
  env: runtimeEnvironment,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

async function readPublicFirebaseConfiguration(origin) {
  const html = await fetch(origin).then((response) => {
    if (!response.ok) throw new Error(`Public Xtara request failed (${response.status})`);
    return response.text();
  });
  const scriptPaths = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((match) => match[1]);
  const scripts = await Promise.all(scriptPaths.map((path) => fetch(new URL(path, origin)).then((response) => response.text())));
  const source = scripts.join("\n");
  const properties = {
    NEXT_PUBLIC_FIREBASE_API_KEY: "apiKey",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "authDomain",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "projectId",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "storageBucket",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "messagingSenderId",
    NEXT_PUBLIC_FIREBASE_APP_ID: "appId",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "measurementId",
  };
  const configuration = {};
  for (const [environmentKey, property] of Object.entries(properties)) {
    const match = source.match(new RegExp(`${property}:["']([^"']+)["']`));
    if (match) configuration[environmentKey] = match[1];
  }
  for (const required of [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ]) {
    if (!configuration[required]) throw new Error(`Public Firebase configuration is missing ${required}`);
  }
  return configuration;
}

function validateFirebaseConfiguration(environment, expectedProjectId) {
  if (environment.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== expectedProjectId) {
    throw new Error("Firebase configuration belongs to an unexpected project.");
  }
  if (!/^AIza[0-9A-Za-z_-]{20,}$/.test(environment.NEXT_PUBLIC_FIREBASE_API_KEY || "")) {
    throw new Error("Firebase API key is missing or malformed.");
  }
  if (!environment.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.endsWith(".firebaseapp.com")) {
    throw new Error("Firebase auth domain is missing or malformed.");
  }
}
