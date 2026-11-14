import type { CommandOutput, MetaCommand, SessionCommand } from '~/composables/useSession'

/**
 * What a Command does, in the Session's Locale. A Command's name is an
 * identifier and never translated, so its label is found by what identifies
 * it: the Output for a Command that prints, the name for a meta command.
 */
export function useCommandLabel() {
  const { t } = useI18n()

  const printing = computed(() => ({
    whoami: t('commands.whoami'),
    background: t('commands.background'),
    experience: t('commands.experience'),
    recommendations: t('commands.recommendations'),
    contact: t('commands.contact'),
    colophon: t('commands.colophon'),
    help: t('commands.help'),
  }) satisfies Record<CommandOutput, string>)

  const meta = computed(() => ({
    reset: t('commands.reset'),
    clear: t('commands.clear'),
    theme: t('commands.theme'),
  }) satisfies Record<MetaCommand['cmd'], string>)

  return (command: SessionCommand | MetaCommand) =>
    'output' in command
      ? printing.value[command.output]
      : meta.value[command.cmd]
}
