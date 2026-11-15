import type { Git } from '../../.claude/hooks/guard-git'
import { describe, expect, it } from 'vitest'
import { judge } from '../../.claude/hooks/guard-git'

const ROOT = '/repo'

/** A repository at `/repo` whose refs are `main` and `feat/x`, dirty or clean as the test needs. */
function git({ dirty = false } = {}): Git {
  return {
    root: () => ROOT,
    dirty: () => dirty,
    isCommit: (_cwd, ref) => [
      'main',
      'feat/x',
      'origin/main',
      'HEAD',
    ].includes(ref),
  }
}

function decision(command: string, options: { dirty?: boolean, cwd?: string } = {}) {
  return judge(command, options.cwd ?? ROOT, git(options))?.decision
}

describe('git worktree add', () => {
  it('lets a worktree under .worktrees/ through', () => {
    expect(decision('git worktree add .worktrees/logo -b feat/logo origin/main')).toBeUndefined()
  })

  it('refuses a sibling of the checkout', () => {
    expect(decision('git worktree add -b feat/logo ../repo-logo origin/main')).toBe('deny')
  })

  it('refuses .claude/worktrees/, Claude Code\'s own default', () => {
    expect(decision('git worktree add .claude/worktrees/logo')).toBe('deny')
  })

  it('refuses a path that only starts with the folder\'s name', () => {
    expect(decision('git worktree add .worktrees-old/logo')).toBe('deny')
  })

  it('resolves the path from inside a worktree against the main checkout', () => {
    expect(decision('git worktree add ../logo', { cwd: '/repo/.worktrees/other' })).toBeUndefined()
  })

  it('follows a cd earlier in the same command', () => {
    expect(decision('cd /tmp && git worktree add logo')).toBe('deny')
  })

  it('follows git -C', () => {
    expect(decision('git -C /repo/.worktrees worktree add logo')).toBeUndefined()
  })

  it('reads the path after the options that take a value', () => {
    expect(decision('git worktree add --lock --reason "keep it" -B feat/logo /tmp/logo')).toBe('deny')
  })

  it('reads a quoted path as one word', () => {
    expect(decision('git worktree add "/tmp/my logo"')).toBe('deny')
  })

  it('reads the path after --', () => {
    expect(decision('git worktree add -- /tmp/logo')).toBe('deny')
  })

  it('finds git behind an rtk prefix and an environment variable', () => {
    expect(decision('GIT_TRACE=0 rtk git worktree add /tmp/logo')).toBe('deny')
  })

  it('names the place a worktree goes in its refusal', () => {
    expect(judge('git worktree add /tmp/logo', ROOT, git())?.reason).toContain('.worktrees/<name>')
  })

  it('leaves the other worktree commands alone', () => {
    expect(['list', 'remove /tmp/logo', 'prune'].map(rest => decision(`git worktree ${rest}`)))
      .toEqual([undefined, undefined, undefined])
  })
})

describe('switching branches', () => {
  it('asks before a switch would carry uncommitted changes', () => {
    expect([
      'git switch main',
      'git switch -c feat/logo',
      'git checkout main',
      'git checkout -b feat/logo',
      'git checkout --detach',
    ]
      .map(command => decision(command, { dirty: true })))
      .toEqual(['ask', 'ask', 'ask', 'ask', 'ask'])
  })

  it('switches freely on a clean tree', () => {
    expect(decision('git switch main')).toBeUndefined()
  })

  it('finds the switch anywhere in a chain', () => {
    expect(decision('git fetch -q origin; git status --short | head && git switch -c feat/logo origin/main', { dirty: true })).toBe('ask')
  })

  it('says why, and what to do instead, when it asks', () => {
    const reason = judge('git switch main', ROOT, git({ dirty: true }))?.reason
    expect(['uncommitted', '.worktrees/'].filter(word => !reason?.includes(word))).toEqual([])
  })

  it('leaves a checkout that restores files alone', () => {
    expect([
      'git checkout -- app.vue',
      'git checkout main -- app.vue',
      'git checkout -p',
      'git checkout .',
    ]
      .map(command => decision(command, { dirty: true })))
      .toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
      ])
  })
})

describe('everything else', () => {
  it('lets other commands through', () => {
    expect([
      'ls',
      'git status',
      'git commit -m "switch main"',
      'echo git switch main',
      '',
    ].map(command => decision(command, { dirty: true })))
      .toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ])
  })
})
