/**
 * Profile is the facts about Pavel the site presents: name, headline,
 * location, an introduction, how to reach him, where else to find him, whether
 * he is open for work, and his Background — see CONTEXT.md. There is exactly
 * one Profile, and it is not a Role.
 *
 * A `[bracketed]` string is Content Pavel has yet to supply.
 * `test/unit/content.test.ts` fails while one remains, so none can ship.
 */
export interface Education {
  degree: string
  faculty: string
  institution: string
  year: string
}

export interface Profile {
  /** As Pavel writes it. */
  name: string
  /** Pavel's role, shown small next to the name. */
  headline: string
  /** A sharper hook under the headline. */
  tagline: string
  location: string
  /** Two or three lines. Who Pavel works with and why a client should keep reading. */
  intro: string
  /** An optional second line under the intro, for a detail that does not fit there. */
  aside?: string
  email: string
  availability: {
    /** Whether Pavel is currently open for freelance work. */
    open: boolean
    /** The copy shown alongside the open/closed state. */
    label: string
  }
  links: {
    github: string
    linkedin: string
    repo: string
  }
  /** The tools this site is built with, shown in the Colophon. */
  stack: string[]
  background: string[]
  /** What Pavel is working with now, unlike the site's own `stack`. */
  skills: string[]
  education: Education
}

export const profile: Profile = {
  name: 'Pavel Padron',
  headline: 'Frontend engineer',
  tagline:
    'I get frontend projects unstuck: from legacy to shipping, and easy to change after.',
  location: 'Minsk, Belarus',
  intro:
    '20+ years building for the web, now leading the frontend migration of a flagship product at Nordhealth. I build new products from scratch and carry legacy ones forward, so they ship and stay easy to change.',
  email: 'me@ppadron.page',
  availability: {
    open: true,
    label: 'Available for freelance',
  },
  links: {
    github: 'https://github.com/dr46ul',
    linkedin: 'https://www.linkedin.com/in/pavel-padron/',
    repo: 'https://github.com/dr46ul/ppadron.page',
  },
  stack: [
    'vue',
    'nuxt',
    'typescript',
    'tailwind',
    'daisyui',
    'vitest',
    'vercel',
  ],
  background: [
    'Hello there!',
    'My name is Pavel Padron and I\'m a passionate web developer born in Cuba and based in Minsk, Belarus, since 2011.',
    'My journey in web development began when I was in college, where I pursued a degree in computer science. Since then, I\'ve been honing my skills and gaining experience in the field, and I\'m proud to say that I\'ve worked on a variety of exciting projects that have allowed me to expand both my creativity and my technical abilities.',
    'As a front-end web developer, I love the process of taking a design and turning it into a beautiful, functional website. I believe that every website should not only look good, but also be easy to use and navigate. That\'s why I put a strong emphasis on UI/UX in all of my projects.',
    'At some point in my career I have also done some back-end development and project management. I try to constantly learn and experiment with new technologies and techniques to stay up to date with the latest trends in the industry.',
    'When I\'m not coding, you can find me spending time with my family, exploring the city, trying new foods, or playing the Diablo video game. I believe that a balanced lifestyle is key to being happy and productive, both in and outside of work. Moreover, I\'ve been playing with AI tools to generate images/artwork and I find it quite interesting and relaxing.',
    'If you\'re looking for a passionate and experienced web developer and problem solver who works independently, I\'d love to chat with you! Let\'s work together to show your ideas to the world.',
  ],
  skills: [
    'Nuxt 3',
    'Vue 3',
    'TypeScript',
    'ES6+',
    'JavaScript',
    'REST API',
    'HTML5',
    'CSS3',
    'SCSS',
    'Git/GitHub',
    'Figma',
  ],
  education: {
    degree: 'Bachelor\'s degree in Computer Science',
    faculty: 'Faculty of Mathematics, Physics and Computer Science',
    institution: 'Universidad Central de Las Villas, Cuba',
    year: '2005',
  },
}
