import { defineConfig } from 'vitepress';

// Site de documentation UTILISATEUR (CDC §IV.8, ADR-0009). Ne sert que
// `docs/user/` : la doc technique (architecture, ADR, testing…) reste du
// markdown consulté dans le dépôt, hors VitePress (scope #58).
export default defineConfig({
  lang: 'fr-FR',
  title: 'FutureKawa',
  description:
    'Suivi des stocks de café vert et surveillance des conditions de stockage.',
  srcDir: './user',
  // Le README.md sert d'index GitHub du dossier (règle 05) ; la home du site
  // est index.md → on exclut README.md du routage pour éviter une page /README.
  srcExclude: ['README.md'],
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Accueil', link: '/' },
      { text: 'Prise en main', link: '/getting-started' },
      { text: 'FAQ', link: '/faq' },
    ],

    sidebar: [
      {
        text: 'Guides',
        items: [
          { text: 'Prise en main', link: '/getting-started' },
          { text: 'Se connecter', link: '/connexion' },
          { text: 'Consulter les lots', link: '/lots' },
          { text: 'Lire les courbes', link: '/monitoring' },
          { text: 'Comprendre les alertes', link: '/alerts' },
          { text: 'FAQ', link: '/faq' },
        ],
      },
    ],

    search: { provider: 'local' },

    outline: { label: 'Sur cette page', level: [2, 3] },
    docFooter: { prev: 'Précédent', next: 'Suivant' },
    darkModeSwitchLabel: 'Apparence',
    lightModeSwitchTitle: 'Passer en thème clair',
    darkModeSwitchTitle: 'Passer en thème sombre',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Haut de page',
    lastUpdatedText: 'Dernière mise à jour',

    footer: {
      message: 'Documentation utilisateur — FutureKawa (MSPR TPRE-814).',
      copyright: 'Projet pédagogique FutureKawa',
    },
  },
});
