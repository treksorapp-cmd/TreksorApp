const isIphoneDev = process.env.EAS_BUILD_PROFILE ? ["iphone-dev", "iphone-preview"].includes(process.env.EAS_BUILD_PROFILE) : process.env.TREKSOR_IPHONE_DEV === "1";

export default {
  expo: {
    name: isIphoneDev ? "Treksor Dev" : "Treksor",
    slug: isIphoneDev ? "treksorapp" : "Treksor",
    ...(isIphoneDev ? { owner: "treksorapps-team" } : {}),
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
      buildNumber: "3",
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
            "Choose photos for your profile and private Life moments calendar. Photos are shared only when you choose to publish them.",
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
        projectId: isIphoneDev ? "14f7500b-1aba-4cea-9c2b-ded2c67821e2" : "67c51458-b4bc-49a9-a9a9-c9117a576b2d"
      }
    },
  },
};
