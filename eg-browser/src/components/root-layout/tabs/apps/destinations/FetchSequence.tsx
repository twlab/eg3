import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  DisplayedRegionModel,
  TwoBitSource,
  CopyToClip,
  GenomeSerializer,
} from "wuepgg3-track";
import "./FetchSequence.css";
import useExpandedNavigationTab from "@/lib/hooks/useExpandedNavigationTab";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import NavigationContext from "wuepgg3-track/src/models/NavigationContext";

const SEQ_LIMIT = 10000; // 10kb

const defaultQueryList = `chr6:52425276-52425961
chr1:10001000-10001400`;

export const FetchSequence: React.FC = () => {
  useExpandedNavigationTab();
  const currentSession = useAppSelector(selectCurrentSession);
  const _genomeConfig = useCurrentGenome();
  const userViewRegion = currentSession?.userViewRegion;

  const genomeConfig = useMemo(
    () => (_genomeConfig ? GenomeSerializer.deserialize(_genomeConfig) : null),
    [_genomeConfig]
  );
  // Memoize selectedRegion to avoid unnecessary recalculation
  const selectedRegion = useMemo(() => {
    if (
      genomeConfig &&
      genomeConfig.navContext &&
      userViewRegion
    ) {

      const navContext = genomeConfig.navContext as NavigationContext;
      const parsed = navContext.parse(userViewRegion);
      const { start, end } = parsed;

      return new DisplayedRegionModel(genomeConfig.navContext, start, end);

    } else if (genomeConfig && genomeConfig.navContext) {
      return new DisplayedRegionModel(
        genomeConfig.navContext,
        ...genomeConfig.defaultRegion
      );
    }
    return null;
  }, [genomeConfig, userViewRegion]);

  const twoBitSourceRef = useRef<TwoBitSource | null>(null);
  const handleClearCurrentSeq = () => {
    setCurrentRegionSeq("");
  };
  useEffect(() => {
    if (genomeConfig?.twoBitURL) {
      twoBitSourceRef.current = new TwoBitSource(genomeConfig.twoBitURL);
    } else {
      twoBitSourceRef.current = null;
    }
  }, [genomeConfig?.twoBitURL]);

  const [currentRegionSeq, setCurrentRegionSeq] = useState<string>("");
  const [queryList, setQueryList] = useState<string>(defaultQueryList);
  const [listRegionSeq, setListRegionSeq] = useState<string>("");

  const fetchSequence = async (region: any): Promise<string | undefined> => {
    if (!twoBitSourceRef.current) {
      setCurrentRegionSeq("Genomic sequence is not added to this genome yet.");
      return;
    }
    try {
      const sequence = await twoBitSourceRef.current.getData(region);
      return sequence[0].sequence;
    } catch (error: any) {
      return error.toString();
    }
  };

  const handleCurrentFetch = async () => {
    if (!selectedRegion) {
      setCurrentRegionSeq("No region selected.");
      return;
    }
    setCurrentRegionSeq("Loading...");
    const seq = await fetchSequence(selectedRegion);
    setCurrentRegionSeq(seq || "");
  };

  const handleListFetch = async () => {
    setListRegionSeq("Loading...");
    const inputListRaw = queryList.trim().split("\n");
    const inputListRaw2 = inputListRaw.map((item) => item.trim());
    const inputList = inputListRaw2.filter((item) => item !== "");
    if (inputList.length > 100) {
      window.alert("Input list too long (> 100)");
      setListRegionSeq("");
      return null;
    }
    if (!selectedRegion) {
      window.alert("No region context available.");
      setListRegionSeq("");
      return null;
    }
    const context = selectedRegion.getNavigationContext();
    if (inputList.length === 0) {
      window.alert(
        "Input content is empty or cannot find any location on genome"
      );
      setListRegionSeq("");
      return null;
    }
    const promise = inputList.map((symbol) => {
      try {
        const interval = context.parse(symbol);
        if (interval && interval.getLength() <= SEQ_LIMIT) {
          const reg = new DisplayedRegionModel(context, ...interval);
          return fetchSequence(reg);
        }
      } catch (error) {
        return Promise.resolve("");
      }
      return Promise.resolve("");
    });
    const seqs = await Promise.all(promise);
    const seqFasta = seqs.map((seq, i) => `>${inputList[i]}\n${seq}`);
    setListRegionSeq(seqFasta.join("\n"));
  };

  const handleListChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQueryList(event.target.value);
  };

  const resetList = () => {
    setQueryList("");
  };

  const renderOversize = () => (
    <div>
      Sorry, region length greater than 10KB, please choose a smaller region.
    </div>
  );

  const renderCurrentFetch = () => {
    if (!selectedRegion) return null;

    // if (selectedRegion.getWidth() > SEQ_LIMIT) {
    //   return renderOversize();
    // }
    const region = selectedRegion.currentRegionAsString();
    const seq = currentRegionSeq ? `>${region}\n${currentRegionSeq}` : "";
    return (
      <div>
        <p>Fetch sequence for current view region {region}:</p>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <button
            className="btn btn-sm btn-success"
            onClick={handleCurrentFetch}
          >
            Fetch
          </button>
          {seq && (
            <>
              <CopyToClip value={seq} />
              <button
                className="btn btn-sm btn-secondary"
                onClick={handleClearCurrentSeq}
              >
                Clear
              </button>
            </>
          )}
        </div>
        <div className="FetchSequence-seq">
          {seq.split("\n").map((item, key) => (
            <React.Fragment key={key}>
              {item}
              <br />
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  const styles = {
    container: {
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto",
      padding: "20px",
      background: "#fff",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px",
    },
    inputContainer: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontWeight: "bold",
      marginBottom: "8px",
    },

    separator: {
      borderTop: "1px solid #eee",
      margin: "20px 0",
    },
    textarea: {
      width: "100%",
      border: "1.5px solid #bbb",
      borderRadius: "6px",
      padding: "8px",
      fontSize: "1rem",
      fontFamily: "monospace",
      marginBottom: "12px",
      boxSizing: "border-box" as const,
      resize: "vertical" as const,
    },
  };
  useEffect(() => {
    setCurrentRegionSeq("");
  }, [selectedRegion]);
  const renderBatchFetch = () => (
    <div style={{ marginTop: "20px" }}>
      <div style={styles.separator}></div>
      <div style={styles.label}>
        or input a list of coordinates to fetch sequence (max 100 regions, each
        should less than 10KB, regions longer than 10Kb would be ignored):
      </div>
      <textarea
        style={styles.textarea}
        value={queryList}
        onChange={handleListChange}
        rows={10}
        cols={40}
      />
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <button className="btn btn-sm btn-primary" onClick={handleListFetch}>
          Batch fetch
        </button>
        <button className="btn btn-sm btn-secondary" onClick={resetList}>
          Reset
        </button>
        {listRegionSeq && <CopyToClip value={listRegionSeq} />}
      </div>
      <div className="FetchSequence-seq">
        {listRegionSeq.split("\n").map((item, key) => (
          <React.Fragment key={key}>
            {item}
            <br />
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.label}>
        To fetch a sequence, choose a region shorter or equal to 10Kb, or input
        a list of coordinates each less than 10Kb.
      </div>
      {renderCurrentFetch()}
      {renderBatchFetch()}
    </div>
  );
};

export default FetchSequence;
