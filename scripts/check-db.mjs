#!/usr/bin/env node
/**
 * Overí dostupnosť Postgresu pred npm run dev.
 * Usage: node scripts/check-db.mjs [--warn]
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import net from "node:net";

const warnOnly = process.argv.includes("--warn");
const root = process.cwd();

function readDatabaseUrlFromFile(filePath) {
  if (!existsSync(filePath)) return null;
  const match = readFileSync(filePath, "utf8").match(/^DATABASE_URL=(.+)$/m);
  if (!match) return null;
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function loadDatabaseUrl() {
  const fromLocal = readDatabaseUrlFromFile(join(root, ".env.local"));
  const fromEnv = readDatabaseUrlFromFile(join(root, ".env"));
  const fromShell = process.env.DATABASE_URL ?? null;

  // Next.js: shell env wins over .env files — warn when they disagree locally.
  if (fromShell && fromLocal && fromShell !== fromLocal) {
    console.warn(
      "check-db: shell DATABASE_URL prepisuje .env.local — spusti `unset DATABASE_URL` alebo `npm run env:setup`"
    );
  }

  return fromShell ?? fromLocal ?? fromEnv ?? null;
}

function parseDatabaseName(databaseUrl) {
  try {
    const pathname = new URL(databaseUrl).pathname;
    return pathname.replace(/^\//, "").split("?")[0] || null;
  } catch {
    return null;
  }
}

function parseHostPort(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname || "localhost",
      port: url.port ? Number(url.port) : 5432,
    };
  } catch {
    return { host: "localhost", port: 5433 };
  }
}

function checkTcp(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });

    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

async function main() {
  const databaseUrl = loadDatabaseUrl();
  if (!databaseUrl) {
    console.warn("check-db: DATABASE_URL nie je nastavené — preskakujem.");
    return;
  }

  const { host, port } = parseHostPort(databaseUrl);
  const dbName = parseDatabaseName(databaseUrl);

  if (host === "localhost" && dbName && dbName !== "bazos_monitor") {
    const message = [
      `check-db: DATABASE_URL ukazuje na databázu "${dbName}", očakávaná je "bazos_monitor".`,
      "Oprav env súbory:",
      "  npm run env:setup",
      "Ak máš DATABASE_URL v shelli:",
      "  unset DATABASE_URL",
    ].join("\n");

    if (warnOnly) {
      console.warn(message);
    } else {
      console.error(message);
      process.exit(1);
    }
    return;
  }

  const ok = await checkTcp(host, port);

  if (ok) {
    console.log(
      `check-db: PostgreSQL dostupný na ${host}:${port}${dbName ? ` (db: ${dbName})` : ""}`
    );
    return;
  }

  const message = [
    `check-db: PostgreSQL nedostupný na ${host}:${port}.`,
    "Spusti databázu:",
    "  npm run db:up",
    "alebo kompletný setup:",
    "  npm run db:setup",
  ].join("\n");

  if (warnOnly) {
    console.warn(message);
    return;
  }

  console.error(message);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
