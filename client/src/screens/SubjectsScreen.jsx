import { useMemo, useState } from 'react';

const COLORS = ['#5B8FE8', '#E07B54', '#54B08A', '#A778DB', '#E8B84B', '#E06B8A'];

export default function SubjectsScreen({ subjects, onAdd, onDelete }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const canSave = name.trim().length > 0;

  const empty = useMemo(() => !subjects.length, [subjects]);

  return (
    <div>
      <div className="topbar">
        <h1 className="title">Subjects</h1>
      </div>

      <div className="list-panel">
        {subjects.map((subject) => (
          <div className="subject-row" key={subject.id}>
            <div className="subject-name">
              <span className="chip-dot" style={{ background: subject.color }} />
              <strong>{subject.name}</strong>
            </div>
            <button type="button" onClick={() => onDelete(subject.id)} style={{ border: 'none', background: 'transparent', color: '#ff6464' }}>
              🗑
            </button>
          </div>
        ))}
        {empty && <p className="list-note">No subjects found. Add your first subject below.</p>}
      </div>

      <div className="list-panel" style={{ marginTop: '20px' }}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Subject name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="swatch-row">
            {COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className={`swatch ${color === swatch ? 'selected' : ''}`}
                style={{ background: swatch }}
                onClick={() => setColor(swatch)}
              />
            ))}
          </div>
          <button
            type="button"
            className="save-button primary-button"
            disabled={!canSave}
            onClick={() => {
              onAdd({ name: name.trim(), color });
              setName('');
            }}
          >
            Save subject
          </button>
        </div>
      </div>
    </div>
  );
}
