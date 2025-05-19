import { useEffect, useState } from "react";

import {
  IGenome,
  GenomeSerializer,
  GenomeHubManager,
  getGenomeConfig,
} from "wuepgg3-track";

export default function useGenome(genomeId: string) {
  const [genome, setGenome] = useState<IGenome | null>(() => {
    if (!genomeId) {
      return null;
    }

    return GenomeHubManager.getInstance().getGenomeFromCache(genomeId) ?? null;
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!genomeId) {
      if (genome) {
        setGenome(null);
      }
      return;
    }

    if (genome?.id === genomeId) return;

    const defaultGenome = getGenomeConfig(genomeId);

    if (defaultGenome && defaultGenome.genome) {
      setGenome(GenomeSerializer.serialize(defaultGenome));
    } else {
      GenomeHubManager.getInstance()
        .getGenomeById(genomeId)
        .then((genome) => {
          setGenome(genome);
        })
        .catch((error) => {
          setError(error);
        });
    }
  }, [genomeId]);

  return { genome, error };
}
