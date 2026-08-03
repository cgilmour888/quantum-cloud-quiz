import { useMemo } from 'react';
import { placardHitStyle } from './placardGeometry.js';
import {
  SceneEvents,
  dispatchSceneEvent,
} from '../sceneEvents.js';

function dispatch(targetRef, eventName, detail = {}) {
  const target = targetRef?.current ?? globalThis.document?.documentElement;
  return dispatchSceneEvent(target, eventName, detail);
}

const PLACARD_EVENT_DETAIL = Object.freeze({
  geometryAuthority: 'lower-purple-trim',
  visualOwner: 'border-frame-engine',
});

export function PlacardControl({ eventTargetRef, active = false, onActivate }) {
  const hitStyle = useMemo(placardHitStyle, []);

  function handlePointerEnter() {
    dispatch(eventTargetRef, SceneEvents.PLACARD_HOVER_ENTER, PLACARD_EVENT_DETAIL);
  }

  function handlePointerLeave() {
    dispatch(eventTargetRef, SceneEvents.PLACARD_HOVER_LEAVE, PLACARD_EVENT_DETAIL);
  }

  function handleFocus() {
    dispatch(eventTargetRef, SceneEvents.PLACARD_FOCUS_ENTER, PLACARD_EVENT_DETAIL);
  }

  function handleBlur() {
    dispatch(eventTargetRef, SceneEvents.PLACARD_FOCUS_LEAVE, PLACARD_EVENT_DETAIL);
  }

  function handleActivate() {
    dispatch(eventTargetRef, SceneEvents.PLACARD_ACTIVATED, PLACARD_EVENT_DETAIL);
    onActivate?.();
  }

  return (
    <button
      type="button"
      className="qcq-placard-hit-zone"
      style={hitStyle}
      aria-label="Open Carl Gilmour business card on the tablet"
      aria-pressed={active}
      data-geometry-authority="lower-purple-trim"
      data-visual-owner="border-frame-engine"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleActivate}
    />
  );
}
