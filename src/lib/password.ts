import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const COST = 16_384;

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N: COST, r: 8, p: 1 }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Returns `scrypt$N$salt$hash` so the cost can be raised later without breaking old hashes. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${COST}$${salt.toString("base64")}$${key.toString("base64")}`;
}

/** Synchronous variant used only while seeding the in-memory store at startup. */
export function hashPasswordSync(password: string) {
  const salt = randomBytes(16);
  const key = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH, { N: COST, r: 8, p: 1 });
  return `scrypt$${COST}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, , saltValue, hashValue] = stored.split("$");
  if (scheme !== "scrypt" || !saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, "base64");
  const actual = await derive(password, Buffer.from(saltValue, "base64"));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

