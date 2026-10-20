import { useEffect, useRef } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Gauge,
  Mic2,
  RotateCcw,
  Target,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { MAX_NUMBER, PRESETS } from '../lib/workout.js';
import {
  NumberField,
  PresetButton,
  RangeField,
  SegmentedControl,
  Section,
  SwitchRow,
} from './ui.jsx';

export default function SettingsDrawer({ settings, update, restoreDefaults, speech, onClose }) {
  const closeRef = useRef(null);
  const s = settings;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <>
      <div
        className="backdrop-in fixed inset-0 z-40 bg-ink/35 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Fine tune settings"
        className="drawer-in hide-scrollbar fixed bottom-0 right-0 top-0 z-50 w-full max-w-md overflow-y-auto bg-cream shadow-[-20px_0_60px_rgba(28,25,23,0.15)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/10 bg-cream/95 px-6 py-5 backdrop-blur-md">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-sand">adjust</div>
            <h2 className="font-italic text-2xl leading-tight">Fine tune</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-black/5"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-10 px-6 py-8 pb-16">
          <Section title="Presets" icon={<Zap className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <PresetButton key={p.key} name={p.name} desc={p.desc} onClick={() => update(p.values)} />
              ))}
            </div>
          </Section>

          <Section title="Range" icon={<Target className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Start"
                value={s.startNum}
                min={0}
                max={s.endNum - 1}
                onChange={(v) => update({ startNum: v })}
              />
              <NumberField
                label="End"
                value={s.endNum}
                min={s.startNum + 1}
                max={MAX_NUMBER}
                onChange={(v) => update({ endNum: v })}
              />
            </div>
            <SegmentedControl
              label="Direction"
              value={s.countDirection}
              onChange={(v) => update({ countDirection: v })}
              options={[
                { value: 'up', label: 'Count up', icon: <ArrowUp className="h-3.5 w-3.5" /> },
                { value: 'down', label: 'Count down', icon: <ArrowDown className="h-3.5 w-3.5" /> },
              ]}
            />
            <p className="text-[11px] text-sand">Changing the range or direction resets the session.</p>
          </Section>

          <Section title="Timing" icon={<Gauge className="h-3.5 w-3.5" />}>
            <RangeField
              label="Count interval"
              value={s.countInterval}
              onChange={(v) => update({ countInterval: v })}
              min={0.3}
              max={5}
              step={0.1}
              format={(v) => `${v.toFixed(1)}s`}
            />
            <RangeField
              label="Rest after every"
              value={s.gapEvery}
              onChange={(v) => update({ gapEvery: v })}
              min={1}
              max={100}
              step={1}
              format={(v) => `${v} reps`}
            />
            <RangeField
              label="Rest duration"
              value={s.gapDuration}
              onChange={(v) => update({ gapDuration: v })}
              min={0}
              max={30}
              step={0.5}
              format={(v) => (v === 0 ? 'none' : `${v.toFixed(1)}s`)}
            />
            <RangeField
              label="Pre-start countdown"
              value={s.preCountdownLen}
              onChange={(v) => update({ preCountdownLen: v })}
              min={0}
              max={10}
              step={1}
              format={(v) => (v === 0 ? 'off' : `${v}s`)}
            />
          </Section>

          <Section title="Voice" icon={<Mic2 className="h-3.5 w-3.5" />}>
            {!speech.supported && (
              <p className="rounded-lg bg-rust/10 px-3 py-2 text-xs text-rust">
                This browser has no speech synthesis. Beep cues still work.
              </p>
            )}
            <div>
              <label htmlFor="voice-select" className="mb-2 block text-[10px] uppercase tracking-[0.28em] text-sand">
                Voice selection
              </label>
              <select
                id="voice-select"
                value={speech.selectedURI}
                onChange={(e) => update({ voiceURI: e.target.value })}
                disabled={speech.voices.length === 0}
                className="brand-select w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 pr-8 text-sm text-ink"
              >
                {speech.voices.length === 0 && <option value="">No voices available</option>}
                {speech.voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} · {v.lang}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-sand">
                {s.showAllVoices
                  ? 'Showing every voice on this device.'
                  : 'Filtered to likely male voices. Availability varies by device.'}
              </p>
            </div>
            <SwitchRow
              label="Show all voices"
              description="Include voices not detected as male"
              value={s.showAllVoices}
              onChange={(v) => update({ showAllVoices: v })}
            />
            <RangeField
              label="Speech rate"
              value={s.voiceRate}
              onChange={(v) => update({ voiceRate: v })}
              min={0.5}
              max={2}
              step={0.05}
              format={(v) => `${v.toFixed(2)}x`}
            />
            <RangeField
              label="Pitch"
              value={s.voicePitch}
              onChange={(v) => update({ voicePitch: v })}
              min={0.5}
              max={2}
              step={0.05}
              format={(v) => v.toFixed(2)}
            />
            <RangeField
              label="Volume"
              value={s.voiceVolume}
              onChange={(v) => update({ voiceVolume: v })}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <button
              type="button"
              onClick={() => {
                speech.unlock();
                speech.speak('One. Two. Three. Ready to work.');
              }}
              className="btn-lift flex w-full items-center justify-center gap-2 rounded-full border border-ink/20 bg-paper py-3 text-sm"
            >
              <Volume2 className="h-4 w-4" />
              Test voice
            </button>
          </Section>

          <Section title="Options" icon={<Check className="h-3.5 w-3.5" />}>
            <SwitchRow
              label="Voice cues"
              description="Speak every count aloud"
              value={s.voiceEnabled}
              onChange={(v) => update({ voiceEnabled: v })}
            />
            <SwitchRow
              label="Beep cues"
              description="Tone at the start and end of each rest"
              value={s.beepEnabled}
              onChange={(v) => update({ beepEnabled: v })}
            />
            <SwitchRow
              label="Announce rest"
              description="Say “rest” at each gap"
              value={s.announceRest}
              onChange={(v) => update({ announceRest: v })}
            />
            <SwitchRow
              label="Rest countdown"
              description="Speak 3, 2, 1 at the end of longer rests"
              value={s.restCountdown}
              onChange={(v) => update({ restCountdown: v })}
            />
          </Section>

          <button
            type="button"
            onClick={restoreDefaults}
            className="btn-lift flex w-full items-center justify-center gap-2 rounded-full border border-ink/20 py-3 text-sm text-umber"
          >
            <RotateCcw className="h-4 w-4" />
            Restore defaults
          </button>

          <div className="pt-2 text-center">
            <p className="font-italic text-lg text-sand">change what you need,</p>
            <p className="font-italic text-lg text-sand">keep what serves you.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
