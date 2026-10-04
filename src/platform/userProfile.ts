// The on-device profile ("like an account", but nothing leaves the phone).
// Stored in localStorage through the safe store; validated on every read.
import { z } from 'zod';
import { PROFILE_IDS, type ProfileId } from '../domain/profiles.ts';
import { STORAGE_KEYS, type KeyValueStore } from './storage.ts';

export const NAME_MAX_LENGTH = 40;

const userProfileSchema = z.object({
  version: z.literal(1),
  /** Optional first name, only to greet the user. */
  name: z.string().trim().max(NAME_MAX_LENGTH).default(''),
  profile: z.enum(PROFILE_IDS),
  tourDone: z.boolean().default(false),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export function createUserProfile(name: string, profile: ProfileId): UserProfile {
  return { version: 1, name: name.trim().slice(0, NAME_MAX_LENGTH), profile, tourDone: false };
}

/** null when there is no profile yet, or when stored data is unreadable (then onboarding runs again). */
export function readUserProfile(store: KeyValueStore): UserProfile | null {
  const raw = store.read(STORAGE_KEYS.user);
  if (raw === null) return null;
  try {
    const parsed = userProfileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeUserProfile(store: KeyValueStore, profile: UserProfile): boolean {
  return store.write(STORAGE_KEYS.user, JSON.stringify(profile));
}

/** "Borrar mis datos": removes every value Evacua keeps on the device. */
export function deleteAllLocalData(store: KeyValueStore): void {
  for (const key of Object.values(STORAGE_KEYS)) store.remove(key);
}
