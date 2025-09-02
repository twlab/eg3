import { MotionConfig } from "framer-motion";
import RootLayout, {
  RootLayoutProps,
} from "./components/root-layout/RootLayout";
import ReduxProvider from "./lib/redux/provider";

export default function App(props: RootLayoutProps = {}) {
  return (
    <MotionConfig transition={snappyTransition}>
      <ReduxProvider>
        <RootLayout {...props} />
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
