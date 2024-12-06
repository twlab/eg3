import { store } from "./store";
import { Provider } from "react-redux";

export default function ReduxProvider({
    children,
}: {
    children: React.ReactNode;
}): JSX.Element {
    return <Provider store={store}>{children}</Provider>;
}
