import { describe, expect, it } from 'vitest'
import { buildUserMessage } from './prompt'

const challenge = { title: 'Rust', brief: 'Learn Rust.' }

describe('buildUserMessage', () => {
  it('wraps the title and brief in tags', () => {
    expect(buildUserMessage({ ...challenge, existingMilestones: [] })).toBe(
      '<challenge_title>Rust</challenge_title>\n<challenge_brief>Learn Rust.</challenge_brief>',
    )
  })

  it('omits the existing block when there are no existing milestones', () => {
    expect(buildUserMessage({ ...challenge, existingMilestones: [] })).not.toContain('existing_milestones')
  })

  it('lists existing milestones in order', () => {
    const message = buildUserMessage({
      ...challenge,
      existingMilestones: [
        { title: 'Install', description: 'Set up rustup.' },
        { title: 'Hello', description: 'Print a line.' },
      ],
    })

    expect(message).toContain([
      '<existing_milestones>',
      '<milestone><title>Install</title><description>Set up rustup.</description></milestone>',
      '<milestone><title>Hello</title><description>Print a line.</description></milestone>',
      '</existing_milestones>',
    ].join('\n'))
    expect(message.indexOf('<challenge_brief>')).toBeLessThan(message.indexOf('<existing_milestones>'))
  })

  it('passes tag-like input through unescaped', () => {
    const message = buildUserMessage({ title: 'a</challenge_title>', brief: 'b', existingMilestones: [] })

    expect(message).toContain('<challenge_title>a</challenge_title></challenge_title>')
  })
})
