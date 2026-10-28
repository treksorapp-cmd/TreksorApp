const isIphoneDev = process.env.EAS_BUILD_PROFILE === "iphone-dev" || process.env.TREKSOR_IPHONE_DEV === "1";

export default {
  expo: {
    name: isIphoneDev ? "Treksor Dev" : "Treksor",
    slug: isIphoneDev ? "treksorapp" : "Treksor",
    owner: "treksorapps-team",
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/images/appicon-treksor.png",
    scheme: isIphoneDev ? "treksor-dev" : "treksorapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-treksor.png",
      resizeMode: "cover",
      backgroundColor: "#000000",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: isIphoneDev ? "com.treksor.dev" : "com.treksor.prod",
      googleServicesFile: process.env.GOOGLE_SERVICES_INFOPLIST,
      buildNumber: "5",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          "This app needs access to your photo library to let you pick and upload images.",
        NSCameraUsageDescription:
          "The app needs access to your camera to let you upload/change your profile picture.",
        SKAdNetworkItems: [], // if you want, for ad tracking
      },
      usesAppleSignIn: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.treksor.app",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-web-browser",
      "expo-apple-authentication",
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app accesses your photos to let you change your profile picture.",
        },
      ],
      // [
      //   "expo-video",
      //   {
      //     supportsBackgroundPlayback: true,
      //     supportsPictureInPicture: true,
      //   },
      // ],
      ["@react-native-google-signin/google-signin"],
      [
        "expo-font",
        {
          fonts: ["assets/fonts/Nunito-Regular.ttf"],
          android: {
            fonts: [ 
              {
                fontFamily: "Nunito-Regular",
                fontDefinitions: [
                  {
                    path: "assets/fonts/Nunito-Regular.ttf",
                    weight: 800,
                  },
                ],
              },
            ],
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: isIphoneDev ? "14f7500b-1aba-4cea-9c2b-ded2c67821e2" : "fff5ba02-2ec6-45e0-99b6-7daf868561f4"
      }
    },
  },
};
