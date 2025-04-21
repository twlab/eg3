import { useAppDispatch } from "@/lib/redux/hooks";
import { setExpandNavigationTab } from "@/lib/redux/slices/navigationSlice";
import { useEffect } from "react";

export default function useExpandedNavigationTab() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setExpandNavigationTab(true));

        return () => {

            dispatch(setExpandNavigationTab(false));
        };
    }, [dispatch]);
}
