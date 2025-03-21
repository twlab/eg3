import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import { undo, redo, clearHistory } from "./slices/undoRedoSlice";
import { selectCanUndo, selectCanRedo } from "./slices/browserSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useUndoRedo = () => {
    const dispatch = useAppDispatch();
    const canUndo = useAppSelector(selectCanUndo);
    const canRedo = useAppSelector(selectCanRedo);

    return {
        undo: () => dispatch(undo()),
        redo: () => dispatch(redo()),
        clearHistory: () => dispatch(clearHistory()),
        canUndo,
        canRedo
    };
};
