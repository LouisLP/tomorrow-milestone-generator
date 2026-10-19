import { watch } from 'vue'
import { createI18n } from 'vue-i18n'
import challengesDe from '../features/challenges/locales/de'
import challengesEn from '../features/challenges/locales/en'
import challengesIt from '../features/challenges/locales/it'
import reviewDe from '../features/review/locales/de'
import reviewEn from '../features/review/locales/en'
import reviewIt from '../features/review/locales/it'
import commonDe from './locales/common/de'
import commonEn from './locales/common/en'
import commonIt from './locales/common/it'

/** Supported locales with their native names (shown as-is in every UI language). */
export const LOCALES = {
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
} as const

export type Locale = keyof typeof LOCALES

const STORAGE_KEY = 'locale'

const en = { ...commonEn, ...challengesEn, ...reviewEn }

export type MessageSchema = typeof en

const messages: Record<Locale, MessageSchema> = {
  en,
  de: { ...commonDe, ...challengesDe, ...reviewDe },
  it: { ...commonIt, ...challengesIt, ...reviewIt },
}

const dateFormats = {
  date: { dateStyle: 'medium' },
  dateTime: { dateStyle: 'medium', timeStyle: 'short' },
} as const

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && Object.hasOwn(LOCALES, value)
}

function readSavedLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isLocale(saved) ? saved : 'en'
  }
  catch {
    return 'en'
  }
}

function saveLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  }
  catch {
    // Storage blocked: the choice just won't survive a reload.
  }
}

export const i18n = createI18n<[MessageSchema], Locale, false>({
  legacy: false,
  locale: readSavedLocale(),
  fallbackLocale: 'en',
  messages,
  datetimeFormats: { en: dateFormats, de: dateFormats, it: dateFormats },
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
})

/** Switches the UI language live. */
export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
}

// Every locale change, however it happens, is persisted and reflected in <html lang>.
watch(i18n.global.locale, (locale) => {
  document.documentElement.lang = locale
  saveLocale(locale)
}, { immediate: true })

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
  export interface DefineDateTimeFormat {
    date: Intl.DateTimeFormatOptions
    dateTime: Intl.DateTimeFormatOptions
  }
}
