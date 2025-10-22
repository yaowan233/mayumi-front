import React from "react";

export type GameMode = "osu" | "fruits" | "mania" | "taiko";

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
  return (
    <i
      className={`fa-extra-mode-${mode} ${className}`}
      style={{
        fontSize: size,
        color,
        display: "inline-block",
        verticalAlign: "middle",
      }}
      aria-label={mode}
    />
  );
};

export default GameModeIcon;
