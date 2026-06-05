export default function SubjectChip({ subject, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`chip ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(subject.id)}
    >
      <span className="chip-dot" style={{ background: subject.color }} />
      {subject.name}
    </button>
  );
}
