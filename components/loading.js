export default function Loading({height}) {
  return (
    <div style={{height: height}} className="flex items-center justify-center	text-2xl">
      <span className="loading loading-bars loading-lg"></span>
    </div>
  );
}
