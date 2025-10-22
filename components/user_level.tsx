const tierGradients: Record<string, string> = {
  iron: "linear-gradient(#bab3ab, #bab3ab)",
  bronze: "linear-gradient(#b88f7a, #855c47)",
  silver: "linear-gradient(#e0e0eb, #a3a3c2)",
  gold: "linear-gradient(#f0e4a8, #e0c952)",
  platinum: "linear-gradient(#a8f0ef, #52e0df)",
  rhodium: "linear-gradient(#d9f8d3, #a0cf96)",
  radiant: "linear-gradient(#97dcff, #ed82ff)",
  lustrous: "linear-gradient(#ffe600, #ed82ff)",
};

export default function UserLevel({ level }: { level: number }) {
  let tier = "iron";
  if (level >= 110) tier = "lustrous";
  else if (level >= 105) tier = "radiant";
  else if (level >= 100) tier = "rhodium";
  else if (level >= 80) tier = "platinum";
  else if (level >= 60) tier = "gold";
  else if (level >= 40) tier = "silver";
  else if (level >= 20) tier = "bronze";

  return (
    <div
      className="relative flex items-center justify-center w-[50px] h-[50px]"
      title={`Level ${level}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: tierGradients[tier],
          clipPath:
            "path('m 25,2.7 a 9.3,9.3 0 0 1 4.7,1.2 l 11.3,6.5 a 9.3,9.3 0 0 1 4.6,8.1 v 13.0 a 9.3,9.3 0 0 1 -4.6,8.1 L 29.7,46.1 a 9.3,9.3 0 0 1 -9.3,0 L 9.1,39.6 A 9.3,9.3 0 0 1 4.4,31.5 v -13.0 A 9.3,9.3 0 0 1 9.1,10.4 L 20.4,3.9 A 9.3,9.3 0 0 1 25,2.7 M 25,0.0 A 11.9,11.9 0 0 0 19.0,1.6 L 7.7,8.1 A 12.0,12.0 0 0 0 1.7,18.5 v 13.0 a 12.0,12.0 0 0 0 6.0,10.4 l 11.3,6.5 a 12.0,12.0 0 0 0 12.0,0 l 11.3,-6.5 a 12.0,12.0 0 0 0 6.0,-10.4 v -13.0 A 12.0,12.0 0 0 0 42.3,8.1 L 31.0,1.6 A 11.9,11.9 0 0 0 25.0,0 Z')",
        }}
      />
      <span className="absolute text-white font-bold">{level}</span>
    </div>
  );
}
