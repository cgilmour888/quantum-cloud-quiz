import { AutoFitText } from './AutoFitText.jsx';
import { localGeometryStyle } from './tabletA23Geometry.js';

const TONES = ['cyan', 'magenta', 'emerald', 'orange'];

export function TabletAnswerOption({ geometry, option, state = 'idle', disabled, checked, role, onActivate, detail = '' }) {
  const empty = !option;
  const tone = TONES[geometry.slot] ?? 'cyan';
  const bakedKeyMatches = option?.key === geometry.bakedKey;
  const glyph = state === 'correct-selected' || state === 'correct-answer' ? '✓' : state === 'incorrect-selected' ? '×' : state === 'selected' ? '◆' : '';
  return (
    <>
      <span className="qcq-a23-answer-neutralizer" data-tone={tone} style={localGeometryStyle(geometry.text)} aria-hidden="true" />
      {!empty && !bakedKeyMatches && <span className="qcq-a23-badge-neutralizer" style={localGeometryStyle(geometry.badge)} aria-hidden="true" />}
      {!empty && !bakedKeyMatches && <span className="qcq-a23-dynamic-key" data-tone={tone} style={localGeometryStyle(geometry.badge)}>{option.key}</span>}
      {!empty && (
        <span className="qcq-a23-answer-copy" data-tone={tone} data-state={state} style={localGeometryStyle(geometry.text)} aria-hidden="true">
          <AutoFitText min={22} max={42} className="qcq-a23-answer-copy__text">{option.text}</AutoFitText>
          {detail && <span className="qcq-a23-answer-copy__detail">{detail}</span>}
          {glyph && <span className="qcq-a23-answer-copy__glyph">{glyph}</span>}
        </span>
      )}
      <button
        type="button"
        className="qcq-a23-answer-hit"
        data-tone={tone}
        data-state={state}
        data-empty={empty ? 'true' : 'false'}
        style={localGeometryStyle(geometry.hit)}
        disabled={disabled || empty}
        role={role}
        aria-checked={checked}
        aria-label={empty ? undefined : `${option.key}. ${option.text}${detail ? `, ${detail}` : ''}`}
        onClick={onActivate}
      />
    </>
  );
}
