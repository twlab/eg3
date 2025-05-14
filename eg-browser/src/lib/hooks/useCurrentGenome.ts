import { useAppSelector } from "../redux/hooks";
import { selectCurrentSession } from "../redux/slices/browserSlice";
import { IGenome } from "@eg/trackstest";
import useGenome from "./useGenome";

export default function useCurrentGenome(): IGenome | null {
  const session = useAppSelector(selectCurrentSession);
  const genomeId = session?.genomeId;

  const { genome } = useGenome(genomeId ?? "");
  return genome;
}
