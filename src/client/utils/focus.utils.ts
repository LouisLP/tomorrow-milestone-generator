const MAIN_ID = 'main'

/** Focuses the page's h1, or `<main>` while the page has none yet. */
export function focusPageHeading() {
  const main = document.getElementById(MAIN_ID)
  const heading = main?.querySelector<HTMLElement>('h1')
  if (heading && !heading.hasAttribute('tabindex'))
    heading.tabIndex = -1
  ;(heading ?? main)?.focus()
}

/** For pages whose h1 renders late: takes focus over from `<main>`, never from the user. */
export function focusPageHeadingIfParked() {
  if (document.activeElement?.id === MAIN_ID)
    focusPageHeading()
}
