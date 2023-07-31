"use client";

export default function Toggler({ hidden, onClick }) {
  return (
    <a href="#" onClick={onClick}>
      {hidden ? "⇤" : "⇥"}
    </a>
  );
}
