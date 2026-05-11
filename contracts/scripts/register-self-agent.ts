/**
 * Self Agent ID registration via Celo Agent Visa — `wallet-free` mode.
 *
 * Self generates a fresh agent EVM address; you (the human) attest with the
 * Self app by scanning a QR. Two-step flow:
 *
 *   1. POST /api/agent/register with { mode: "wallet-free", network: "mainnet" }
 *      → returns sessionToken + qrData (scanUrl, deepLink, qrImageBase64).
 *   2. Human opens scanUrl (computer) or deepLink (phone) → Self app does
 *      the on-chain registration after passport attestation.
 *   3. GET /api/agent/register/status with `Authorization: Bearer <sessionToken>`
 *      until stage === "completed". Response contains agentId + agentAddress.
 *
 * Run: cd contracts && pnpm tsx scripts/register-self-agent.ts
 * (or via hardhat run if you prefer — no chain access is needed.)
 */

const API_BASE = "https://app.ai.self.xyz/api/agent";
const NETWORK = "mainnet";

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}\n${text.slice(0, 500)}`);
  return JSON.parse(text);
}

async function main() {
  console.log("=== Self Agent ID — Celo Agent Visa (wallet-free mode) ===\n");

  // 1. Open registration session
  console.log("→ Creating session...");
  const reg = (await fetchJson(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "wallet-free", network: NETWORK }),
  })) as {
    sessionToken: string;
    stage: string;
    qrData?: { scanUrl?: string; deepLink?: string; agentAddress?: string };
  };

  console.log("Stage:", reg.stage);
  if (reg.qrData?.agentAddress) {
    console.log("Self will register agent address:", reg.qrData.agentAddress);
  }
  if (reg.qrData?.scanUrl) {
    console.log("\n📷 Open this URL in a browser and scan with the Self app:");
    console.log(reg.qrData.scanUrl);
  }
  if (reg.qrData?.deepLink) {
    console.log("\nOr on the same phone with Self installed, tap this:");
    console.log(reg.qrData.deepLink);
  }

  // 2. Poll status (Bearer auth)
  console.log("\n→ Polling status...");
  const start = Date.now();
  const TIMEOUT_MS = 25 * 60 * 1000;
  let last = "";
  while (Date.now() - start < TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, 4000));
    let st: { stage: string; agentId?: number; agentAddress?: string };
    try {
      st = (await fetchJson(`${API_BASE}/register/status`, {
        headers: { Authorization: `Bearer ${reg.sessionToken}` },
      })) as typeof st;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`status error: ${msg.slice(0, 120)} — retrying`);
      continue;
    }
    const line = `stage=${st.stage} agentId=${st.agentId ?? "(pending)"} addr=${
      st.agentAddress ?? "(pending)"
    }`;
    if (line !== last) {
      console.log(line);
      last = line;
    }
    if (st.stage === "completed") {
      console.log("\n✅ REGISTERED");
      console.log("Self Agent ID:", st.agentId);
      console.log("Self Agent address:", st.agentAddress);
      return;
    }
    if (st.stage === "failed" || st.stage === "expired") {
      console.log(`\n❌ Registration ${st.stage}.`);
      return;
    }
  }
  console.log("\n⏱️  Timeout — session expired without completion.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
