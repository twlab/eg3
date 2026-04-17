import React from "react";
import { getDisplayModeFunction } from "../displayModeComponentMap";

type Props = {
    children: React.ReactNode;
    fallbackRender?: (error: Error | null) => React.ReactNode;
    // optional draw-data that can be used to build an error display
    errorDrawData?: { [key: string]: any } | null;
};

type State = {
    hasError: boolean;
    error?: Error | null;
    fallbackElement?: React.ReactNode | null;
};

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, fallbackElement: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: any) {

        console.error("ErrorBoundary caught:", error, info);

        // If draw-data is provided, attempt to synchronously build a safe error display
        if (this.props.errorDrawData) {
            try {
                const drawData = {
                    ...this.props.errorDrawData,
                    errorInfo: this.props.errorDrawData.errorInfo || "error when rendering",
                };
                const node = getDisplayModeFunction(drawData);
                this.setState({ fallbackElement: node });
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error("ErrorBoundary failed creating fallback element:", err);
                this.setState({ fallbackElement: null });
            }
        }
    }

    reset = () => this.setState({ hasError: false, error: null, fallbackElement: null });

    render() {
        if (this.state.hasError) {

            if (this.state.fallbackElement) {
                return this.state.fallbackElement as any;
            }

            if (this.props.fallbackRender) {
                try {
                    return this.props.fallbackRender(this.state.error ?? null);
                } catch (err) {
                    // If fallbackRender itself throws, fall back to the simple UI below
                    // eslint-disable-next-line no-console
                    console.error("Error in fallbackRender:", err);
                }
            }
            return (
                <div style={{ padding: 8, color: "var(--font-color)", background: "rgba(255,0,0,0.02)", borderRadius: 4 }}>
                    <div style={{ marginBottom: 6 }}>Error rendering this track.</div>
                    <button onClick={this.reset} style={{ padding: "4px 8px" }}>
                        Retry
                    </button>
                </div>
            );
        }
        return this.props.children as any;
    }
}

export default ErrorBoundary;
