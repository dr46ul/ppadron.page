/**
 * Moves an issue's item on the project board to a Status column:
 *
 *   pnpm board review <issue>
 *
 * `review` is the hand-off: run it when the work is ready for Pavel to read.
 * Needs the project scopes on the gh token; see docs/agents/issue-tracker.md.
 */
import { execFileSync } from 'node:child_process'
import process from 'node:process'

const OWNER = 'dr46ul'
const PROJECT = '8'
const COLUMNS = { review: 'Review' }

const [column, issue] = process.argv.slice(2)
const status = COLUMNS[column]
if (!status || !/^\d+$/.test(issue ?? '')) {
  console.error(`usage: pnpm board <${Object.keys(COLUMNS).join('|')}> <issue number>`)
  process.exit(1)
}

function gh(...args) {
  return JSON.parse(execFileSync('gh', args, { encoding: 'utf8' }))
}

const project = gh('project', 'view', PROJECT, '--owner', OWNER, '--format', 'json')
const { fields } = gh('project', 'field-list', PROJECT, '--owner', OWNER, '--format', 'json')
const field = fields.find(({ name }) => name === 'Status')
const option = field?.options.find(({ name }) => name === status)
if (!option) {
  console.error(`The board has no Status "${status}".`)
  process.exit(1)
}

const { items } = gh('project', 'item-list', PROJECT, '--owner', OWNER, '--limit', '200', '--format', 'json')
const item = items.find(({ content }) => content?.number === Number(issue))
if (!item) {
  console.error(`Issue #${issue} is not on the board.`)
  process.exit(1)
}

execFileSync('gh', [
  'project',
  'item-edit',
  '--project-id',
  project.id,
  '--id',
  item.id,
  '--field-id',
  field.id,
  '--single-select-option-id',
  option.id,
], { stdio: 'inherit' })
console.log(`#${issue} is now "${status}".`)
