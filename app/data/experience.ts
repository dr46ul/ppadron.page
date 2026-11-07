/**
 * Experience is the site's only proof surface — see
 * docs/adr/0001-experience-is-the-only-proof-surface.md.
 *
 * A `[bracketed]` string is Content Pavel has yet to supply.
 * `test/unit/content.test.ts` fails while one remains, so none can ship.
 */
export interface RolePhase {
  name: string
  tech: string[]
}

/** A named project inside a Role whose stack changed while Pavel was on it. */
export interface RoleProject {
  name: string
  phases: RolePhase[]
}

export interface Role {
  /** The name in the Role's path, `~/experience/<slug>`. Stable once published. */
  slug: string
  /** Company name, as the company writes it. */
  company: string
  /** Pavel's title there. Shown small — the summary carries the weight. */
  title: string
  /** Years only, because the Experience list's column is sized for that. */
  period: string
  /** The range with months, printed by Role detail. */
  exactPeriod: string
  /** Machine-readable start, for ordering and <time datetime>. */
  since: string
  /** Leads with what was built, never with what he was employed as. */
  summary: string
  /** A few names for scanning the list. The full list is `stack`. */
  tech: string[]
  /** The full account, in paragraphs. */
  account: string[]
  history?: RoleProject[]
  stack: string[]
}

export const roles: Role[] = [
  {
    slug: 'playfood',
    company: 'Playfood',
    title: 'Senior Frontend Web Developer',
    period: '2022 — [end]',
    exactPeriod: 'Apr 2022 – Jan 2023',
    since: '2022',
    summary:
      'Built multi-language support and multi-city presence for a startup\'s Vue/Nuxt platform, refactored its Vuex state and dynamic routing, and reworked the homepage, cart and checkout pages.',
    tech: ['Vue', 'Nuxt', 'Vuex', 'TypeScript', 'SCSS'],
    account: [
      'In this position I was responsible for the maintenance and implementation of new features for three applications, including the visual elements that users interact with, layouts, components and the overall UX of the products.',
      'The role involved to work and collaborate with designers and backend developer to ensure the seamless integration of visual elements and functionality. In addition, I worked closely with QA team fixing bugs and providing them the required acceptance criteria and details needed to perform the testing process.',
      'Performed necessary code refactoring to improve the platform\'s performance including the Vuex state management, dynamic routing and page management.',
      'Built several new features such as multi-language support and multi-city business presence.',
      'At some point I also got involved in some of the payment gateways integrations.',
      'Translated complex design concepts into functional, user-friendly interfaces. Implemented several UI/UX improvements as part of a redesign process for the featured categories & restaurants in the homepage, customer\'s profile, order details, cart and checkout pages. Contributed with several refactoring processes in different pieces of the projects such as the Vuex store and the axios implementation. Helped the team to be aware and use the best practices in a Vue/Nuxt project.',
      'Besides writing code and performing code reviews, I also mentored another frontend developer.',
      'Overall, I am very grateful to this team even though my time with them was short. They are wonderful people working tirelessly to position an ambitious startup company in the map.',
    ],
    stack: ['Vue', 'Vuex', 'VueRouter', 'Nuxt', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'SCSS', 'Responsive Web Design', 'JSON', 'WebSockets', 'RESTful API', 'Git', 'GitHub', 'Swagger', 'Postman', 'CI/CD', 'Jenkins', 'Scrum/Agile', 'Figma', 'Frontend', 'Notion', 'MacOS'],
  },
  {
    slug: 'rogue-fitness',
    company: 'Rogue Fitness',
    title: 'Middle/Senior Frontend Developer',
    period: '2014 — 2022',
    exactPeriod: 'Nov 2014 – Mar 2022',
    since: '2014',
    summary:
      'Built the interfaces of the Rogue Fitness web store and Rogue Mobile App, carrying them from Magento 1 to Magento 2 and from Cordova and Ionic to React Native as the stack evolved.',
    tech: ['Vue', 'Magento', 'Node.js', 'Ionic', 'React Native'],
    account: [
      '[tenure] working in a wonderful team, great projects and lots of challenges that helped me to expand and improve my skills.',
      'I was responsible for creating visually appealing, intuitive and responsive interfaces optimized for the user experience. I was required to have a deep understanding of the latest web and mobile design trends, a high degree of proficiency in HTML, CSS, JavaScript and Vue.js framework. Ensured scalability and maintainability of the frontend code base, optimized performance of the applications, and stayed up-to-date with the emerging technologies and industry trends over the years.',
      'Additionally, I collaborated in a cross-functional team environment, including product managers, designers, backend developers and QA. I was able to translate design concepts into functional user interfaces that met the requirements and needs of the end-users while adhered to technical standards, best practices and aligned with the overall goals of the business.',
      'During the time I worked here I was hands-on the main two projects, the Rogue Fitness e-commerce web store and the Rogue Mobile App. Both projects were developed with a tech stack that evolved and in some cases completely changed. Therefore, I improved my skills and had to learn some new technologies and methodologies as well.',
      'We used scrum and agile methodologies in all the projects. Also Bitbucket, Jira and Confluence.',
    ],
    history: [
      {
        name: 'Web Store',
        phases: [
          {
            name: 'Phase 1',
            tech: ['HTML5', 'JavaScript', 'CSS3', 'SCSS', 'Vue.js', 'Vuex', 'Vue Router', 'Magento 1', 'PHP', 'Responsive Web Design', 'Linux', 'PSD files to HTML', 'WebStorm/PhpStorm'],
          },
          {
            name: 'Phase 2',
            tech: ['HTML5', 'JavaScript', 'CSS3', 'SCSS', 'Vue.js', 'Vuex', 'Vue Router', 'Magento 2', 'Storybook', 'Docker', 'CI/CD', 'Jenkins', 'Node.js', 'Express.js', 'Microservices', 'GCP', 'WordPress', 'Responsive Web Design', 'MacOS', 'WebStorm/PhpStorm', 'InVision/Sketch'],
          },
        ],
      },
      {
        name: 'Mobile App',
        phases: [
          {
            name: 'Phase 1',
            tech: ['HTML5', 'JavaScript', 'CSS3', 'SCSS', 'Cordova', 'Angular JS', 'Ionic', 'JSX', 'Firebase', 'Linux/MacOS', 'WebStorm'],
          },
          {
            name: 'Phase 2',
            tech: ['React.js', 'React Native', 'JavaScript', 'TypeScript', 'MacOS', 'WebStorm', 'InVision/Sketch'],
          },
        ],
      },
    ],
    stack: ['Vue', 'JavaScript', 'HTML5', 'CSS3', 'SCSS', 'JSON', 'eCommerce', 'Magento', 'RESTful API', 'REST', 'Frontend', 'Responsive Web Design', 'Git', 'Bitbucket', 'JIRA', 'Docker', 'Postman', 'CI/CD', 'Jenkins', 'Node JS', 'Express JS', 'Microservices', 'Mobile App Development', 'Ionic', 'Angular JS', 'Cordova', 'React JS', 'Firebase', 'React Native', 'WordPress', 'Scrum/Agile', 'InVision', 'Sketch', 'PHP', 'MacOS', 'Linux/Ubuntu'],
  },
  {
    slug: 'procyon-soluciones',
    company: 'Procyon Soluciones',
    title: 'Senior Software Engineer / Team Manager',
    period: '2009 — 2010',
    exactPeriod: 'Jan 2009 – Dec 2010',
    since: '2009',
    summary:
      'Built software in ASP.NET, C# and Java with a team of young programmers, and ran a project as Project Manager and Team Leader for a company based in Spain.',
    tech: ['ASP.NET', 'C#', 'Java', 'J2EE', 'jQuery'],
    account: [
      'Another great opportunity to contribute with my skills and to develop other ones. A great team of young programmers with wonderful ideas and a variety of different backgrounds. People with a lot of expertise in many fields.',
      'Besides my role as Senior Software Engineer, I also had the chance to be a Project Manager and Team Leader for a company based in Spain. The project allowed me to expand my horizon and to start working in a fast-paced environment, to learn from professionals in the international market. Working here opened for me a door that would change my life!',
    ],
    stack: ['Team Manager', 'Project Leader', 'Object-Oriented Programming', 'ASP.NET', 'C#', '.NET Framework', 'Java', 'J2EE', 'JBoss', 'JavaScript', 'jQuery', 'CSS', 'HTML', 'JSON', 'Linux/Ubuntu', 'Scrum/Agile', 'SVN'],
  },
  {
    slug: 'havasoft',
    company: 'Havasoft',
    title: 'Software Engineer',
    period: '2007 — 2008',
    exactPeriod: 'Apr 2007 – Dec 2008',
    since: '2007',
    summary:
      'Built software for a client\'s daily tasks in C# and .NET, as team leader and main developer on the project. The client said the end result exceeded their expectations.',
    tech: ['C#', '.NET Framework', 'MSSQL'],
    account: [
      'Havasoft was the first opportunity I had to start my career as a Software Engineer/Developer. After being fully absorbed by my previous job in which I barely wrote some lines of code, here I had the chance of dedicate all my time to do what I really like, creating software/apps.',
      'In the beginning I participated in a couple of projects as junior developer where I got familiar with several methodologies that were new to me. Then, when the probation period ended, I was assigned to a new project in which I was the team leader and main developer.',
      'After the project was completed, I got a very good feedback from the client, they said the end result exceeded their expectations and they were happy about having this software to help them with the daily tasks and activities.',
    ],
    stack: ['.NET Framework', 'C#', 'MSSQL', 'SQL Reports', 'Object-Oriented Programming', 'Visual Studio', 'Windows Apps', 'Desktop Applications', 'SVN'],
  },
  {
    slug: 'gea-villa-clara',
    company: 'GEA Villa Clara',
    title: 'Network Administrator',
    period: '2005 — 2007',
    exactPeriod: 'Sep 2005 – Mar 2007',
    since: '2005',
    summary:
      'Designed the company\'s first intranet and, with the TeicoSoft team, rolled it out across five floors in over six months: new servers, an ADSL line and more than 50 offices equipped.',
    tech: ['LAN', 'TCP/IP', 'DNS', 'Linux', 'Windows Server'],
    account: [
      'My first job!',
      'I remember I was ready to eat the world, I wanted to do so much because I love my profession and I don\'t see myself doing anything else. The first months I was so excited and had so many ideas... Unfortunately, I faced several barriers that step-by-step I tried to overcome.',
      'I\'ve always felt passion for web development and that\'s the first goal I set to myself, create the GEA VC website, but my superiors they had a different plan for me, one that I do not regret and gave me the opportunity to know a whole new world in the IT field.',
      'The first lesson I got in this company is that in Cuba is very difficult to professionally develop yourself in the way you dream. Getting your Bachelor degree and then being assigned to work in a company where most of what you studied is not possible to put to good use. That was my case in the beginning!',
      'How could I develop a website for a company that didn\'t have an intranet? Sounds crazy, right?',
      'I had to change my goals and be realistic if I didn\'t want to waste all the effort I\'ve done so far. That\'s how instead of a web developer, I started by creating the intranet network design of the company I was working for. It was quite challenging and I faced way too many obstacles on the way, but I managed to do it with the help of many co-workers and limited resources.',
      'After over 6 months of execution and many hours from my side and the TeicoSoft team, the project was completed and ready to be exploited. The network was installed across the five floors building, even the basement had network connectors just in case :)',
      'Brand-new servers with 10x the capacity we had before, DNS, Emails and Backup servers, from an old analog internet connection to a new ADSL one. More than 50 offices, each one with a brand new computer, some of them provided with the required equipment such as printers, plotters, scanners, photo cameras, etc. A big meetings room with projector, audio system and new lights. We also created a classroom for seminars and courses.',
      'That was the easy part! The real work came after when I had to install the required software to make the best use of this brand new network, to change people\'s minds about switching to a different working method and process. Today I look back and I feel grateful, I\'ve learnt a lot about hardware and network administration, how to install, setup and maintain domain servers, email servers, web servers, etc.',
    ],
    stack: ['Network Administrator', 'Setup Network', 'Network Segments', 'Server Maintenance', 'Network Monitoring & Diagnosis', 'Failure-Free Network', 'Software & Driver Installation', 'LAN', 'TCP/IP', 'DNS', 'DHCP', 'Nessus', 'Linux', 'Windows Server'],
  },
]
