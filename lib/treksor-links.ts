import { Alert, Linking } from "react-native";
export const treksorWeb = "https://treksor-community.oceanicman.chatgpt.site";
export function openTreksorWeb(route: string) {
    return Linking.openURL(`${treksorWeb}/#/${route}`).catch(() => Alert.alert("Unable to open Treksor web", "Please try again when your browser is available."));
}
