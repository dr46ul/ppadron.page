/**
 * The Visitor's time zone, the only place it is read for a date. The language
 * is the Session's Locale, never the browser's (ADR-0014). The prerendered page
 * has no Visitor, so until it is mounted this is the build's UTC; read any
 * earlier, the browser's answer would hydrate over different HTML.
 */
export function useDateContext() {
  const timeZone = ref('UTC')

  onMounted(() => {
    timeZone.value = new Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  return readonly(timeZone)
}
