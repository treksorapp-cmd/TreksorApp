# Treksor Dev without a development server

The `iphone-preview` profile builds a standalone, signed iPhone Release app with the JavaScript bundle and assets included. `developmentClient: false` avoids the Metro launcher. It inherits the existing iPhone Dev environment and retains its Expo project, bundle ID, URL scheme and Apple signing identity configuration. Installing the signed update over the existing app is preferable to uninstalling, because private journals and other local records are stored on the phone. Device registration and an authorized Apple signing account are required by EAS for internal distribution.

Run once from the updated checkout:

```sh
npx eas-cli@26.0.0 login
npm run build:iphone-preview
```

Select the registered iPhone when prompted, then open the installation link or QR from the completed EAS build on that phone. Afterwards the app starts from its icon without a computer, a USB connection, Git Bash or Metro. Internet is still required for server content, Mentor, community and uncached media. New source changes require an updated build; EAS Update is not configured in this project.

This configuration was validated locally, including retention of `com.treksor.dev` and isolation from `com.treksor.prod`. No installation link can be provided before a signed build completes. This workspace's Expo authentication must be checked before attempting the cloud build.
