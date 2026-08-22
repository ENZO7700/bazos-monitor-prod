import { execSync } from "node:child_process";

const port = process.argv[2] ?? "3000";
const WAIT_TIMEOUT_MS = 3000;
const POLL_INTERVAL_MS = 100;

function getPids(targetPort) {
  try {
    const output = execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN`, {
      encoding: "utf8",
    }).trim();
    return output ? output.split("\n").filter(Boolean) : [];
  } catch {
    return [];
  }
}

const pids = getPids(port);
if (pids.length === 0) {
  process.exit(0);
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isAlive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return !isAlive(pid);
}

for (const rawPid of pids) {
  try {
    const pid = Number(rawPid);
    const command = execSync(`ps -p ${pid} -o comm=`, { encoding: "utf8" }).trim();
    if (!command.includes("node")) continue;
    process.kill(pid, "SIGTERM");
    const exited = await waitForExit(pid, WAIT_TIMEOUT_MS);
    if (!exited) {
      process.kill(pid, "SIGKILL");
      await waitForExit(pid, 500);
    }
    console.log(`Ukončený starý dev server na porte ${port} (PID ${pid})`);
  } catch {
    // Process already exited.
  }
}
