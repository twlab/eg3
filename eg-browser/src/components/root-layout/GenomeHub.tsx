import { useEffect } from "react";
import {
  GenomeSerializer,
  IGenome,
  ITrackModel,
  getConfig,
  getGenomeConfig,
} from "wuepgg3-track";
import {
  setNavBarVisibility,
  setNavigatorVisibility,
} from "../../lib/redux/slices/settingsSlice";
import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import {
  createSession,
  selectCurrentSessionId,
  updateCurrentSession,
} from "../../lib/redux/slices/browserSlice";
import { GenomeConfig } from "wuepgg3-track/src/models/genomes/GenomeConfig";
import App from "../../App";

export interface TracksProps {
  url?: string;
  name?: string;
  options?: { [key: string]: any };
  type: string;
  showOnHubLoad?: boolean;
  metadata?: { [key: string]: any };
}

export interface GenomeHubProps {
  viewRegion?: string | null | undefined;
  genomeName?: string;
  tracks?: TracksProps[] | ITrackModel[];
  windowWidth?: number;
  customGenome?: any;
  showGenomeNavigator?: boolean;
  showNavBar?: boolean;
  showToolBar?: boolean;
}

function GenomeHub(props: GenomeHubProps) {
  const sessionId = useAppSelector(selectCurrentSessionId);
  const dispatch = useAppDispatch();
  function getConfig() {
    if (props.customGenome) {
      try {
        return GenomeSerializer.deserialize(props.customGenome);
      } catch {
        return null;
      }
    }
    if (props.genomeName) {
      return getGenomeConfig(props.genomeName);
    }
    return null;
  }

  useEffect(() => {
    if (
      (props.genomeName && props.tracks && props.viewRegion) ||
      props.customGenome
    ) {
      const genomeConfig: GenomeConfig | null = getConfig();
      if (genomeConfig) {
        dispatch(
          setNavigatorVisibility(
            typeof props.showGenomeNavigator === "boolean"
              ? props.showGenomeNavigator
              : true
          )
        );
        dispatch(
          setNavBarVisibility(
            typeof props.showNavBar === "boolean" ? props.showNavBar : true
          )
        );
        if (!sessionId) {
          if (genomeConfig?.genome) {
            const genome = GenomeSerializer.serialize(genomeConfig);

            let additionalTracks: ITrackModel[] = props.tracks as ITrackModel[];

            dispatch(
              createSession({
                genome,
                viewRegion:
                  typeof props.viewRegion === "string" ||
                  props.viewRegion === null
                    ? undefined
                    : props.viewRegion,
                additionalTracks,
              })
            );
          }
        } else {
          dispatch(
            updateCurrentSession({
              tracks: props.tracks as ITrackModel[],
              viewRegion:
                typeof props.viewRegion === "string" ||
                props.viewRegion === null
                  ? undefined
                  : props.viewRegion,

              genomeId: props.genomeName,
              customGenome: props.customGenome,
            })
          );
        }
      }
    }
  }, [props]);

  return (
    <div>
      <App />
    </div>
  );
}
export default GenomeHub;
