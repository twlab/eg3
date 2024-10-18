import { default as PropTypes } from 'prop-types';
export function SliderRail({ getRailProps }: {
    getRailProps: any;
}): import("react/jsx-runtime").JSX.Element;
export namespace SliderRail {
    namespace propTypes {
        let getRailProps: PropTypes.Validator<(...args: any[]) => any>;
    }
}
export function Handle({ domain: [min, max], handle: { id, value, percent }, disabled, getHandleProps, }: {
    domain: [any, any];
    handle: {
        id: any;
        value: any;
        percent: any;
    };
    disabled: any;
    getHandleProps: any;
}): import("react/jsx-runtime").JSX.Element;
export namespace Handle {
    export namespace propTypes_1 {
        let domain: PropTypes.Validator<any[]>;
        let handle: PropTypes.Validator<NonNullable<PropTypes.InferProps<{
            id: PropTypes.Validator<string>;
            value: PropTypes.Validator<number>;
            percent: PropTypes.Validator<number>;
        }>>>;
        let getHandleProps: PropTypes.Validator<(...args: any[]) => any>;
        let disabled: PropTypes.Requireable<boolean>;
    }
    export { propTypes_1 as propTypes };
    export namespace defaultProps {
        let disabled_1: boolean;
        export { disabled_1 as disabled };
    }
}
export function KeyboardHandle({ domain: [min, max], handle: { id, value, percent }, disabled, getHandleProps, }: {
    domain: [any, any];
    handle: {
        id: any;
        value: any;
        percent: any;
    };
    disabled: any;
    getHandleProps: any;
}): import("react/jsx-runtime").JSX.Element;
export namespace KeyboardHandle {
    export namespace propTypes_2 {
        let domain_1: PropTypes.Validator<any[]>;
        export { domain_1 as domain };
        let handle_1: PropTypes.Validator<NonNullable<PropTypes.InferProps<{
            id: PropTypes.Validator<string>;
            value: PropTypes.Validator<number>;
            percent: PropTypes.Validator<number>;
        }>>>;
        export { handle_1 as handle };
        let getHandleProps_1: PropTypes.Validator<(...args: any[]) => any>;
        export { getHandleProps_1 as getHandleProps };
        let disabled_2: PropTypes.Requireable<boolean>;
        export { disabled_2 as disabled };
    }
    export { propTypes_2 as propTypes };
    export namespace defaultProps_1 {
        let disabled_3: boolean;
        export { disabled_3 as disabled };
    }
    export { defaultProps_1 as defaultProps };
}
export function Track({ source, target, getTrackProps, disabled }: {
    source: any;
    target: any;
    getTrackProps: any;
    disabled: any;
}): import("react/jsx-runtime").JSX.Element;
export namespace Track {
    export namespace propTypes_3 {
        export let source: PropTypes.Validator<NonNullable<PropTypes.InferProps<{
            id: PropTypes.Validator<string>;
            value: PropTypes.Validator<number>;
            percent: PropTypes.Validator<number>;
        }>>>;
        export let target: PropTypes.Validator<NonNullable<PropTypes.InferProps<{
            id: PropTypes.Validator<string>;
            value: PropTypes.Validator<number>;
            percent: PropTypes.Validator<number>;
        }>>>;
        export let getTrackProps: PropTypes.Validator<(...args: any[]) => any>;
        let disabled_4: PropTypes.Requireable<boolean>;
        export { disabled_4 as disabled };
    }
    export { propTypes_3 as propTypes };
    export namespace defaultProps_2 {
        let disabled_5: boolean;
        export { disabled_5 as disabled };
    }
    export { defaultProps_2 as defaultProps };
}
export function Tick({ tick, count, format }: {
    tick: any;
    count: any;
    format: any;
}): import("react/jsx-runtime").JSX.Element;
export namespace Tick {
    export namespace propTypes_4 {
        let tick: PropTypes.Validator<NonNullable<PropTypes.InferProps<{
            id: PropTypes.Validator<string>;
            value: PropTypes.Validator<number>;
            percent: PropTypes.Validator<number>;
        }>>>;
        let count: PropTypes.Validator<number>;
        let format: PropTypes.Validator<(...args: any[]) => any>;
    }
    export { propTypes_4 as propTypes };
    export namespace defaultProps_3 {
        export function format_1(d: any): any;
        export { format_1 as format };
    }
    export { defaultProps_3 as defaultProps };
}
