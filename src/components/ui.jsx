import { useEffect, useId, useState } from 'react';
import { clamp } from '../lib/workout.js';

const labelClass = 'mb-2 block text-[10px] uppercase tracking-[0.28em] text-sand';

export function Section({ title, icon, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-sand">
        {icon}
        <span>{title}</span>
        <div className="ml-1 h-px flex-1 bg-ink/10" />
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function RangeField({ label, value, onChange, min, max, step, format }) {
  const id = useId();
  const fmt = format ?? ((v) => v);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
        <span className="font-italic text-lg text-rust">{fmt(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        className="brand-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="mt-1 flex justify-between text-[10px] tracking-wider text-sand">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}

export function NumberField({ label, value, onChange, min, max }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const n = Number(draft);
    if (draft.trim() === '' || Number.isNaN(n)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(Math.round(n), min, max);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const step = (delta) => onChange(clamp(value + delta, min, max));

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="flex items-center rounded-lg border border-ink/20 bg-paper">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="flex h-11 w-11 items-center justify-center text-lg transition hover:bg-black/5 disabled:opacity-30"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={draft}
          min={min}
          max={max}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="h-11 w-full bg-transparent text-center text-lg font-medium text-ink outline-none"
        />
        <button
          type="button"
          onClick={() => step(1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="flex h-11 w-11 items-center justify-center text-lg transition hover:bg-black/5 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-lg bg-ink/[0.06] p-1">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm transition ${
                active ? 'bg-ink text-paper' : 'text-ink hover:bg-ink/5'
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SwitchRow({ label, description, value, onChange }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div id={id} className="text-sm text-ink">
          {label}
        </div>
        <div className="text-xs text-sand">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-labelledby={id}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${value ? 'bg-ink' : 'bg-ink/20'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full shadow transition-all ${
            value ? 'left-6 bg-rust' : 'left-1 bg-cream'
          }`}
        />
      </button>
    </div>
  );
}

export function PresetButton({ name, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-lift rounded-lg border border-ink/15 bg-paper px-3 py-3 text-left"
    >
      <div className="text-sm font-medium text-ink">{name}</div>
      <div className="mt-0.5 text-[10px] tracking-wider text-sand">{desc}</div>
    </button>
  );
}
