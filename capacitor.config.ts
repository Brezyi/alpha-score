import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d30bdb3d7c6b4134bde13d141f10bbeb',
  appName: 'FaceRank',
  webDir: 'dist',
  server: {
    url: 'https://d30bdb3d-7c6b-4134-bde1-3d141f10bbeb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0B0B0B',
      showSpinner: false
    }
  }
};

export default config;
