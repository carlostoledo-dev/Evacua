import type { Locale } from '../locales.ts';
import type { Dictionary } from '../translate.ts';
import { en } from './en.ts';
import { esCL } from './es-CL.ts';

export const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = {
  'es-CL': esCL,
  en,
};
