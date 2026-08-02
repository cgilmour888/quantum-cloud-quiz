import {
  loadBorderFrameImage,
  loadBorderFrameManifest,
} from './borderFrameAssets.js';
import {
  BORDER_FRAGMENT_SHADER,
  BORDER_VERTEX_SHADER,
} from './borderFrameShaders.js';

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to allocate BorderFrameEngine shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown BorderFrameEngine shader error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, BORDER_VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, BORDER_FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to allocate BorderFrameEngine program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown BorderFrameEngine link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function createTexture(gl, image, unit) {
  const texture = gl.createTexture();
  if (!texture) throw new Error('Unable to allocate BorderFrameEngine texture.');
  gl.activeTexture(unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return texture;
}

function createWebGLRenderer(sharedContext, assets) {
  const gl = sharedContext?.gl;
  if (!gl) return null;

  let program = null;
  let vao = null;
  let emissiveTexture = null;
  let dataTexture = null;
  let ready = false;
  let destroyed = false;
  let manifest = null;

  const uniforms = {};

  async function init() {
    const [nextManifest, emissiveImage, dataImage] = await Promise.all([
      loadBorderFrameManifest(assets.manifest),
      loadBorderFrameImage(assets.emissiveAtlas),
      loadBorderFrameImage(assets.dataAtlas),
    ]);
    if (destroyed) return;

    if (emissiveImage.width !== dataImage.width || emissiveImage.height !== dataImage.height) {
      throw new Error('BorderFrameEngine atlas dimensions do not match.');
    }

    manifest = nextManifest;
    program = createProgram(gl);
    vao = gl.createVertexArray();
    if (!vao) throw new Error('Unable to allocate BorderFrameEngine VAO.');
    emissiveTexture = createTexture(gl, emissiveImage, gl.TEXTURE1);
    dataTexture = createTexture(gl, dataImage, gl.TEXTURE2);

    const names = [
      'uEmissive', 'uData', 'uTime', 'uEventGain', 'uSpeedGain',
      'uJunctionGain', 'uReducedMotion', 'uQuality', 'uBloomStrength', 'uProofMode',
    ];
    for (const name of names) uniforms[name] = gl.getUniformLocation(program, name);

    gl.useProgram(program);
    gl.uniform1i(uniforms.uEmissive, 1);
    gl.uniform1i(uniforms.uData, 2);
    ready = true;
  }

  return {
    type: 'webgl2',
    init,
    get ready() { return ready; },
    get manifest() { return manifest; },
    render(state) {
      if (!ready || destroyed) return;
      const proofMode = Number(state.proofMode) || 0;
      gl.viewport(0, 0, state.width, state.height);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.SCISSOR_TEST);
      gl.colorMask(true, true, true, true);

      if (proofMode >= 2) {
        gl.disable(gl.BLEND);
      } else if (proofMode === 1) {
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      } else {
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);
      }

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, emissiveTexture);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, dataTexture);
      gl.uniform1f(uniforms.uTime, state.time);
      gl.uniform3fv(uniforms.uEventGain, state.eventChannels);
      gl.uniform1f(uniforms.uSpeedGain, state.speedGain);
      gl.uniform1f(uniforms.uJunctionGain, state.junctionGain);
      gl.uniform1f(uniforms.uReducedMotion, state.reducedMotion ? 1 : 0);
      gl.uniform1f(uniforms.uQuality, state.quality.shaderQuality);
      gl.uniform1f(uniforms.uBloomStrength, state.quality.bloomStrength);
      gl.uniform1i(uniforms.uProofMode, proofMode);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.BLEND);
    },
    destroy() {
      destroyed = true;
      ready = false;
      if (emissiveTexture) gl.deleteTexture(emissiveTexture);
      if (dataTexture) gl.deleteTexture(dataTexture);
      if (vao) gl.deleteVertexArray(vao);
      if (program) gl.deleteProgram(program);
      emissiveTexture = null;
      dataTexture = null;
      vao = null;
      program = null;
    },
  };
}

function tintChannel(source, channelIndex, color) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(source, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const alpha = pixels[offset + channelIndex];
    pixels[offset] = color[0];
    pixels[offset + 1] = color[1];
    pixels[offset + 2] = color[2];
    pixels[offset + 3] = alpha;
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
}

function createCanvas2DRenderer(sharedContext, assets) {
  const context = sharedContext?.context;
  if (!context) return null;

  let ready = false;
  let destroyed = false;
  let manifest = null;
  let layers = null;

  async function init() {
    const [nextManifest, emissiveImage] = await Promise.all([
      loadBorderFrameManifest(assets.manifest),
      loadBorderFrameImage(assets.emissiveAtlas),
    ]);
    if (destroyed) return;
    manifest = nextManifest;
    layers = {
      cyan: tintChannel(emissiveImage, 0, [10, 220, 255]),
      orange: tintChannel(emissiveImage, 1, [255, 72, 9]),
      purple: tintChannel(emissiveImage, 2, [171, 31, 255]),
    };
    ready = true;
  }

  function drawLayer(layer, width, height, alpha) {
    context.globalAlpha = Math.max(0, Math.min(1, alpha));
    context.drawImage(layer, 0, 0, width, height);
  }

  return {
    type: 'canvas2d',
    init,
    get ready() { return ready; },
    get manifest() { return manifest; },
    render(state) {
      if (!ready || destroyed) return;
      const proofMode = Number(state.proofMode) || 0;
      if (proofMode >= 2) {
        context.save();
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = '#000';
        context.fillRect(0, 0, state.width, state.height);
        drawLayer(layers.cyan, state.width, state.height, 1);
        drawLayer(layers.orange, state.width, state.height, 1);
        drawLayer(layers.purple, state.width, state.height, 1);
        context.restore();
        return;
      }

      const motion = state.reducedMotion ? 0.12 : 1;
      const cyan = 0.25 + 0.22 * Math.sin(state.time * 4.2 * motion) + state.eventChannels[0] * 0.28;
      const orange = 0.20 + 0.20 * Math.sin(state.time * 2.7 * motion + 1.4) + state.eventChannels[1] * 0.28;
      const purple = 0.16 + 0.15 * Math.sin(state.time * 1.3 * motion + 0.7) + state.eventChannels[2] * 0.22;
      context.save();
      context.globalCompositeOperation = proofMode === 1 ? 'source-over' : 'screen';
      drawLayer(layers.purple, state.width, state.height, proofMode === 1 ? 0.72 : purple);
      drawLayer(layers.orange, state.width, state.height, proofMode === 1 ? 0.72 : orange);
      drawLayer(layers.cyan, state.width, state.height, proofMode === 1 ? 0.72 : cyan);
      context.restore();
    },
    destroy() {
      destroyed = true;
      ready = false;
      layers = null;
    },
  };
}

export function createBorderFrameRenderer(sharedContext, assets) {
  if (sharedContext?.type === 'webgl2') return createWebGLRenderer(sharedContext, assets);
  if (sharedContext?.type === 'canvas2d') return createCanvas2DRenderer(sharedContext, assets);
  return null;
}
