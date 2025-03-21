import React, { Component, ErrorInfo } from 'react';
import Button from '@/components/ui/button/Button';
import Logo from '@/assets/logo.png';

interface Props {
    children: React.ReactNode;
    onGoHome: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class GenomeErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Genome View Error:', error);
        console.error('Error Info:', errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col gap-4 flex-1 justify-center items-center text-primary">
                    <img src={Logo} alt="logo" className="size-16" />
                    <h1 className="text-2xl">Something went wrong!</h1>
                    <p className="text-center">{this.state.error?.message}</p>
                    <div className="flex flex-row gap-2">
                        <Button
                            backgroundColor="tint"
                            onClick={this.handleReset}
                        >
                            Try Again
                        </Button>
                        <Button
                            backgroundColor="tint"
                            onClick={this.props.onGoHome}
                        >
                            Go to Home
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
