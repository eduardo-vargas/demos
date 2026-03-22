import './Loading.css';

export function Loading() {
  return (
    <div className="loading-container">
      <span className="loading-text" aria-label="Loading...">
        <span className="wave wave-1">L</span>
        <span className="wave wave-2">o</span>
        <span className="wave wave-3">a</span>
        <span className="wave wave-4">d</span>
        <span className="wave wave-5">i</span>
        <span className="wave wave-6">n</span>
        <span className="wave wave-7">g</span>
        <span className="wave wave-8">.</span>
        <span className="wave wave-9">.</span>
        <span className="wave wave-10">.</span>
      </span>
    </div>
  );
}
