export default UndoRedo;
/**
 * a component to undo, redo one user's operation on trackContainer
 * @author Daofeng Li
 */
declare function UndoRedo({ canUndo, canRedo, onUndo, onRedo }: {
    canUndo: any;
    canRedo: any;
    onUndo: any;
    onRedo: any;
}): import("react/jsx-runtime").JSX.Element;
