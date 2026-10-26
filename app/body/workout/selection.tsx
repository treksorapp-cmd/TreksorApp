import Button from "@/components/ui/Button";
import PillarMenuScreen from "@/components/PillarMenuScreen";
import {router} from "expo-router";
export default function WorkoutSelection(){
  return <PillarMenuScreen title="Workout" trail="BODY" image={require("@/assets/images/Workout_2.png")} subtitle="Build strength, one intentional session at a time.">
    <Button iconName="barbell-outline" onPress={()=>router.push("/body/workout")}>Gym</Button>
    <Button iconName="body-outline" disabled>Calisthenics · Coming soon</Button>
  </PillarMenuScreen>;
}
