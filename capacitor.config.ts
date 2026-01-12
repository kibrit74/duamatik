import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dijitaltesbih.app',
  appName: 'Dijital Tesbih',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ecfdf5",
      showSpinner: false,
      androidSplashResourceName: "splash",
      iosSplashResourceName: "Default-568h@2x~iphone"
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ecfdf5",
      overlaysWebView: false
    },
    LocalNotifications: {
      iconColor: "#0d9488"
    }
  }
};

export default config;