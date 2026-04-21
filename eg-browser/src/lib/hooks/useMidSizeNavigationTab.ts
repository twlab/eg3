import { useAppDispatch } from "@/lib/redux/hooks";
import { setMidSizeNavigationTab } from "@/lib/redux/slices/navigationSlice";
import { useEffect } from "react";

export default function useMidSizeNavigationTab() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setMidSizeNavigationTab(true));

        return () => {

            dispatch(setMidSizeNavigationTab(false));
        };
    }, [dispatch]);
}
