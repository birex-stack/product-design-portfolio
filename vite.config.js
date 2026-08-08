import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Classic (non-module) script tags are left as relative URLs by Vite and are
 * not emitted into dist — GH Pages then 404s soc-demo-data / list renderers.
 */
function copySocClassicScripts() {
  const files = [
    'case-studies/ibm-xftm-soc/soc-demo-data.js',
    'case-studies/ibm-xftm-soc/soc-alerts-page.js',
    'case-studies/ibm-xftm-soc/soc-cases-page.js',
  ];
  return {
    name: 'copy-soc-classic-scripts',
    closeBundle() {
      const outDir = 'dist';
      for (const file of files) {
        const dest = join(outDir, file);
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(file, dest);
      }
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH ?? '/product-design-portfolio/',
  plugins: [react(), copySocClassicScripts()],
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
        ibmXftmSocAlert: 'case-studies/ibm-xftm-soc/alert.html',
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
