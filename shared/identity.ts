import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english.js"
import { getPublicKeyAsync } from "@noble/ed25519"
import { bytesToHex } from "@noble/hashes/utils.js"

export type Identity = {
  publicKey: string
  secretKey: string
  mnemonic: string
  displayName: string
  createdAt: number
}

export function normalizeMnemonic(phrase: string): string {
  return phrase.trim().toLowerCase().split(/\s+/).join(" ")
}

export function mnemonicIsValid(phrase: string): boolean {
  return validateMnemonic(normalizeMnemonic(phrase), wordlist)
}

/** BIP-39 seed, first 32 bytes used as the Ed25519 seed. Empty passphrase. */
export async function identityFromMnemonic(phrase: string, displayName = "", createdAt = Date.now()): Promise<Identity> {
  const mnemonic = normalizeMnemonic(phrase)
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error("That recovery phrase is not valid")
  }
  const seed = mnemonicToSeedSync(mnemonic).slice(0, 32)
  const publicKey = bytesToHex(await getPublicKeyAsync(seed))
  return {
    publicKey,
    secretKey: bytesToHex(seed),
    mnemonic,
    displayName,
    createdAt,
  }
}

export async function createIdentity(): Promise<Identity> {
  return identityFromMnemonic(generateMnemonic(wordlist, 128))
}
