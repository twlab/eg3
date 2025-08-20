import { MotionConfig } from "framer-motion";
import RootLayout from "./components/root-layout/RootLayout";
import ReduxProvider from "./lib/redux/provider";
import "./index.css";
// new branch
export default function App() {
  return (
    <MotionConfig transition={snappyTransition}>
      <ReduxProvider>
        <RootLayout />
      </ReduxProvider>
    </MotionConfig>
  );
}

const snappyTransition = {
  type: "spring",
  damping: 35,
  stiffness: 400,
  mass: 0.8,
};
