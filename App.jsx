import BackgroundSoundtrack from "./components/audio/BackgroundSoundtrack";
import AnimatedExamScene from "./components/scene/AnimatedExamScene";

export default function App() {
  return (
    <>
      <AnimatedExamScene />
      <BackgroundSoundtrack volume={0.18} />
    </>
  );
}
