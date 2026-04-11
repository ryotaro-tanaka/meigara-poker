import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(__dirname, "../../data/listed_domestic_complete_corpnum_industries_utf8.csv");
const databaseName = process.env.D1_DATABASE_NAME ?? "meigara-poker";
const batchSize = 200;

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function toSqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function runWrangler(args, inputFile) {
  const result = spawnSync("npx", ["wrangler", ...args], {
    stdio: "inherit",
    cwd: resolve(__dirname, ".."),
    env: process.env,
  });

  if (result.status !== 0) {
    fail(`wrangler command failed for ${inputFile}`);
  }
}

const raw = readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);

if (lines.length < 2) {
  fail("CSV is empty or missing header.");
}

const header = parseCsvLine(lines[0]);
const requiredColumns = ["ＥＤＩＮＥＴコード", "提出者名", "提出者業種", "提出者法人番号"];

for (const name of requiredColumns) {
  if (!header.includes(name)) {
    fail(`Missing required column: ${name}`);
  }
}

const indices = Object.fromEntries(requiredColumns.map((name) => [name, header.indexOf(name)]));
const rows = [];

for (let lineNumber = 2; lineNumber <= lines.length; lineNumber += 1) {
  const row = parseCsvLine(lines[lineNumber - 1]);
  const edinetCode = row[indices["ＥＤＩＮＥＴコード"]]?.trim() ?? "";
  const name = row[indices["提出者名"]]?.trim() ?? "";
  const industry = row[indices["提出者業種"]]?.trim() ?? "";
  const corporateNumber = row[indices["提出者法人番号"]]?.trim() ?? "";

  if (!edinetCode) {
    fail(`Missing edinet_code at CSV line ${lineNumber}`);
  }

  if (!name || !industry || !corporateNumber) {
    fail(`Missing required value at CSV line ${lineNumber}`);
  }

  if (!/^\d+$/.test(corporateNumber)) {
    fail(`corporate_number must be numeric at CSV line ${lineNumber}`);
  }

  const lastDigit = Number(corporateNumber.at(-1));

  if (!Number.isInteger(lastDigit) || lastDigit < 0 || lastDigit > 9) {
    fail(`corporate_number_last_digit must be 0-9 at CSV line ${lineNumber}`);
  }

  rows.push({
    edinetCode,
    name,
    industry,
    corporateNumber,
    lastDigit,
  });
}

const tempDir = mkdtempSync(join(tmpdir(), "meigara-poker-import-"));

try {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = batch
      .map((row) =>
        `(${toSqlString(row.edinetCode)}, ${toSqlString(row.name)}, ${toSqlString(row.industry)}, ${toSqlString(row.corporateNumber)}, ${row.lastDigit})`,
      )
      .join(",\n");

    const sql = [
      "INSERT OR REPLACE INTO stocks (edinet_code, name, industry, corporate_number, corporate_number_last_digit)",
      "VALUES",
      `${values};`,
    ].join("\n");

    const filePath = join(tempDir, `batch-${String(i / batchSize + 1).padStart(3, "0")}.sql`);
    writeFileSync(filePath, sql, "utf8");

    runWrangler(["d1", "execute", databaseName, "--remote", `--file=${filePath}`], filePath);
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`Imported ${rows.length} rows into ${databaseName}.`);
console.log("Suggested verification commands:");
console.log(
  `npx wrangler d1 execute ${databaseName} --remote --command="SELECT COUNT(*) AS count, COUNT(DISTINCT edinet_code) AS distinct_count FROM stocks;"`,
);
console.log(
  `npx wrangler d1 execute ${databaseName} --remote --command="SELECT industry, COUNT(*) AS count FROM stocks GROUP BY industry ORDER BY count DESC;"`,
);
