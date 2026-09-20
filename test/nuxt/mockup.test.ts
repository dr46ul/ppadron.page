import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import MockupBrowser from '~/components/mockup/Browser.vue'
import MockupCode from '~/components/mockup/Code.vue'
import MockupCodeLine from '~/components/mockup/CodeLine.vue'
import MockupPhone from '~/components/mockup/Phone.vue'
import MockupWindow from '~/components/mockup/Window.vue'

describe('MockupWindow', () => {
  it('uses the mockup-window class', async () => {
    const component = await mountSuspended(MockupWindow)

    expect(component.classes()).toContain('mockup-window')
  })

  it('renders slot content', async () => {
    const component = await mountSuspended(MockupWindow, {
      slots: { default: () => 'Window content' },
    })

    expect(component.text()).toContain('Window content')
  })
})

describe('MockupBrowser', () => {
  it('shows the default url', async () => {
    const component = await mountSuspended(MockupBrowser)

    expect(component.get('.input').text()).toBe('https://...')
  })

  it('shows a custom url', async () => {
    const component = await mountSuspended(MockupBrowser, {
      props: { url: 'https://ppadron.com' },
    })

    expect(component.get('.input').text()).toBe('https://ppadron.com')
  })

  it('shows a content border by default', async () => {
    const component = await mountSuspended(MockupBrowser)

    expect(component.find('.grid').classes()).toContain('border-t')
  })

  it('hides the content border when hideBorder is true', async () => {
    const component = await mountSuspended(MockupBrowser, {
      props: { hideBorder: true },
    })

    expect(component.find('.grid').classes()).not.toContain('border-t')
  })
})

describe('MockupCodeLine', () => {
  it('uses > as the default prefix', async () => {
    const component = await mountSuspended(MockupCodeLine)

    expect(component.get('pre').attributes('data-prefix')).toBe('>')
  })

  it('renders slot content', async () => {
    const component = await mountSuspended(MockupCodeLine, {
      slots: { default: () => 'npm install' },
    })

    expect(component.get('code').text()).toBe('npm install')
  })

  it('omits the prefix when hidePrefix is true', async () => {
    const component = await mountSuspended(MockupCodeLine, {
      props: { hidePrefix: true, prefix: '$' },
    })

    expect(component.get('pre').attributes('data-prefix')).toBeUndefined()
  })
})

describe('MockupCode', () => {
  it('renders a line for each item', async () => {
    const component = await mountSuspended(MockupCode, {
      props: {
        lines: [{ content: 'git status' }, { content: 'clean working tree' }],
      },
    })

    expect(component.findAll('pre')).toHaveLength(2)
  })

  it('renders each line content', async () => {
    const component = await mountSuspended(MockupCode, {
      props: {
        lines: [{ content: 'git status' }, { content: 'clean working tree' }],
      },
    })

    expect(component.findAll('code').map((line) => line.text())).toEqual([
      'git status',
      'clean working tree',
    ])
  })

  it('applies a custom prefix to a line', async () => {
    const component = await mountSuspended(MockupCode, {
      props: {
        lines: [{ content: 'git status', prefix: '$' }],
      },
    })

    expect(component.get('pre').attributes('data-prefix')).toBe('$')
  })
})

describe('MockupPhone', () => {
  it('uses the mockup-phone class', async () => {
    const component = await mountSuspended(MockupPhone)

    expect(component.classes()).toContain('mockup-phone')
  })

  it('renders slot content', async () => {
    const component = await mountSuspended(MockupPhone, {
      slots: { default: () => 'Phone screen' },
    })

    expect(component.text()).toContain('Phone screen')
  })

  it('applies display classes', async () => {
    const component = await mountSuspended(MockupPhone, {
      props: { displayClasses: 'bg-base-200' },
    })

    expect(component.get('.mockup-phone-display').classes()).toContain(
      'bg-base-200',
    )
  })
})
