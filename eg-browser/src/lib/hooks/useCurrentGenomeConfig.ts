import { useMemo } from "react";
import { getGenomeConfig } from "@eg/core";
import { useAppSelector } from "../redux/hooks";
import { selectCurrentSession } from "../redux/slices/browserSlice";

export default function useCurrentGenomeConfig() {
  const session = useAppSelector(selectCurrentSession);
  const genome = session?.genome;
  let genome = null
  if (session) {

    genome = session!.genome;
  }

  return useMemo(() => genome ? getGenomeConfig(genome) : null, [genome]);
}
