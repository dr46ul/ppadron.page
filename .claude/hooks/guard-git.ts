/**
 * Claude Code PreToolUse hook on Bash. The WorktreeCreate hook only sees
 * worktrees Claude Code makes itself, so a `git worktree add` typed into Bash
 * is checked here against docs/agents/worktrees.md. A branch switch is checked
 * too: Pavel keeps uncommitted work in the main checkout while a session runs,
 * and switching carries it onto whatever branch the agent moves to.
 *
 * Node runs this file directly, types stripped.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export interface Git {
  /** The main checkout, even from inside a worktree. */
  root: (cwd: string) => string
  dirty: (cwd: string) => boolean
  isCommit: (cwd: string, ref: string) => boolean
}

export interface Verdict {
  decision: 'deny' | 'ask'
  reason: string
}

const SEPARATORS = new Set([';', '&', '|', '&&', '||', '\n'])

/** Shell words, with each separator as a word of its own. Quotes group; nothing is expanded. */
function words(command: string) {
  const out: string[] = []
  let word: string | undefined
  let quote: string | undefined
  for (let i = 0; i < command.length; i++) {
    const char = command[i]!
    if (quote) {
      if (char === quote)
        quote = undefined
      else word += char
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      word ??= ''
      continue
    }
    if (char === '\\' && i + 1 < command.length) {
      word = (word ?? '') + command[++i]
      continue
    }
    const pair = command.slice(i, i + 2)
    const separator = SEPARATORS.has(pair) ? pair : SEPARATORS.has(char) ? char : undefined
    if (separator || /\s/.test(char)) {
      if (word !== undefined)
        out.push(word)
      word = undefined
      if (separator) {
        out.push(separator)
        i += separator.length - 1
      }
      continue
    }
    word = (word ?? '') + char
  }
  if (word !== undefined)
    out.push(word)
  return out
}

function segments(command: string) {
  const all: string[][] = [[]]
  for (const word of words(command)) {
    if (SEPARATORS.has(word))
      all.push([])
    else all.at(-1)!.push(word)
  }
  return all.filter(segment => segment.length > 0)
}

/** Positional arguments, skipping options and the values of the options listed as taking one. */
function positionals(args: string[], valued: string[]) {
  const out: string[] = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    if (arg === '--')
      return [...out, ...args.slice(i + 1)]
    if (valued.includes(arg))
      i++
    else if (!arg.startsWith('-'))
      out.push(arg)
  }
  return out
}

function worktreeAdd(args: string[], cwd: string, git: Git): Verdict | undefined {
  const [path] = positionals(args, ['-b', '-B', '--reason'])
  if (!path)
    return undefined
  const home = resolve(git.root(cwd), '.worktrees')
  const inside = relative(home, resolve(cwd, path))
  if (inside && !inside.startsWith('..') && !isAbsolute(inside))
    return undefined
  return {
    decision: 'deny',
    reason: `Worktrees go under ${home}/<name>, and nowhere else (docs/agents/worktrees.md): git worktree add .worktrees/<name> -b <branch> origin/main`,
  }
}

function switchesBranch(subcommand: string, args: string[], cwd: string, git: Git) {
  if (subcommand === 'switch')
    return true
  if (args.some(arg => ['--', '-p', '--patch'].includes(arg)))
    return false
  if (args.some(arg => ['-b', '-B', '--orphan', '--detach'].includes(arg)))
    return true
  const refs = positionals(args, [])
  return refs.length === 1 && git.isCommit(cwd, refs[0]!)
}

const CARRIES = {
  decision: 'ask',
  reason: 'The working tree has uncommitted changes, and switching branches carries them along. If they are not this task\'s, leave them where they are and work in a worktree under .worktrees/ (docs/agents/worktrees.md).',
} satisfies Verdict

export function judge(command: string, cwd: string, git: Git): Verdict | undefined {
  let here = cwd
  for (const segment of segments(command)) {
    let [word, ...rest] = segment
    if (word === 'cd' && rest[0]) {
      here = resolve(here, rest[0])
      continue
    }
    while (word && /^\w+=/.test(word))
      [word, ...rest] = rest
    if (word === 'rtk')
      [word, ...rest] = rest
    if (word !== 'git')
      continue

    let at = here
    while (rest[0]?.startsWith('-')) {
      const option = rest.shift()!
      if (option === '-C')
        at = resolve(at, rest.shift() ?? '.')
      else if (option === '-c')
        rest.shift()
    }
    const [subcommand, ...args] = rest

    const verdict = subcommand === 'worktree' && args[0] === 'add'
      ? worktreeAdd(args.slice(1), at, git)
      : (subcommand === 'switch' || subcommand === 'checkout')
          && switchesBranch(subcommand, args, at, git) && git.dirty(at)
          ? CARRIES
          : undefined
    if (verdict)
      return verdict
  }
  return undefined
}

const repository: Git = {
  root: cwd => dirname(execFileSync('git', ['-C', cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' }).trim()),
  dirty: cwd => execFileSync('git', ['-C', cwd, 'status', '--porcelain'], { encoding: 'utf8' }).trim() !== '',
  isCommit: (cwd, ref) => {
    try {
      execFileSync('git', ['-C', cwd, 'rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { stdio: 'ignore' })
      return true
    }
    catch {
      return false
    }
  },
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // A guard that cannot read its input lets the call through: blocking every
  // Bash call over a hook bug costs more than one unchecked command.
  try {
    const input = JSON.parse(readFileSync(0, 'utf8'))
    const verdict = judge(String(input.tool_input?.command ?? ''), String(input.cwd ?? process.cwd()), repository)
    if (verdict) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: verdict.decision,
          permissionDecisionReason: verdict.reason,
        },
      }))
    }
  }
  catch {}
}
