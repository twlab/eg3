import { default as React } from 'react';
interface SelectConfigProps {
    choices: any;
    defaultValue?: any;
    optionName: string;
    optionsObjects: any[];
    label: string;
    onOptionSet: (optionName: string, value: string | number) => void;
}
declare const SelectConfig: React.FC<SelectConfigProps>;
export default SelectConfig;
