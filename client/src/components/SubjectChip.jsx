export default function SubjectChip({ subject, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`chip ${selected ? 'selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(subject.id)}
    >
      <span
        className={`chip-dot ${selected ? 'selected-signal' : ''}`}
        style={selected ? undefined : { background: subject.color }}
      />
      {subject.name}
    </button>
  );
}
