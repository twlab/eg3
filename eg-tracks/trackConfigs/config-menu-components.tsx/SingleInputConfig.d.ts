import React from "react";
interface SingleInputConfigProps {
    optionName: string;
    label: string;
    defaultValue?: any;
    multiValue?: any;
    hasSetButton?: boolean;
    getInputElement?: any;
    optionsObjects?: any;
    onOptionSet?: any;
    trackId?: any;
}
declare const SingleInputConfig: React.FC<SingleInputConfigProps>;
export default SingleInputConfig;
