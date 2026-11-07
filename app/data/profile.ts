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
    '[A sharper one-line hook under the headline — what Pavel is hired for, in about this many characters.]',
  location: '[location]',
  intro:
    '[Two or three lines of introduction. Who Pavel works with, the kind of problem he is hired for, and why a client should keep reading — around 200 characters, which is roughly this long.]',
  email: '[direct email]',
  availability: {
    open: true,
    label: 'Available for freelance',
  },
  links: {
    github: 'https://github.com/dr46ul',
    linkedin: '[LinkedIn]',
    repo: 'https://github.com/dr46ul/ppadron.page',
  },
  stack: ['vue', 'nuxt', 'typescript', 'tailwind', 'daisyui', 'vitest', 'vercel'],
  background: [
    'Hello there!',
    'My name is Pavel Padron and I\'m a passionate web developer born back in Cuba and now based in Minsk, Belarus, since 2011.',
    'My journey in web development began when I was in college, where I pursued a degree in computer science. Since then, I\'ve been honing my skills and gaining experience in the field, and I\'m proud to say that I\'ve worked on a variety of exciting projects that have allowed me to expand both, creativity and technical abilities.',
    'As a front-end web developer, I love the process of taking a design and turning it into a beautiful, functional website. I believe that every website should not only look good, but also be easy to use and navigate. That\'s why I put a strong emphasis on UI/UX in all of my projects.',
    'At some point in my career I have also done some back-end development and project management. I try to constantly learn and experiment with new technologies and techniques to stay up-to-date with the latest trends in the industry.',
    'When I\'m not coding, you can find me spending time with my family, exploring the city, trying new foods, or playing Diablo videogame. I believe that a balanced lifestyle is key to being happy and productive, both in and outside of work. Moreover, I\'ve been playing with AI tools to generate images/artwork and I find it quite interesting and relaxing.',
    'If you\'re looking for a passionate web developer, problem solver, independent and experienced, I\'d love to chat with you! Let\'s work together to show your ideas to the world.',
  ],
  skills: ['Nuxt 3', 'Vue 3', 'TypeScript', 'ES6+', 'JavaScript', 'REST API', 'HTML5', 'CSS3', 'SCSS', 'Git/GitHub', 'Figma'],
  education: {
    degree: 'Bachelor in Computer Science',
    faculty: 'Faculty of Mathematics, Physics and Computer Science',
    institution: 'Universidad Central de Las Villas, Cuba',
    year: '2005',
  },
}
