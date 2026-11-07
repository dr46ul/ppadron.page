/**
 * Recommendations are verbatim quotes from former colleagues and managers,
 * taken from LinkedIn and attributed by name, title and company. They never
 * come from freelance clients, and the page says so plainly rather than
 * letting a visitor infer client references.
 *
 * A `[bracketed]` string is Content Pavel has yet to supply.
 * `test/unit/content.test.ts` fails while one remains, so none can ship.
 */
export interface Recommendation {
  /**
   * The quote, verbatim, spelling included, in the paragraphs its author wrote.
   * Never paraphrased, never trimmed for fit.
   */
  quote: string[]
  name: string
  title: string
  company: string
}

export const recommendations: Recommendation[] = [
  {
    quote: [
      '[Verbatim LinkedIn recommendation, pending confirmation: the previous site\'s text follows Liudmila Kazakova\'s almost sentence by sentence.]',
    ],
    name: 'Yarieldis Claro Soto',
    title: 'Senior Developer',
    company: 'Procyon Soluciones',
  },
  {
    quote: [
      'For about 4 years I had the opportunity to work with Pavel in Rogue Fitness company and can recommend him as a highly qualified developer, with extensive experience in Vue.js, React.js, Cordova, React Native frameworks, Firebase services and frontend tech stack in general.',
      'He has always been one of the best team players with great communication skills (btw. has fluent English), an open minded person that is always engaged in the project, tries to improve processes to achieve project goals, suggests UI improvements, optimizations, recommends possible code refactoring ways, always sees the optimal balance between code quality and meeting deadlines.',
    ],
    name: 'Valery Kuzmenka',
    title: 'Hybrid Mobile App/Full-stack Developer',
    company: 'Rogue Fitness',
  },
  {
    quote: [
      'Pavel is a perfect team player with a high degree of skill, always willing to help others, participate in hard problems and grow his individual knowledge. I enjoyed working with him immensely and think he can be an asset to any team, both in terms of front-end velocity and by strengthening team culture. Highly recommended!',
    ],
    name: 'Jake Hammond',
    title: 'Director of Ecommerce',
    company: 'Rogue Fitness',
  },
  {
    quote: [
      '[Verbatim LinkedIn recommendation, pending confirmation: the previous site\'s text follows Yarieldis Claro Soto\'s almost sentence by sentence.]',
    ],
    name: 'Liudmila Kazakova',
    title: 'UX Designer',
    company: 'Heapix/Playfood',
  },
  {
    quote: [
      'If you\'re in need of a Frontend Engineer, look no further! Pavel is your guy. When Pavel joined our team, we were struggling with our frontend architecture and workflow. However, Pavel\'s expertise with Vue.js, JavaScript, TypeScript, HTML5, and CSS3 quickly turned things around. He revamped our entire frontend architecture and implemented new pipelines that significantly improved our workflow.',
      'One of the things I admire about Pavel is his attention to detail. He always ensures that his code is clean, efficient, and maintainable, and he optimizes web pages for optimal performance. Pavel is also a fantastic problem solver. He\'s not afraid to tackle complex problems, and he always comes up with innovative solutions to solve them.',
      'Whether working independently or as part of a team, Pavel is exceptional. He\'s highly skilled, reliable, and always makes sure his work aligns with project goals and timelines. With Pavel on your team, you can be confident that you\'re in good hands.',
      'Overall, I highly recommend Pavel Padron for any frontend engineering position. He\'s a talented and dedicated engineer who would be an asset to any organization.',
    ],
    name: 'Igor Tkachenko',
    title: 'Product Manager',
    company: 'Playfood',
  },
  {
    quote: [
      'During most of my time at Rogue, Pavel was on my team. He was a key contributor in our codebases new and existing. Throughout the years Pavel honed his skills and became a subject matter expert on multiple projects, improving existing code and pushing new objectives. He was a joy to work with back then, and I hope to again in the future!',
    ],
    name: 'Michael Weaver',
    title: 'Lead UI Developer',
    company: 'Rogue Fitness',
  },
]
