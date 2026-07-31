import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/product-design-portfolio/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        karmen: 'case-studies/karmen.html',
        ibmXftm: 'case-studies/ibm-xftm.html',
        ibmXftmSocBriefing: 'case-studies/ibm-xftm-soc/shift-briefing.html',
        ibmXftmSocAlerts: 'case-studies/ibm-xftm-soc/alerts.html',
        ibmXftmSocCases: 'case-studies/ibm-xftm-soc/cases.html',
        ibmXftmSocIncident: 'case-studies/ibm-xftm-soc/incident.html',
        ibmXftmSocAlert: 'case-studies/ibm-xftm-soc/alert.html',
        ibmXftmSocComplete: 'case-studies/ibm-xftm-soc/complete.html',
        ibmXftmSocPassdown: 'case-studies/ibm-xftm-soc/passdown.html',
        elasticSlo: 'case-studies/elastic-slo.html',
        elasticCases: 'case-studies/elastic-cases.html',
        otomoto: 'case-studies/otomoto.html',
        mobileGames: 'case-studies/mobile-games.html',
      },
    },
  },
});
