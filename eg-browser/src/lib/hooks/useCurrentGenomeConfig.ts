import { useMemo } from "react";
import { getGenomeConfig } from "@eg/core";
import { useAppSelector } from "../redux/hooks";
import { selectCurrentSession } from "../redux/slices/browserSlice";

export default function useCurrentGenomeConfig() {
  const session = useAppSelector(selectCurrentSession);
  let genome = null
  if (session) {

    genome = session!.genome;
  }

  return useMemo(() => getGenomeConfig(genome), [genome]);
}
