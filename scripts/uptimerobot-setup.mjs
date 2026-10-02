const monitors = [
  {
    name: "Northstar API + Neon health",
    url: "https://norhstar-api.onrender.com/api/health",
  },
  {
    name: "Northstar User App",
    url: "https://northstar-blockchain-hub.netlify.app",
  },
  {
    name: "Northstar Admin Panel",
    url: "https://northstar-admin-panel.netlify.app",
  },
];

if (process.argv.includes("--dry-run")) {
  for (const monitor of monitors) {
    console.log(`${monitor.name}: ${monitor.url} (every 300 seconds)`);
  }
  process.exit(0);
}

const apiKey = process.env.UPTIMEROBOT_API_KEY?.trim();
if (!apiKey) {
  console.error("Set UPTIMEROBOT_API_KEY in your shell before running this script.");
  process.exit(1);
}

async function request(endpoint, values) {
  const response = await fetch(`https://api.uptimerobot.com/v2/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ api_key: apiKey, format: "json", ...values }),
  });
  const result = await response.json();
  if (!response.ok || result.stat !== "ok") {
    throw new Error(`UptimeRobot ${endpoint} failed with HTTP ${response.status}.`);
  }
  return result;
}

const current = await request("getMonitors", { logs: "0", response_times: "0" });
const existingUrls = new Set((current.monitors ?? []).map((monitor) => monitor.url));

for (const monitor of monitors) {
  if (existingUrls.has(monitor.url)) {
    console.log(`Already monitored: ${monitor.name}`);
    continue;
  }
  const result = await request("newMonitor", {
    type: "1",
    interval: "300",
    friendly_name: monitor.name,
    url: monitor.url,
  });
  console.log(`Created monitor ${result.monitor?.id ?? ""}: ${monitor.name}`);
}