import { MotionConfig } from "framer-motion";
import RootLayout from "./components/root-layout/RootLayout";
import RootLayoutTest from "./components/root-layout/RootLayoutTest";
import ReduxProvider from "./lib/redux/provider";

// const USE_TEST_COMPONENT = false; // Toggle this to switch between test and normal mode

export default function App() {
  return (
    <MotionConfig transition={snappyTransition}>
      <ReduxProvider>
        {/* {USE_TEST_COMPONENT ? (
          <RootLayoutTest />
        ) : ( */}
        <RootLayout />
        {/* )} */}
      </ReduxProvider>
    </MotionConfig>
  );
}

const snappyTransition: any = {
  type: "spring",
  damping: 35,
  stiffness: 400,
  mass: 0.8,
};
