import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.glowmaxxed.ai',
  appName: 'GLOWMAXXED AI',
  webDir: 'dist',
  server: {
    url: 'https://d30bdb3d-7c6b-4134-bde1-3d141f10bbeb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0B0B0B',
    // Enable edge-to-edge display
    webContentsDebuggingEnabled: false
  },
  ios: {
    backgroundColor: '#0B0B0B',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0B0B0B',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0B0B0B'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;