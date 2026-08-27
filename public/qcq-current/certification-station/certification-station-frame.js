(() => {
  "use strict";

  const MASTER_W = 3840;
  const MASTER_H = 2160;

  const MAX_RENDER_W = 1280;
  const MAX_RENDER_H = 720;
  const MIN_RENDER_W = 640;
  const MAX_DPR = 1;

  const NORMAL_FPS = 60;
  const REDUCED_MOTION_FPS = 12;

  const TEXTURE_W = 1280;
  const TEXTURE_H = 720;

  const viewport =
    document.getElementById("viewport");

  const stageWrap =
    document.getElementById("stageWrap");

  const stage =
    document.getElementById("stage");

  const canvas =
    document.getElementById(
      "historicalBorderPlasma"
    );

  if (
    !viewport ||
    !stageWrap ||
    !stage ||
    !canvas
  ) {
    throw new Error(
      "QCQ Certification Station frame DOM incomplete"
    );
  }

  const query =
    new URLSearchParams(
      window.location.search
    );

  const FRAME_ENABLED =
    query.get("qcqBorder") !== "0";

  let fitRaf = 0;

  function fitStage() {
    fitRaf = 0;

    const width =
      Math.max(
        1,
        window.innerWidth
      );

    const height =
      Math.max(
        1,
        window.innerHeight
      );

    const scale =
      Math.max(
        width / MASTER_W,
        height / MASTER_H
      );

    const renderedWidth =
      MASTER_W * scale;

    const renderedHeight =
      MASTER_H * scale;

    const left =
      (width - renderedWidth) / 2;

    const top =
      (height - renderedHeight) / 2;

    stageWrap.style.transform =
      `translate(${left}px,${top}px) scale(${scale})`;

    document.documentElement.style.setProperty(
      "--qcq-station-scale",
      String(scale)
    );

    document.documentElement.style.setProperty(
      "--qcq-station-width",
      `${width}px`
    );

    document.documentElement.style.setProperty(
      "--qcq-station-height",
      `${height}px`
    );
  }

  function requestFit() {
    if (fitRaf) {
      return;
    }

    fitRaf =
      requestAnimationFrame(
        fitStage
      );
  }

  window.addEventListener(
    "resize",
    requestFit,
    { passive:true }
  );

  window.visualViewport?.addEventListener(
    "resize",
    requestFit,
    { passive:true }
  );

  fitStage();

  function staticFallback(reason) {
    document.documentElement.dataset.qcqFrameState =
      "static-fallback";

    canvas.dataset.runtimeState =
      "static-fallback";

    canvas.dataset.disabledReason =
      reason || "unknown";

    console.warn(
      "QCQ Certification Station: animated frame unavailable; static main-page frame remains active.",
      reason
    );
  }

  async function loadAuthority() {
    const response =
      await fetch(
        "./assets/historical-border-authority.json",
        {
          cache:"no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `frame authority fetch ${response.status}`
      );
    }

    const authority =
      await response.json();

    if (
      authority.authority !==
      "QCQ-BorderFrameEngine-MASTER-R5.5.3-FinalRelease-v2"
    ) {
      throw new Error(
        "frame authority identity mismatch"
      );
    }

    if (
      authority.packageSha256 !==
      "9cacbab536907928b86191a936d8615f2d680be07327e9bfe0df32d8343a1309"
    ) {
      throw new Error(
        "frame package SHA mismatch"
      );
    }

    return authority;
  }

  async function decodeTextureSource(src) {
    if (
      typeof createImageBitmap ===
      "function"
    ) {
      try {
        const response =
          await fetch(src);

        if (
          !response.ok &&
          response.status !== 0
        ) {
          throw new Error(
            `texture fetch ${response.status}`
          );
        }

        const blob =
          await response.blob();

        return await createImageBitmap(
          blob,
          {
            resizeWidth:
              TEXTURE_W,

            resizeHeight:
              TEXTURE_H,

            resizeQuality:
              "high"
          }
        );
      } catch (error) {
        console.warn(
          "QCQ Certification Station: ImageBitmap path unavailable; using canvas fallback.",
          error
        );
      }
    }

    return await new Promise(
      (resolve,reject) => {
        const image =
          new Image();

        image.decoding =
          "async";

        image.onload =
          () => resolve(image);

        image.onerror =
          reject;

        image.src =
          src;
      }
    );
  }

  async function makeWorkingSurface(src) {
    const decoded =
      await decodeTextureSource(src);

    const surface =
      document.createElement(
        "canvas"
      );

    surface.width =
      TEXTURE_W;

    surface.height =
      TEXTURE_H;

    const context =
      surface.getContext(
        "2d",
        { alpha:true }
      );

    if (!context) {
      if (
        decoded &&
        typeof decoded.close ===
        "function"
      ) {
        decoded.close();
      }

      throw new Error(
        "bounded texture canvas unavailable"
      );
    }

    context.clearRect(
      0,
      0,
      TEXTURE_W,
      TEXTURE_H
    );

    context.drawImage(
      decoded,
      0,
      0,
      TEXTURE_W,
      TEXTURE_H
    );

    if (
      decoded &&
      typeof decoded.close ===
      "function"
    ) {
      decoded.close();
    }

    return surface;
  }

  async function initFrame(authority) {
    const previous =
      window.__QCQ_CERTIFICATION_STATION_FRAME__;

    if (
      previous &&
      typeof previous.destroy ===
      "function"
    ) {
      previous.destroy();
    }

    let destroyed = false;

    let raf = 0;
    let frameTimer = 0;
    let resizeRaf = 0;

    let nextDue = 0;
    let lastClock =
      performance.now();

    let startClock =
      lastClock;

    function renderTarget() {
      const rect =
        canvas.getBoundingClientRect();

      const cssW =
        Math.max(
          1,
          rect.width ||
          window.innerWidth ||
          1920
        );

      const cssH =
        Math.max(
          1,
          rect.height ||
          window.innerHeight ||
          1080
        );

      const dpr =
        Math.min(
          MAX_DPR,
          Math.max(
            1,
            window.devicePixelRatio ||
            1
          )
        );

      let width =
        Math.round(
          cssW * dpr
        );

      let height =
        Math.round(
          cssH * dpr
        );

      const aspect =
        16 / 9;

      if (
        width / height >
        aspect
      ) {
        width =
          Math.round(
            height * aspect
          );
      } else {
        height =
          Math.round(
            width / aspect
          );
      }

      const cap =
        Math.min(
          1,
          MAX_RENDER_W / width,
          MAX_RENDER_H / height
        );

      width =
        Math.max(
          MIN_RENDER_W,
          Math.round(
            width * cap
          )
        );

      height =
        Math.round(
          width / aspect
        );

      if (
        height >
        MAX_RENDER_H
      ) {
        height =
          MAX_RENDER_H;

        width =
          Math.round(
            height * aspect
          );
      }

      return {
        width,
        height,
        dpr
      };
    }

    const initial =
      renderTarget();

    canvas.width =
      initial.width;

    canvas.height =
      initial.height;

    canvas.style.display =
      "block";

    canvas.dataset.repairAuthority =
      "QCQ_CERTIFICATION_STATION_W1_DUPLICATED_MAIN_BORDER";

    canvas.dataset.renderWidth =
      String(initial.width);

    canvas.dataset.renderHeight =
      String(initial.height);

    canvas.dataset.maxDpr =
      String(MAX_DPR);

    const gl =
      canvas.getContext(
        "webgl2",
        {
          alpha:true,
          antialias:false,
          depth:false,
          stencil:false,
          premultipliedAlpha:false,
          preserveDrawingBuffer:false,
          powerPreference:
            "high-performance",
          desynchronized:true
        }
      );

    if (!gl) {
      staticFallback(
        "webgl2-unavailable"
      );

      return;
    }

    function compile(type,source) {
      const shader =
        gl.createShader(type);

      gl.shaderSource(
        shader,
        source
      );

      gl.compileShader(
        shader
      );

      if (
        !gl.getShaderParameter(
          shader,
          gl.COMPILE_STATUS
        )
      ) {
        const message =
          gl.getShaderInfoLog(
            shader
          ) ||
          "border shader compile failed";

        gl.deleteShader(
          shader
        );

        throw new Error(
          message
        );
      }

      return shader;
    }

    const vertexShader =
      compile(
        gl.VERTEX_SHADER,
        authority.vertexShader
      );

    const fragmentShader =
      compile(
        gl.FRAGMENT_SHADER,
        authority.fragmentShader
      );

    const program =
      gl.createProgram();

    gl.attachShader(
      program,
      vertexShader
    );

    gl.attachShader(
      program,
      fragmentShader
    );

    gl.linkProgram(
      program
    );

    gl.deleteShader(
      vertexShader
    );

    gl.deleteShader(
      fragmentShader
    );

    if (
      !gl.getProgramParameter(
        program,
        gl.LINK_STATUS
      )
    ) {
      const message =
        gl.getProgramInfoLog(
          program
        ) ||
        "border program link failed";

      gl.deleteProgram(
        program
      );

      throw new Error(
        message
      );
    }

    const vao =
      gl.createVertexArray();

    async function makeTexture(
      src,
      unit,
      label
    ) {
      const surface =
        await makeWorkingSurface(
          src
        );

      const texture =
        gl.createTexture();

      gl.activeTexture(
        unit
      );

      gl.bindTexture(
        gl.TEXTURE_2D,
        texture
      );

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR
      );

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        gl.LINEAR
      );

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        gl.CLAMP_TO_EDGE
      );

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_T,
        gl.CLAMP_TO_EDGE
      );

      gl.pixelStorei(
        gl.UNPACK_FLIP_Y_WEBGL,
        true
      );

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        TEXTURE_W,
        TEXTURE_H,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );

      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        surface
      );

      const uploadError =
        gl.getError();

      if (
        uploadError !==
        gl.NO_ERROR
      ) {
        gl.deleteTexture(
          texture
        );

        throw new Error(
          `texture upload failed ${label}: ${uploadError}`
        );
      }

      return {
        texture,
        label
      };
    }

    const specs = [
      [
        authority.emissiveAtlas,
        gl.TEXTURE1,
        "emissive"
      ],
      [
        authority.dataAtlas,
        gl.TEXTURE2,
        "data"
      ],
      [
        authority.purpleTrueMask,
        gl.TEXTURE3,
        "purple-mask"
      ],
      [
        authority.purplePhase,
        gl.TEXTURE4,
        "purple-phase"
      ],
      [
        authority.placardInteractionMask,
        gl.TEXTURE5,
        "placard-mask"
      ]
    ];

    const textureRecords = [];

    for (
      const [
        src,
        unit,
        label
      ]
      of specs
    ) {
      textureRecords.push(
        await makeTexture(
          src,
          unit,
          label
        )
      );
    }

    const textures =
      textureRecords.map(
        item => item.texture
      );

    const names = [
      "uEmissive",
      "uData",
      "uPurpleTrueMask",
      "uPurplePhase",
      "uPlacardInteractionMask",
      "uPlacardInteraction",
      "uTime",
      "uEventGain",
      "uChannelEnable",
      "uSpeedGain",
      "uJunctionGain",
      "uReducedMotion",
      "uQuality",
      "uBloomStrength",
      "uProofMode",
      "uDiagnosticMode"
    ];

    const uniforms =
      Object.fromEntries(
        names.map(
          name => [
            name,
            gl.getUniformLocation(
              program,
              name
            )
          ]
        )
      );

    gl.useProgram(
      program
    );

    gl.uniform1i(
      uniforms.uEmissive,
      1
    );

    gl.uniform1i(
      uniforms.uData,
      2
    );

    gl.uniform1i(
      uniforms.uPurpleTrueMask,
      3
    );

    gl.uniform1i(
      uniforms.uPurplePhase,
      4
    );

    gl.uniform1i(
      uniforms.uPlacardInteractionMask,
      5
    );

    gl.bindVertexArray(
      vao
    );

    function clearScheduled() {
      if (raf) {
        cancelAnimationFrame(
          raf
        );

        raf = 0;
      }

      if (frameTimer) {
        clearTimeout(
          frameTimer
        );

        frameTimer = 0;
      }
    }

    function targetInterval() {
      const reduced =
        matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      return (
        1000 /
        (
          reduced
            ? REDUCED_MOTION_FPS
            : NORMAL_FPS
        )
      );
    }

    function schedule() {
      if (
        destroyed ||
        document.hidden ||
        raf ||
        frameTimer
      ) {
        return;
      }

      const now =
        performance.now();

      const wait =
        Math.max(
          0,
          nextDue - now
        );

      if (wait > 4) {
        frameTimer =
          setTimeout(
            () => {
              frameTimer = 0;

              if (
                destroyed ||
                document.hidden ||
                raf
              ) {
                return;
              }

              raf =
                requestAnimationFrame(
                  draw
                );
            },
            Math.max(
              0,
              wait - 2
            )
          );

        return;
      }

      raf =
        requestAnimationFrame(
          draw
        );
    }

    function updateFramebuffer() {
      resizeRaf = 0;

      if (destroyed) {
        return;
      }

      const target =
        renderTarget();

      if (
        canvas.width !==
          target.width ||
        canvas.height !==
          target.height
      ) {
        canvas.width =
          target.width;

        canvas.height =
          target.height;
      }

      canvas.dataset.renderWidth =
        String(
          target.width
        );

      canvas.dataset.renderHeight =
        String(
          target.height
        );

      gl.viewport(
        0,
        0,
        canvas.width,
        canvas.height
      );
    }

    function requestFramebufferUpdate() {
      if (
        destroyed ||
        resizeRaf
      ) {
        return;
      }

      resizeRaf =
        requestAnimationFrame(
          updateFramebuffer
        );
    }

    function clearLegacyNameplateGhost() {
      const X0 = 1390;
      const X1 = 2510;

      const Y0 = 1908;
      const Y1 = 2048;

      const scaleX =
        canvas.width / MASTER_W;

      const scaleY =
        canvas.height / MASTER_H;

      const x =
        Math.floor(
          X0 * scaleX
        );

      const y =
        Math.floor(
          (
            MASTER_H -
            Y1
          ) * scaleY
        );

      const width =
        Math.ceil(
          (
            X1 -
            X0
          ) * scaleX
        );

      const height =
        Math.ceil(
          (
            Y1 -
            Y0
          ) * scaleY
        );

      gl.enable(
        gl.SCISSOR_TEST
      );

      gl.scissor(
        x,
        y,
        width,
        height
      );

      gl.clearColor(
        0,
        0,
        0,
        0
      );

      gl.clear(
        gl.COLOR_BUFFER_BIT
      );

      gl.disable(
        gl.SCISSOR_TEST
      );

      canvas.dataset.legacyNameplateGhost =
        "suppressed";

      canvas.dataset.legacyNameplateExclusion =
        "1390,1908,2510,2048";
    }

    function draw(now) {
      raf = 0;

      if (
        destroyed ||
        document.hidden
      ) {
        return;
      }

      const interval =
        targetInterval();

      if (
        now + 1 <
        nextDue
      ) {
        schedule();
        return;
      }

      nextDue =
        now + interval;

      lastClock =
        now;

      const time =
        (
          now -
          startClock
        ) / 1000;

      gl.viewport(
        0,
        0,
        canvas.width,
        canvas.height
      );

      gl.disable(
        gl.DEPTH_TEST
      );

      gl.disable(
        gl.SCISSOR_TEST
      );

      gl.clearColor(
        0,
        0,
        0,
        0
      );

      gl.clear(
        gl.COLOR_BUFFER_BIT
      );

      gl.enable(
        gl.BLEND
      );

      gl.blendEquation(
        gl.FUNC_ADD
      );

      gl.blendFunc(
        gl.ONE,
        gl.ONE
      );

      gl.useProgram(
        program
      );

      gl.bindVertexArray(
        vao
      );

      gl.uniform1f(
        uniforms.uTime,
        time
      );

      gl.uniform3f(
        uniforms.uEventGain,
        0,
        0,
        0
      );

      gl.uniform3f(
        uniforms.uChannelEnable,
        1,
        1,
        1
      );

      gl.uniform3f(
        uniforms.uPlacardInteraction,
        0,
        0,
        0
      );

      gl.uniform1f(
        uniforms.uSpeedGain,
        0
      );

      gl.uniform1f(
        uniforms.uJunctionGain,
        0
      );

      gl.uniform1f(
        uniforms.uReducedMotion,
        matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? 1
          : 0
      );

      gl.uniform1f(
        uniforms.uQuality,
        1
      );

      gl.uniform1f(
        uniforms.uBloomStrength,
        1
      );

      gl.uniform1i(
        uniforms.uProofMode,
        0
      );

      gl.uniform1i(
        uniforms.uDiagnosticMode,
        0
      );

      gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
      );

      clearLegacyNameplateGhost();

      gl.disable(
        gl.BLEND
      );

      canvas.dataset.targetFps =
        String(
          Math.round(
            1000 / interval
          )
        );

      canvas.dataset.runtimeState =
        "running";

      document.documentElement.dataset.qcqFrameState =
        "running";

      schedule();
    }

    function visibilityHandler() {
      if (document.hidden) {
        clearScheduled();

        canvas.dataset.runtimeState =
          "suspended-hidden";
      } else {
        lastClock =
          performance.now();

        nextDue = 0;

        requestFramebufferUpdate();

        schedule();
      }
    }

    function contextLostHandler(event) {
      event.preventDefault();

      clearScheduled();

      canvas.style.display =
        "none";

      staticFallback(
        "webgl-context-lost"
      );
    }

    function contextRestoredHandler() {
      window.location.reload();
    }

    function destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;

      clearScheduled();

      if (resizeRaf) {
        cancelAnimationFrame(
          resizeRaf
        );

        resizeRaf = 0;
      }

      document.removeEventListener(
        "visibilitychange",
        visibilityHandler
      );

      window.removeEventListener(
        "resize",
        requestFramebufferUpdate
      );

      window.visualViewport?.removeEventListener(
        "resize",
        requestFramebufferUpdate
      );

      canvas.removeEventListener(
        "webglcontextlost",
        contextLostHandler
      );

      canvas.removeEventListener(
        "webglcontextrestored",
        contextRestoredHandler
      );

      textures.forEach(
        texture =>
          gl.deleteTexture(
            texture
          )
      );

      gl.deleteVertexArray(
        vao
      );

      gl.deleteProgram(
        program
      );

      canvas.dataset.runtimeState =
        "destroyed";
    }

    document.addEventListener(
      "visibilitychange",
      visibilityHandler,
      { passive:true }
    );

    window.addEventListener(
      "resize",
      requestFramebufferUpdate,
      { passive:true }
    );

    window.visualViewport?.addEventListener(
      "resize",
      requestFramebufferUpdate,
      { passive:true }
    );

    canvas.addEventListener(
      "webglcontextlost",
      contextLostHandler,
      { passive:false }
    );

    canvas.addEventListener(
      "webglcontextrestored",
      contextRestoredHandler,
      { passive:true }
    );

    canvas.dataset.authority =
      authority.authority;

    canvas.dataset.packageSha256 =
      authority.packageSha256;

    canvas.dataset.flow =
      "cyan-clockwise orange-counter-clockwise purple-counter-clockwise";

    canvas.dataset.textureWorkingSet =
      `${TEXTURE_W}x${TEXTURE_H}`;

    canvas.dataset.runtimeState =
      "ready";

    window.__QCQ_CERTIFICATION_STATION_FRAME__ = {
      destroy,

      getState() {
        return {
          width:
            canvas.width,

          height:
            canvas.height,

          state:
            canvas.dataset.runtimeState ||
            "initializing",

          targetFps:
            canvas.dataset.targetFps ||
            "0",

          authority:
            canvas.dataset.authority ||
            "",

          packageSha256:
            canvas.dataset.packageSha256 ||
            ""
        };
      }
    };

    updateFramebuffer();

    schedule();
  }

  async function boot() {
    if (!FRAME_ENABLED) {
      staticFallback(
        "qcqBorder=0"
      );

      return;
    }

    document.documentElement.dataset.qcqFrameState =
      "boot-pending";

    try {
      const authority =
        await loadAuthority();

      await initFrame(
        authority
      );
    } catch (error) {
      console.error(
        "QCQ Certification Station W1 animated-frame boot failed.",
        error
      );

      staticFallback(
        String(
          error?.message ||
          error
        )
      );
    }
  }

  if (
    typeof requestIdleCallback ===
    "function"
  ) {
    requestIdleCallback(
      boot,
      { timeout:1200 }
    );
  } else {
    setTimeout(
      boot,
      250
    );
  }
})();
