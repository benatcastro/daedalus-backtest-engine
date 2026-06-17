import { Strategy } from "@prisma/client";

interface StrategySettingsProps {
    strategy: Strategy;
}

export default function StrategySettings({ strategy }: StrategySettingsProps) {
    return (
        <>
            <h3>Settings page for {strategy.name}</h3>
        </>
    );
}
