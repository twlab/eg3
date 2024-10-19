export function getColorSchemeType(scheme: any): string;
export function humanizeColorSchemeId(schemeId: any): any;
export function getColorSchemeLabel(scheme: any): string;
export function getColorSchemeSwatches(scheme: any): any;
export function getColorInterpolatorSwatches(interpolator: any): any[];
export function getInterpolatorConfig(interpolatorId: any): {
    id: string;
    colors: any[];
};
export function ColorSchemeSelectValue(props: any): import("react/jsx-runtime").JSX.Element;
export function ColorSchemeSelectOption(props: any): import("react/jsx-runtime").JSX.Element;
export function useOrdinalColorSchemes(): any;
export function useColorInterpolators(): any;
export function useLegacyQuantizeColors(): any[];
export function useBulletColors(): any[];
