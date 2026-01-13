export default function TetrominoIcon({ piece = "T", size = 20, fill = "#9CA3AF" }) {
  const shapes = {
    I: [[0,1],[1,1],[2,1],[3,1]],
    O: [[1,0],[2,0],[1,1],[2,1]],
    T: [[1,0],[0,1],[1,1],[2,1]],
    S: [[1,0],[2,0],[0,1],[1,1]],
    Z: [[0,0],[1,0],[1,1],[2,1]],
    J: [[0,0],[0,1],[1,1],[2,1]],
    L: [[2,0],[0,1],[1,1],[2,1]],
  };
  const cells = shapes[piece] || shapes.T;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 4 4"
      aria-hidden
      style={{ display: "block" }}  // prevents weird inline spacing
    >
      {cells.map(([x,y], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={fill} rx={0.12} />
      ))}
    </svg>
  );
}
