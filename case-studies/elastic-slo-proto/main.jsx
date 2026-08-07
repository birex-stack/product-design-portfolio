import React from 'react';
import { createRoot } from 'react-dom/client';
import { EuiProvider } from '@elastic/eui';
import { EuiThemeBorealis } from '@elastic/eui-theme-borealis';
import '@elastic/charts/dist/theme_light.css';
import './chart-overrides.css';
import App from './App';
import { ToastProvider } from './toast_context';

createRoot(document.getElementById('root')).render(
  <EuiProvider theme={EuiThemeBorealis} colorMode="light">
    <ToastProvider>
      <App />
    </ToastProvider>
  </EuiProvider>
);
