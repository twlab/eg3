import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import ShareUI from "@/components/GenomeView/TabComponents/ShareUI";

export default function Share({ params }: NavigationComponentProps) {
    const {
        state,
    } = useGenome();

    return (
        <ShareUI
            browser={state}
            color="#222"
            background="white"
        />
    );
} 