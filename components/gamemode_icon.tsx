import React from "react";

export type GameMode = "osu" | "fruits" | "mania" | "taiko" | "all";

interface GameModeIconProps {
    mode: GameMode;
    size?: number;
    color?: string;
    className?: string;
}

export const GameModeIcon: React.FC<GameModeIconProps> = ({
                                                              mode,
                                                              size = 24,
                                                              color = "white",
                                                              className = "",
                                                          }) => {
    if (mode === "all") {
        return (
            <span
                className={className}
                style={{
                    fontSize: size,
                    color,
                    display: "inline-block",
                    verticalAlign: "middle",
                    fontWeight: "bold",
                    lineHeight: 1,
                }}
                aria-label="all"
            >
                ∞
            </span>
        );
    }
    return (
        <i
            className={`fa-extra-mode-${mode} ${className}`}
            style={{
                fontSize: size,
                color,
                display: "inline-block",
                verticalAlign: "middle",
                transition: "color 0.2s ease",
            }}
            aria-label={mode}
        />
    );
};

export default GameModeIcon;
