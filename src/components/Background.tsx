interface BackgroundProps {
  size?: number;
}

// stolen from xyflow <Background>
export default function Background({ size = 15 }: BackgroundProps) {
  return (
    <svg
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
        <path stroke="#eee" strokeWidth="1" d={`M10 0 V${size} M0 10 H${size}`} />
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#tbl-pattern-1)" />
    </svg>
  );
}
