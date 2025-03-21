import { useAppDispatch, useAppSelector } from "../../../../../lib/redux/hooks";
import { selectCurrentSession } from "../../../../../lib/redux/slices/browserSlice";
import { selectCustomTracksPool } from "../../../../../lib/redux/slices/hubSlice";

export default function Session() {
  const dispatch = useAppDispatch();
  const customTracksPool = useAppSelector(selectCustomTracksPool);
  const currentSession = useAppSelector(selectCurrentSession);

  return (
    <div className="p-4">
      <h2 className="text-xl">Session</h2>
      <p>Session placeholder component</p>
    </div>
  );
}
