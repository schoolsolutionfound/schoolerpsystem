export default {
  "expo": {
    "name": "KIVQUO",
    "slug": "school-erp",
    "version": "1.0.0",
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "orientation": "default",
    "icon": "./assets/app-icon.png",
    "scheme": "kivquo",
    "userInterfaceStyle": "light",
    "newArchEnabled": false,
    "ios": {
      "buildNumber": "1",
      "supportsTablet": true,
      "bundleIdentifier": "com.kivquo.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Allow School ERP to use your camera for profile photos and document scanning.",
        "NSPhotoLibraryUsageDescription": "Allow School ERP to access your photos to upload documents.",
        "NSLocationWhenInUseUsageDescription": "Allow School ERP to access your location to show proximity to the school bus and route stops.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Allow School ERP to access your location in the background to continuously broadcast bus position during active trips.",
        "UIBackgroundModes": ["location"],
        "ITSAppUsesNonExemptEncryption": false
      },
      ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        ? {
            "config": {
              "googleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
            }
          }
        : {})
    },
    "android": {
      "versionCode": 1,
      "package": "com.kivquo.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F4C430"
      },
      "edgeToEdgeEnabled": true,
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ],
      ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        ? {
            "config": {
              "googleMaps": {
                "apiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
              }
            }
          }
        : {})
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/favicon.png"
    },
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "url": "https://u.expo.dev/49525e1b-2eec-4315-a68d-f83d351f0ea0"
    },
    "plugins": [
      "expo-router",
      "expo-asset",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#FFFDF7",
          "image": "./assets/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain"
        }
      ],
      "expo-image-picker",
      "expo-web-browser",
      "expo-secure-store",
      "@react-native-community/datetimepicker",
      "expo-audio",
      "expo-font",
      "expo-image",
      "expo-sharing",
      "expo-status-bar",
      "expo-video",
      [
        "expo-notifications",
        {
          "color": "#171717"
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "newArchEnabled": false
          },
          "ios": {
            "newArchEnabled": false
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "49525e1b-2eec-4315-a68d-f83d351f0ea0"
      }
    },
    "owner": "kivquo"
  }
};
