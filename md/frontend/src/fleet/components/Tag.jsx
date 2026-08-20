export default function Tag({ label, color, bg }) {
  return (
    <span className="tag" style={{ background: bg, color }}>
      {label}
    </span>
  );
}
