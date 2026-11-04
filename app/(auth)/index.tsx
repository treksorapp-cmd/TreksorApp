import Button from "@/components/ui/Button";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>TREKSOR</Text>
      <Text style={styles.subHeading}>Strengthen your body. Focus your mind. Find your purpose.</Text>
      <View style={styles.buttonContainer}>
        <Button onPress={() => router.push("/login")}>GET STARTED</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  heading: {
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 3,
    color: "#FFFFFF",
    textAlign: "center",
  },
  subHeading: {
    fontSize: 16,
    letterSpacing: 0.2,
    lineHeight: 24,
    paddingHorizontal: 24,
    color: "#FFFFFF",
    textAlign: "center",
    marginVertical: 20,
  },
  buttonContainer: {
    marginBottom: 54,
    alignItems: "center",
  },
});
