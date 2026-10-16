/**
 * The Visitor's language and time zone, the only place either is read for a
 * date. The prerendered page has no Visitor, so until it is mounted this is
 * the build's English and UTC; read any earlier, the browser's answer would
 * hydrate over different HTML. When an i18n library arrives, the locale comes
 * from its current one instead of the browser.
 */
export function useDateContext() {
  const context = ref(buildDateContext)

  onMounted(() => {
    context.value = {
      locale: pickLocale(navigator.languages),
      timeZone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  })

  return readonly(context)
}
