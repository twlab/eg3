import { SVGProps } from 'react';
interface TranslatableGProps extends SVGProps<SVGGElement> {
    x?: number;
    y?: number;
    innerRef?(element: SVGGElement): void;
}
/**
 * Ever wish <g> elements accepted `x` and `y` attributes?  This one does!
 *
 * @param {TranslatableGProps} props - props as specified by React
 * @return {JSX.Element} - <g> element
 * @author Silas Hsu
 */
export declare function TranslatableG(props: TranslatableGProps): import("react/jsx-runtime").JSX.Element;
export {};
