const DPR_LIMITS = Object.freeze({
  low: 1,
  medium: 1.25,
  high: 1.5,
  ultra: 2,
});

const VERTEX_SHADER = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 position;
  vec2 uv;

  if (gl_VertexID == 0) {
    position = vec2(-1.0, -1.0);
    uv = vec2(0.0, 0.0);
  } else if (gl_VertexID == 1) {
    position = vec2(3.0, -1.0);
    uv = vec2(2.0, 0.0);
  } else {
    position = vec2(-1.0, 3.0);
    uv = vec2(0.0, 2.0);
  }

  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uMaster;
in vec2 vUv;
out vec4 outColor;

void main() {
  outColor = texture(uMaster, vUv);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to allocate a WebGL shader.');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!program) throw new Error('Unable to allocate the MASTER compositor program.');

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown WebGL link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

async function loadImage(sources) {
  let lastError = null;

  for (const source of sources) {
    try {
      const image = new Image();
      image.decoding = 'async';
      image.loading = 'eager';
      image.src = source;
      await image.decode();
      return { image, source };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Unable to load the protected MASTER artwork.');
}

function createWebGLRenderer(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    desynchronized: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'high-performance',
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    stencil: false,
  });

  if (!gl) return null;

  const program = createProgram(gl);
  const vao = gl.createVertexArray();
  const texture = gl.createTexture();
  const masterLocation = gl.getUniformLocation(program, 'uMaster');

  if (!vao || !texture) throw new Error('Unable to allocate MASTER compositor resources.');

  gl.bindVertexArray(vao);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  let ready = false;
  let backingWidth = 1;
  let backingHeight = 1;

  return {
    type: 'webgl2',
    gl,
    texture,

    upload(image) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      ready = true;
    },

    resize(width, height) {
      backingWidth = width;
      backingHeight = height;
      gl.viewport(0, 0, width, height);
    },

    render() {
      if (!ready) return;

      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.SCISSOR_TEST);
      gl.colorMask(true, true, true, true);
      gl.viewport(0, 0, backingWidth, backingHeight);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(masterLocation, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    getSharedContext() {
      return ready
        ? {
            type: 'webgl2',
            gl,
            masterTexture: texture,
            width: backingWidth,
            height: backingHeight,
          }
        : null;
    },

    destroy() {
      gl.deleteTexture(texture);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}

function createCanvas2DRenderer(canvas) {
  const context = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
  });

  if (!context) return null;

  let image = null;
  let width = 1;
  let height = 1;
  let dirty = true;

  return {
    type: 'canvas2d',

    upload(nextImage) {
      image = nextImage;
      dirty = true;
    },

    resize(nextWidth, nextHeight) {
      width = nextWidth;
      height = nextHeight;
      dirty = true;
    },

    render() {
      if (!image || !dirty) return;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      dirty = false;
    },

    getSharedContext() {
      return image
        ? {
            type: 'canvas2d',
            context,
            masterImage: image,
            width,
            height,
          }
        : null;
    },

    destroy() {
      context.clearRect(0, 0, width, height);
      image = null;
    },
  };
}

export class MasterSceneCompositor {
  #canvas;
  #stage;
  #sources;
  #quality;
  #renderer = null;
  #loadPromise = null;
  #destroyed = false;
  #ready = false;
  #geometry = { width: 1, height: 1, devicePixelRatio: 1 };

  constructor({ canvas, stage, sources, quality = 'high' }) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('MasterSceneCompositor requires a canvas element.');
    }
    if (!(stage instanceof HTMLElement)) {
      throw new TypeError('MasterSceneCompositor requires the scene-stage element.');
    }
    if (!Array.isArray(sources) || sources.length === 0) {
      throw new TypeError('MasterSceneCompositor requires at least one MASTER source.');
    }

    this.#canvas = canvas;
    this.#stage = stage;
    this.#sources = sources;
    this.#quality = DPR_LIMITS[quality] ? quality : 'high';
  }

  async init() {
    if (this.#loadPromise) return this.#loadPromise;

    this.#canvas.dataset.compositorState = 'loading';
    this.#stage.dataset.compositorReady = 'false';

    this.#loadPromise = (async () => {
      const forceFallback = new URLSearchParams(globalThis.location?.search ?? '')
        .get('qcq-renderer') === 'fallback';

      this.#renderer = forceFallback ? null : createWebGLRenderer(this.#canvas);
      if (!this.#renderer) this.#renderer = createCanvas2DRenderer(this.#canvas);
      if (!this.#renderer) throw new Error('No supported canvas renderer is available.');

      const { image, source } = await loadImage(this.#sources);
      if (this.#destroyed) return;

      this.#renderer.upload(image);
      this.resize(this.#geometry);
      this.#ready = true;
      this.#canvas.dataset.compositorState = 'ready';
      this.#canvas.dataset.compositorRenderer = this.#renderer.type;
      this.#canvas.dataset.masterSource = source;
      this.#stage.dataset.compositorReady = 'true';
      this.render();
    })().catch((error) => {
      this.#canvas.dataset.compositorState = 'error';
      this.#stage.dataset.compositorReady = 'false';
      throw error;
    });

    return this.#loadPromise;
  }

  resize({ width, height, devicePixelRatio = 1 }) {
    this.#geometry = { width, height, devicePixelRatio };

    const dprLimit = DPR_LIMITS[this.#quality] ?? DPR_LIMITS.high;
    const pixelRatio = Math.max(1, Math.min(devicePixelRatio, dprLimit));
    const backingWidth = Math.max(1, Math.round(width * pixelRatio));
    const backingHeight = Math.max(1, Math.round(height * pixelRatio));

    if (this.#canvas.width !== backingWidth) this.#canvas.width = backingWidth;
    if (this.#canvas.height !== backingHeight) this.#canvas.height = backingHeight;

    this.#canvas.dataset.stageWidth = String(Math.round(width));
    this.#canvas.dataset.stageHeight = String(Math.round(height));
    this.#canvas.dataset.pixelRatio = String(pixelRatio);
    this.#renderer?.resize(backingWidth, backingHeight);
  }

  render() {
    if (!this.#ready || this.#destroyed) return;
    this.#renderer?.render();
  }

  getSharedContext() {
    return this.#renderer?.getSharedContext?.() ?? null;
  }

  get ready() {
    return this.#ready;
  }

  get rendererType() {
    return this.#renderer?.type ?? 'uninitialized';
  }

  destroy() {
    this.#destroyed = true;
    this.#ready = false;
    this.#renderer?.destroy();
    this.#renderer = null;

    delete this.#canvas.dataset.compositorState;
    delete this.#canvas.dataset.compositorRenderer;
    delete this.#canvas.dataset.masterSource;
    delete this.#canvas.dataset.stageWidth;
    delete this.#canvas.dataset.stageHeight;
    delete this.#canvas.dataset.pixelRatio;
    delete this.#stage.dataset.compositorReady;
  }
}
