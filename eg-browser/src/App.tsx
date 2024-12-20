import { MotionConfig } from 'framer-motion';
import RootLayout from './components/root-layout/RootLayout';
import ReduxProvider from './lib/redux/provider';

export default function App() {
  return (
    <MotionConfig transition={snappyTransition}>
      <ReduxProvider>
        <RootLayout />
      </ReduxProvider>
    </MotionConfig>
  )
}

const snappyTransition = {
  type: 'spring',
  damping: 30,
  stiffness: 400,
  mass: 0.8
}
