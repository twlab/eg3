import React, { useState, useEffect } from "react";
import { FlankingStrategy } from "wuepgg3-track";

interface FlankingStratConfigProps {
  strategy: FlankingStrategy;
  onNewStrategy?: (newStrat: FlankingStrategy) => void;
}

const FlankingStratConfig: React.FC<FlankingStratConfigProps> = ({
  strategy,
  onNewStrategy = () => undefined,
}) => {
  const [upstreamStr, setUpstreamStr] = useState(String(strategy.upstream));
  const [downstreamStr, setDownstreamStr] = useState(
    String(strategy.downstream),
  );

  useEffect(() => {
    setUpstreamStr(String(strategy.upstream));
  }, [strategy.upstream]);
  useEffect(() => {
    setDownstreamStr(String(strategy.downstream));
  }, [strategy.downstream]);

  const inputChanged = (
    propToChange: keyof FlankingStrategy,
    value: number | string,
  ) => {
    const newStrat = strategy.cloneAndSetProp(propToChange, value);
    onNewStrategy(newStrat);
  };

  const inputCls =
    "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary w-24";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
        3. Set flanking region
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-primary dark:text-dark-primary">
          Upstream bases:
          <input
            type="number"
            min={0}
            value={upstreamStr}
            onChange={(e) => {
              setUpstreamStr(e.target.value);
              const val = Number.parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 0) inputChanged("upstream", val);
            }}
            className={inputCls}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-primary dark:text-dark-primary">
          Downstream bases:
          <input
            type="number"
            min={0}
            value={downstreamStr}
            onChange={(e) => {
              setDownstreamStr(e.target.value);
              const val = Number.parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 0) inputChanged("downstream", val);
            }}
            className={inputCls}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-primary dark:text-dark-primary">
          Surrounding:
          <select
            value={strategy.type}
            onChange={(event) =>
              inputChanged("type", Number.parseInt(event.target.value, 10))
            }
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value={FlankingStrategy.SURROUND_ALL}>Whole region</option>
            <option value={FlankingStrategy.SURROUND_START}>
              Region start
            </option>
            <option value={FlankingStrategy.SURROUND_END}>Region end</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default FlankingStratConfig;
