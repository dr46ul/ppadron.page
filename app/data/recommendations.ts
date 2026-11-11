/**
 * Recommendations are verbatim quotes from former colleagues and managers,
 * taken from LinkedIn and attributed by name, title and company. They never
 * come from freelance clients, and the page says so plainly rather than
 * letting a visitor infer client references.
 *
 * The order is the order printed. The first is quoted in full when the block
 * prints and the rest are listed by name, so the first is the one a Visitor
 * reads without asking: the shortest, from the most senior of the six.
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
      'Pavel is a perfect team player with a high degree of skill, always willing to help others, participate in hard problems and grow his individual knowledge. I enjoyed working with him immensely and think he can be an asset to any team, both in terms of front-end velocity and by strengthening team culture. Highly recommended!',
    ],
    name: 'Jake Hammond',
    title: 'Director of Ecommerce',
    company: 'Rogue Fitness',
  },
  {
    quote: [
      'During my time working with Pavel at Rogue Fitness he was great at working around unique challenges for the front end of our mobile application. Making sure that our website showed the correct content, layout, or styles as required within our mobile app.',
      'Pavel always improved  upon feedback and made sure that he was bringing the best solutions possible to the table.',
      'Pavel was a great team mate and fun to collaborate with.',
    ],
    name: 'Zach Warf',
    title: 'Business Analyst',
    company: 'Rogue Fitness',
  },
  {
    quote: [
      'For about 4 years I had the opportunity to work with Pavel in Rogue Fitness company and can recommend him as a highly qualified developer, with extensive experience in Vue.js, React.js, Cordova, React Native frameworks, Firebase services and frontend tech stack in general.',
      '  He has always been one of the best team players with great communication skills (btw. has fluent English), an open minded person that is always engaged in the project, tries to improve processes to achieve project goals, suggests UI improvements, optimizations, recommends possible code refactoring ways, always sees the optimal balance between code quality and meeting deadlines.',
    ],
    name: 'Valery Kuzmenka',
    title: 'Hybrid Mobile App/Full-stack Developer',
    company: 'Rogue Fitness',
  },
  {
    quote: [
      'I highly endorse Pavel as a frontend developer. Pavel possesses excellent soft skills that make him a valuable addition to any team. He is a great team player, always willing to help out and collaborate on projects. He has the ability to translate provided designs into functional code with remarkable precision and attention to details. Pavel always contributes positively to the project, bringing enthusiasm and creativity to every task. He provides new and innovative ideas on how to approach problems, which has led to better outcomes for our clients. Overall, Pavel is an outstanding frontend developer who would bring undeniable value to any team or organization.',
    ],
    name: 'Mila Kazakova',
    title: 'UX Designer',
    company: 'Heapix/Playfood',
  },
  {
    quote: [
      'I want to share my personal experience working with Pavel Padron at Playfood. If you\'re in need of a Frontend Engineer, look no further! Pavel is your guy.',
      'When Pavel joined our team, we were struggling with our frontend architecture and workflow. However, Pavel\'s expertise with Vue.js, JavaScript, TypeScript, HTML5, and CSS3 quickly turned things around. He revamped our entire frontend architecture and implemented new pipelines that significantly improved our workflow.',
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
