import { readonly, ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

// index.html sets data-theme before first paint (saved choice, else the OS preference)
const theme = ref<Theme>(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

watch(theme, (value) => {
  document.documentElement.dataset.theme = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  }
  catch {
    // Storage blocked: the choice just won't survive a reload
  }
})

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

export function useTheme() {
  return { theme: readonly(theme), toggleTheme }
}
