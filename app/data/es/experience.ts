import type { RoleProse } from '../experience'

/**
 * A job title stays in English, as LinkedIn has it, so a recruiter's search
 * still finds it, unless the Role has been given a Spanish one; the prose
 * around the titles is translated.
 */
export const roles: RoleProse[] = [
  {
    slug: 'nordhealth',
    company: 'Nordhealth',
    title: 'Lead Frontend Developer',
    from: '2023-06',
    to: null,
    summary: 'Migro Provet, la aplicación más importante de Nordhealth, de un monolito heredado a una nueva aplicación en Nuxt, y ahora lidero el trabajo de frontend entre los equipos de la empresa.',
    account: [
      'Entré en Nordhealth como Senior Frontend Developer en junio de 2023 y soy Lead desde abril de 2025, con un contrato en remoto.',
      'Nordhealth está migrando su aplicación más importante, Provet, de una arquitectura monolítica antigua a una aplicación totalmente nueva escrita en Nuxt.',
      'Como Lead, superviso el trabajo de todos los desarrolladores frontend para que avancen sincronizados entre los distintos equipos de la empresa, y soy la persona a quien preguntar sobre cualquier cosa del proyecto NFE, en lugar de ir detrás de cada uno por separado. También corrijo las vulnerabilidades del proyecto, mantengo las dependencias al día y propongo refactorizaciones.',
      'Hace poco refactoricé los pipelines de CI, que ahora son bastante más rápidos.',
    ],
  },
  {
    slug: 'playfood',
    company: 'Playfood',
    title: 'Senior Frontend Web Developer',
    from: '2022-04',
    to: '2023-01',
    summary: 'Construí el soporte multiidioma y la presencia en varias ciudades de la plataforma Vue/Nuxt de una startup, refactoricé su estado en Vuex e hice mejoras de UI/UX en el rediseño del carrito y el checkout.',
    account: [
      'En este puesto me encargaba del mantenimiento y de las nuevas funcionalidades de tres aplicaciones, incluidos los elementos visuales con los que interactúan los usuarios, los layouts, los componentes y la UX general de los productos.',
      'El trabajo consistía en colaborar con diseñadores y desarrolladores backend para que los elementos visuales y la funcionalidad encajaran sin fisuras. Además, trabajé de cerca con el equipo de QA corrigiendo bugs y dándoles los criterios de aceptación y los detalles necesarios para las pruebas.',
      'Hice las refactorizaciones necesarias para mejorar el rendimiento de la plataforma, incluidos la gestión del estado con Vuex, el enrutamiento dinámico y la gestión de páginas.',
      'Construí varias funcionalidades nuevas, como el soporte multiidioma y la presencia del negocio en varias ciudades.',
      'En algún momento también participé en la integración de algunas pasarelas de pago.',
      'Convertí conceptos de diseño complejos en interfaces funcionales y fáciles de usar. Implementé varias mejoras de UI/UX dentro del rediseño de las categorías y restaurantes destacados de la portada, el perfil del cliente, el detalle de pedidos, el carrito y el checkout. Contribuí a varias refactorizaciones en distintas partes de los proyectos, como el store de Vuex y la implementación de axios. Ayudé al equipo a conocer y aplicar las buenas prácticas de un proyecto Vue/Nuxt.',
      'Además de escribir código y revisar el de otros, fui mentor de otro desarrollador frontend.',
      'En conjunto, estoy muy agradecido a este equipo, aunque mi tiempo con ellos fue corto. Es gente maravillosa que trabaja sin descanso para poner en el mapa a una startup ambiciosa.',
    ],
  },
  {
    slug: 'rogue-fitness',
    company: 'Rogue Fitness',
    title: 'Middle/Senior Frontend Developer',
    from: '2014-11',
    to: '2022-03',
    summary: 'Construí las interfaces de la tienda online de Rogue Fitness y de la Rogue Mobile App a medida que evolucionaba su stack, de Magento 1 a Magento 2 y de Cordova e Ionic a React Native.',
    account: [
      'Más de 7 años en un equipo estupendo, con grandes proyectos y muchos retos que me ayudaron a ampliar y mejorar mis habilidades.',
      'Me encargaba de crear interfaces atractivas, intuitivas y responsive, optimizadas para la experiencia de usuario. El puesto exigía conocer a fondo las últimas tendencias de diseño web y móvil y dominar HTML, CSS, JavaScript y el framework Vue.js. Me aseguré de que el código frontend fuera escalable y mantenible, optimicé el rendimiento de las aplicaciones y me mantuve al día con las tecnologías emergentes y las tendencias del sector a lo largo de los años.',
      'Además, colaboré en un equipo multidisciplinario con gestores de producto, diseñadores, desarrolladores backend y QA. Supe traducir conceptos de diseño en interfaces funcionales que cumplían los requisitos y necesidades de los usuarios finales, respetando los estándares técnicos y las buenas prácticas y en línea con los objetivos del negocio.',
      'Durante mi tiempo aquí trabajé directamente en los dos proyectos principales, la tienda online de Rogue Fitness y la Rogue Mobile App. Ambos se desarrollaron con un stack que evolucionó y, en algunos casos, cambió por completo. Así que mejoré mis habilidades y también tuve que aprender tecnologías y metodologías nuevas.',
      'Usábamos scrum y metodologías ágiles en todos los proyectos, junto con Bitbucket, Jira y Confluence.',
    ],
    history: [
      {
        name: 'Tienda online',
        phases: [
          {
            name: 'Fase 1',
          },
          {
            name: 'Fase 2',
          },
        ],
      },
      {
        name: 'App móvil',
        phases: [
          {
            name: 'Fase 1',
          },
          {
            name: 'Fase 2',
          },
        ],
      },
    ],
  },
  {
    slug: 'freelance',
    company: 'Autónomo/Freelance',
    from: '2011-01',
    to: '2014-10',
    title: 'Middle Frontend Developer',
    summary: 'Creé temas de Magento a medida para varias tiendas online, convirtiendo el diseño de cada tienda en un escaparate funcional, desde el catálogo y las fichas de producto hasta el carrito y el checkout.',
    account: [
      'Empecé a trabajar por mi cuenta a principios de 2011, recién llegado a Italia, creando temas de Magento a medida para tiendas online. A finales de ese año me mudé a Minsk y seguí trabajando como freelance desde allí.',
      'Cada proyecto empezaba con el diseño de la tienda y terminaba con un escaparate funcional: el catálogo, las fichas de producto, el carrito y el checkout, construidos sobre Magento con HTML5, CSS3, JavaScript y jQuery, y PHP para las plantillas del tema.',
      'Trabajar solo significaba encargarme de todo, desde entender lo que necesitaba el cliente hasta entregar la tienda y darle soporte después.',
      'Casi cuatro años así hicieron de Magento algo natural para mí, y esa experiencia es la que me llevó a mis siete años siguientes en Rogue Fitness.',
    ],
  },
  {
    slug: 'procyon-soluciones',
    company: 'Procyon Soluciones',
    title: 'Ingeniero de Software Senior / Gestor de Equipo',
    from: '2009-01',
    to: '2010-12',
    summary: 'Dirigí un proyecto en un entorno de ritmo rápido, además de trabajar como ingeniero senior en un equipo de programadores jóvenes, como Gestor de Proyecto y Líder de Equipo para una empresa con sede en España.',
    account: [
      'Otra gran oportunidad para aportar mis habilidades y desarrollar otras nuevas. Un gran equipo de programadores jóvenes, con ideas estupendas y trayectorias muy distintas. Gente con mucha experiencia en muchos campos.',
      'Además de mi papel como Ingeniero de Software Senior, tuve la oportunidad de ser Gestor de Proyecto y Líder de Equipo para una empresa con sede en España. El proyecto me permitió ampliar horizontes, empezar a trabajar en un entorno de ritmo rápido y aprender de profesionales del mercado internacional. ¡Trabajar aquí me abrió una puerta que cambiaría mi vida!',
    ],
  },
  {
    slug: 'havasoft',
    company: 'Havasoft',
    title: 'Software Engineer',
    from: '2007-04',
    to: '2008-12',
    summary: 'Desarrollé software en C# y .NET para las tareas diarias de un cliente, como líder del equipo y desarrollador principal del proyecto. El cliente dijo que el resultado superó sus expectativas.',
    account: [
      'Havasoft fue mi primera oportunidad de empezar mi carrera como ingeniero y desarrollador de software. Después de un trabajo anterior que me absorbía por completo y en el que apenas escribía unas líneas de código, aquí pude dedicar todo mi tiempo a lo que de verdad me gusta: crear software y aplicaciones.',
      'Al principio participé en un par de proyectos como desarrollador junior, donde me familiaricé con varias metodologías que eran nuevas para mí. Después, al terminar el periodo de prueba, me asignaron a un proyecto nuevo en el que fui líder del equipo y desarrollador principal.',
      'Al terminar el proyecto recibí muy buenas valoraciones del cliente: dijeron que el resultado superaba sus expectativas y que estaban contentos de tener este software para ayudarles en sus tareas y actividades diarias.',
    ],
  },
  {
    slug: 'gea-villa-clara',
    company: 'GEA Villa Clara',
    title: 'Network Administrator',
    from: '2005-09',
    to: '2007-03',
    summary: 'Diseñé la primera intranet de la empresa y, con el equipo de TeicoSoft, la desplegué en cinco plantas en más de seis meses: servidores nuevos, una línea ADSL y más de 50 oficinas equipadas.',
    account: [
      '¡Mi primer trabajo!',
      'Recuerdo que estaba listo para comerme el mundo; quería hacer muchísimo porque amo mi profesión y no me veo haciendo otra cosa. Los primeros meses estaba entusiasmado y tenía muchísimas ideas... Por desgracia, me encontré con varias barreras que intenté superar paso a paso.',
      'Siempre me ha apasionado el desarrollo web, y ese fue el primer objetivo que me puse: crear el sitio web de GEA VC. Pero mis superiores tenían otro plan para mí, uno del que no me arrepiento y que me permitió conocer un mundo completamente nuevo dentro de la informática.',
      'La primera lección que aprendí en esta empresa es que en Cuba es muy difícil desarrollarte profesionalmente como sueñas. Terminas la licenciatura y te asignan a una empresa donde casi nada de lo que estudiaste se puede aprovechar. ¡Ese fue mi caso al principio!',
      '¿Cómo iba a desarrollar un sitio web para una empresa que ni siquiera tenía intranet? Suena a locura, ¿verdad?',
      'Tuve que cambiar mis objetivos y ser realista si no quería desperdiciar todo el esfuerzo hecho hasta entonces. Así fue como, en lugar de desarrollador web, empecé diseñando la red intranet de la empresa donde trabajaba. Fue todo un reto y encontré demasiados obstáculos por el camino, pero lo conseguí con la ayuda de muchos compañeros y con recursos limitados.',
      'Tras más de 6 meses de ejecución y muchas horas de mi parte y del equipo de TeicoSoft, el proyecto quedó terminado y listo para ponerse en marcha. La red se instaló en todo el edificio de cinco plantas; hasta el sótano tenía conectores de red, por si acaso :)',
      'Servidores totalmente nuevos con 10 veces la capacidad que teníamos antes, servidores de DNS, correo y copias de seguridad, y el paso de una vieja conexión analógica a Internet a una nueva línea ADSL. Más de 50 oficinas, cada una con un ordenador nuevo, algunas con el equipamiento necesario: impresoras, plotters, escáneres, cámaras de fotos, etc. Una gran sala de reuniones con proyector, sistema de audio e iluminación nueva. También creamos un aula para seminarios y cursos.',
      '¡Eso fue lo fácil! El trabajo de verdad llegó después, cuando tuve que instalar el software necesario para sacar el máximo partido a esta red nueva y cambiar la mentalidad de la gente para que adoptara otra forma de trabajar. Hoy miro atrás y me siento agradecido: aprendí mucho sobre hardware y administración de redes, y a instalar, configurar y mantener servidores de dominio, de correo, web, etc.',
    ],
  },
]
