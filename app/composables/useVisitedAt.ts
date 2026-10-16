/**
 * When the Visitor arrived, read once on mount. Before that it is the build,
 * the only time the prerendered page can know.
 */
export function useVisitedAt(builtAt: number) {
  const visitedAt = ref(builtAt)

  onMounted(() => {
    visitedAt.value = Date.now()
  })

  return readonly(visitedAt)
}
