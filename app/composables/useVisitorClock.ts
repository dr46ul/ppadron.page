/**
 * Where and when the Visitor is: their language, their time zone and their
 * clock. The prerendered page has no Visitor, so until it is mounted this is
 * the build — English, UTC and the moment it was built. Read any earlier, the
 * browser's answer would hydrate over different HTML.
 */
export function useVisitorClock(builtAt: number) {
  const clock = ref({ ...buildLocale, now: builtAt })

  onMounted(() => {
    clock.value = {
      locale: pickLocale(navigator.languages),
      timeZone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
      now: Date.now(),
    }
  })

  return readonly(clock)
}
