export type ArgMap = Record<string, string>;

export function parseArgs(argv: string[]): ArgMap {
  const args: ArgMap = {};

  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw || !raw.startsWith("--")) {
      continue;
    }

    const key = raw.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = "true";
    }
  }

  return args;
}

export function parseNumberList(value: string | undefined, fallback: number[]): number[] {
  if (value === undefined) {
    return fallback;
  }

  if (value.includes(":")) {
    const parts = value.split(":");
    if (parts.length !== 3) {
      throw new Error("Range format must be start:end:step.");
    }

    const start = Number(parts[0]);
    const end = Number(parts[1]);
    const step = Number(parts[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0) {
      throw new Error("Invalid range values for start:end:step.");
    }

    const values: number[] = [];
    for (let v = start; v <= end + 1e-12; v += step) {
      values.push(Number(v.toFixed(10)));
    }

    return values;
  }

  const list = value.split(",").map((entry) => Number(entry));
  if (list.some((num) => !Number.isFinite(num))) {
    throw new Error("List values must be numbers.");
  }
  return list;
}

export function parseInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error("Expected an integer value.");
  }
  return parsed;
}

export function parseFloatValue(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Expected a numeric value.");
  }
  return parsed;
}
