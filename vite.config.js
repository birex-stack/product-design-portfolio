import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/product-design-portfolio/',
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/css',
      '@elastic/eui',
      '@elastic/eui-theme-borealis',
      '@elastic/datemath',
      '@elastic/charts',
      'moment',
    ],
  },
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
        ibmXftmSocComplete: 'case-studies/ibm-xftm-soc/complete.html',
        ibmXftmSocPassdown: 'case-studies/ibm-xftm-soc/passdown.html',
        elasticSlo: 'case-studies/elastic-slo.html',
        elasticSloProto: 'case-studies/elastic-slo-proto/index.html',
        elasticCases: 'case-studies/elastic-cases.html',
        otomoto: 'case-studies/otomoto.html',
        mobileGames: 'case-studies/mobile-games.html',
      },
    },
  },
});
