export default function Loading({ height }) {
  return (
    <div style={{ height: height }} className="flex items-center justify-center	text-2xl">
      <div className="loader"></div>
    </div>
  );
}
