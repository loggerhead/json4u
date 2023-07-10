"use client";

export default function MyButton({ onClick, children }) {
  return (
    <button onClick={onClick} className="button-action">
      {children}
    </button>
  );
}
