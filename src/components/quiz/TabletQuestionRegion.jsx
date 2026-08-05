import { AutoFitText } from './AutoFitText.jsx';
import { A23_REGIONS, localGeometryStyle } from './tabletA23Geometry.js';

export function TabletQuestionRegion({ title, prompt, action, selectionInstruction = '' }) {
  const TitleTag = action ? 'button' : 'div';
  return (
    <>
      <TitleTag
        type={action ? 'button' : undefined}
        className="qcq-a23-title"
        style={localGeometryStyle(A23_REGIONS.title)}
        onClick={action}
      >
        <AutoFitText min={28} max={58} className="qcq-a23-title__text">{title}</AutoFitText>
      </TitleTag>
      <div className="qcq-a23-prompt" style={localGeometryStyle(A23_REGIONS.prompt)} aria-live="polite">
        <AutoFitText min={24} max={46} className="qcq-a23-prompt__text">{prompt}</AutoFitText>
        {selectionInstruction && <span className="qcq-a23-selection-instruction">{selectionInstruction}</span>}
      </div>
    </>
  );
}
