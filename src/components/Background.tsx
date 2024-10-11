interface BackgroundProps {
  className?: string;
  size?: number;
  variant?: "lines" | "dots";
}

// stolen from xyflow <Background>
export default function Background({ className, size = 15, variant = "lines" }: BackgroundProps) {
  return (
    <svg
      className={className}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        left: 0,
        top: 0,
        zIndex: -1,
      }}
    >
      <pattern
        id="tbl-pattern-1"
        x="5"
        y="5"
        width={size}
        height={size}
        patternUnits="userSpaceOnUse"
        patternTransform="translate(-1,-1)"
      >
        {variant === "lines" ? (
          <path stroke="#eee" strokeWidth="1" d={`M10 0 V${size} M0 10 H${size}`} />
        ) : (
          <circle fill="rgb(145, 145, 154)" cx={0.5} cy={0.5} r={0.5} />
        )}
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#tbl-pattern-1)" />
    </svg>
  );
}
