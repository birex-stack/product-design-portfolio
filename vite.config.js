import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/product-design-portfolio/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        karmen: 'case-studies/karmen.html',
        ibmXftm: 'case-studies/ibm-xftm.html',
        elasticSlo: 'case-studies/elastic-slo.html',
        elasticCases: 'case-studies/elastic-cases.html',
        otomoto: 'case-studies/otomoto.html',
        mobileGames: 'case-studies/mobile-games.html',
      },
    },
  },
});
