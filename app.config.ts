export default {
  "expo": {
    "name": "School ERP",
    "slug": "school-erp",
    "version": "1.0.0",
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "orientation": "default",
    "icon": "./assets/icon.png",
    "scheme": "schooerp",
    "userInterfaceStyle": "light",
    "newArchEnabled": false,
    "ios": {
      "buildNumber": "1",
      "supportsTablet": true,
      "bundleIdentifier": "com.schooerp.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Allow School ERP to use your camera for profile photos and document scanning.",
        "NSPhotoLibraryUsageDescription": "Allow School ERP to access your photos to upload documents.",
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "versionCode": 1,
      "package": "com.schooerp.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1E3A5F"
      },
      "edgeToEdgeEnabled": true
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/favicon.png"
    },
    "updates": {
      "enabled": false,
      "checkAutomatically": "NEVER"
    },
    "plugins": [
      "expo-router",
      "expo-asset",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#F8F9FB",
          "image": "./assets/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain"
        }
      ],
      "expo-image-picker",
      "expo-web-browser",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "color": "#1E3A5F"
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
        "projectId": ""
      }
    },
    "owner": "school-erp"
  }
};
