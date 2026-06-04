// One-time: download the 48 national-team kit PNGs from FIFA's public feed into
// app/public/kits/{id}.png. Run: `node app/scripts/fetch-kits.mjs`
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "kits");
const BASE = "https://play.fifa.com/media/image/fantasy/squads";

await mkdir(outDir, { recursive: true });
let ok = 0;
for (let id = 1; id <= 48; id++) {
  const res = await fetch(`${BASE}/${id}.png`);
  if (!res.ok) { console.error(`kit ${id}: HTTP ${res.status}`); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(outDir, `${id}.png`), buf);
  ok++;
}
console.log(`downloaded ${ok}/48 kits to ${outDir}`);
