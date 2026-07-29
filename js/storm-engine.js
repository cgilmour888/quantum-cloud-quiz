const TAU = Math.PI * 2;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const random = (min, max) => min + Math.random() * (max - min);

function branchBolt(x, y, targetY, spread, depth = 0) {
  const points = [{ x, y }];
  let currentX = x;
  let currentY = y;
  const segments = Math.max(7, Math.floor((targetY - y) / 28));
  for (let i = 1; i <= segments; i += 1) {
    const progress = i / segments;
    currentY = y + (targetY - y) * progress;
    currentX += random(-spread, spread) * (1 - progress * 0.45);
    points.push({ x: currentX, y: currentY });
  }

  const branches = [];
  if (depth < 2) {
    const count = depth === 0 ? 2 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i += 1) {
      const startIndex = Math.floor(random(2, Math.max(3, points.length - 2)));
      const start = points[startIndex];
      const length = random(65, depth === 0 ? 180 : 105);
      const direction = Math.random() > 0.5 ? 1 : -1;
      const branchTargetY = Math.min(targetY, start.y + length * random(0.55, 0.9));
      const branch = branchBolt(start.x, start.y, branchTargetY, spread * 0.58, depth + 1);
      branch.points.forEach((point, index) => {
        point.x += direction * index * random(1.5, 3.8);
      });
      branches.push(branch, ...branch.branches);
    }
  }
  return { points, branches };
}

export class StormEngine {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audio;
    this.dpr = 1;
    this.width = innerWidth;
    this.height = innerHeight;
    this.time = 0;
    this.charge = 0.08;
    this.targetCharge = 0.08;
    this.correct = 0;
    this.answered = 0;
    this.total = 50;
    this.flash = 0;
    this.cloudBlobs = [];
    this.rain = [];
    this.pulses = [];
    this.bolts = [];
    this.finaleState = null;
    this.lastAmbientPulse = 0;
    this.lastAmbientBolt = 0;
    this.running = true;
    this.cloudTexture = new Image();
    this.cloudTextureReady = false;
    this.cloudTexture.addEventListener('load', () => { this.cloudTextureReady = true; });
    this.cloudTexture.src = new URL('../assets/nimbus-supercell.png', import.meta.url).href;
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    addEventListener('resize', this.resize);
    this.resize();
    requestAnimationFrame(this.render);
  }

  resize() {
    this.width = innerWidth;
    this.height = innerHeight;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.generateCloud();
  }

  cloudBounds() {
    const width = Math.min(this.width * 0.72, 950);
    const height = Math.min(this.height * 0.31, 290);
    return {
      x: this.width / 2 - width / 2,
      y: Math.max(88, this.height * 0.07),
      width,
      height,
      cx: this.width / 2,
      cy: Math.max(88, this.height * 0.07) + height * 0.47,
    };
  }

  generateCloud() {
    const bounds = this.cloudBounds();
    const count = Math.round(clamp(this.width / 8, 85, 145));
    this.cloudBlobs = Array.from({ length: count }, (_, index) => {
      const angle = Math.random() * TAU;
      const radial = Math.sqrt(Math.random());
      const rx = bounds.width * (0.05 + Math.random() * 0.09);
      const ry = bounds.height * (0.09 + Math.random() * 0.16);
      const x = bounds.cx + Math.cos(angle) * radial * bounds.width * 0.42;
      const y = bounds.cy + Math.sin(angle) * radial * bounds.height * 0.34 - (1 - radial) * bounds.height * 0.07;
      return {
        x,
        y,
        rx,
        ry,
        phase: Math.random() * TAU,
        speed: random(0.08, 0.24),
        shade: random(0, 1),
        layer: index / count,
      };
    }).sort((a, b) => a.y - b.y);
  }

  setQuizState({ correct = 0, answered = 0, total = 50 }) {
    this.correct = correct;
    this.answered = answered;
    this.total = Math.max(1, total);
    const progress = answered / this.total;
    const accuracy = answered ? correct / answered : 0;
    const correctProgress = correct / this.total;
    this.targetCharge = clamp(0.08 + correctProgress * 0.72 + progress * accuracy * 0.2, 0.06, 1);
  }

  rewardCorrect() {
    this.targetCharge = clamp(this.targetCharge + 0.035);
    this.spawnPulse(3 + Math.floor(Math.random() * 3), 1);
    if (this.correct > 0 && (this.correct % randomInteger(3, 6) === 0 || Math.random() < 0.16)) {
      this.spawnBolt(0.45 + this.charge * 0.35, false);
      this.audio?.thunder(0.35 + this.charge * 0.45, random(0.06, 0.3));
    }
  }

  penalizeIncorrect() {
    this.targetCharge = clamp(this.targetCharge - 0.03, 0.05, 1);
    this.spawnPulse(1, 0.45);
  }

  spawnPulse(count = 1, intensity = 1) {
    const bounds = this.cloudBounds();
    for (let i = 0; i < count; i += 1) {
      const startX = bounds.cx + random(-bounds.width * 0.31, bounds.width * 0.31);
      const startY = bounds.cy + random(-bounds.height * 0.22, bounds.height * 0.18);
      const nodes = [{ x: startX, y: startY }];
      const segments = 5 + Math.floor(Math.random() * 6);
      for (let n = 1; n < segments; n += 1) {
        const previous = nodes[n - 1];
        nodes.push({
          x: previous.x + random(-55, 55),
          y: previous.y + random(-22, 24),
        });
      }
      this.pulses.push({ nodes, life: 1, intensity, width: random(0.8, 2.1), hue: Math.random() });
    }
  }

  spawnBolt(intensity = 0.7, finale = false) {
    const bounds = this.cloudBounds();
    const startX = bounds.cx + random(-bounds.width * 0.26, bounds.width * 0.26);
    const startY = bounds.y + bounds.height * random(0.46, 0.68);
    const targetY = finale
      ? Math.min(this.height * random(0.76, 0.94), this.height - 30)
      : bounds.y + bounds.height * random(0.72, 1.18);
    const bolt = branchBolt(startX, startY, targetY, 20 + intensity * 24);
    this.bolts.push({ ...bolt, life: 1, intensity, finale, seed: Math.random() });
    this.flash = Math.max(this.flash, 0.28 + intensity * 0.62);
  }

  finale(score, onComplete) {
    const intensity = clamp(score / 100, 0.18, 1);
    const duration = 4200 + intensity * 3500;
    const strikes = Math.round(3 + intensity * 11);
    this.targetCharge = clamp(0.35 + intensity * 0.65);
    this.finaleState = {
      startedAt: performance.now(),
      duration,
      intensity,
      strikes,
      emitted: 0,
      nextStrikeAt: 100,
      onComplete,
      completed: false,
    };
    this.spawnPulse(8 + Math.floor(intensity * 12), 1.2 + intensity);
  }

  update(dt, now) {
    this.time += dt;
    this.charge += (this.targetCharge - this.charge) * Math.min(1, dt * 1.8);
    this.flash *= Math.pow(0.025, dt);

    if (!this.finaleState && now - this.lastAmbientPulse > 1300 - this.charge * 900) {
      this.lastAmbientPulse = now;
      if (Math.random() < 0.22 + this.charge * 0.45) this.spawnPulse(1 + Math.floor(this.charge * 3), 0.4 + this.charge);
    }
    if (!this.finaleState && this.answered > 0 && now - this.lastAmbientBolt > 7000 - this.charge * 4200) {
      this.lastAmbientBolt = now;
      if (Math.random() < this.charge * 0.22) {
        this.spawnBolt(0.25 + this.charge * 0.35, false);
        this.audio?.thunder(0.18 + this.charge * 0.24, 0.15);
      }
    }

    if (this.finaleState) {
      const state = this.finaleState;
      const elapsed = now - state.startedAt;
      const progress = elapsed / state.duration;
      if (elapsed >= state.nextStrikeAt && state.emitted < state.strikes) {
        const burst = progress > 0.67 && Math.random() < 0.45 ? 2 : 1;
        for (let i = 0; i < burst && state.emitted < state.strikes; i += 1) {
          const intensity = clamp(state.intensity * random(0.72, 1.18), 0.28, 1);
          this.spawnBolt(intensity, true);
          this.spawnPulse(3 + Math.floor(intensity * 6), 1.2 + intensity);
          this.audio?.thunder(intensity, random(0.05, 0.28));
          state.emitted += 1;
        }
        const baseGap = 680 - state.intensity * 390;
        state.nextStrikeAt = elapsed + random(baseGap * 0.55, baseGap * 1.45);
      }
      if (progress > 0.82 && Math.random() < dt * (3 + state.intensity * 8)) {
        this.spawnPulse(2, 1.4);
      }
      if (elapsed >= state.duration && !state.completed) {
        state.completed = true;
        this.audio?.successChord(state.intensity * 100);
        const callback = state.onComplete;
        setTimeout(() => {
          this.finaleState = null;
          callback?.();
        }, 350);
      }
    }

    this.pulses.forEach((pulse) => { pulse.life -= dt * (0.75 + pulse.intensity * 0.22); });
    this.pulses = this.pulses.filter((pulse) => pulse.life > 0);
    this.bolts.forEach((bolt) => { bolt.life -= dt * (bolt.finale ? 2.3 : 3.5); });
    this.bolts = this.bolts.filter((bolt) => bolt.life > 0);
    this.updateRain(dt);
  }

  updateRain(dt) {
    const bounds = this.cloudBounds();
    const finaleBoost = this.finaleState ? this.finaleState.intensity * 1.7 : 0;
    const desired = Math.round((this.charge * 130 + finaleBoost * 180) * Math.min(1, this.width / 900));
    while (this.rain.length < desired) {
      this.rain.push({
        x: random(bounds.x + bounds.width * 0.08, bounds.x + bounds.width * 0.92),
        y: random(bounds.y + bounds.height * 0.5, bounds.y + bounds.height),
        speed: random(290, 660),
        length: random(8, 25),
        alpha: random(0.08, 0.38),
        wind: random(-18, 12),
      });
    }
    if (this.rain.length > desired) this.rain.length = desired;
    this.rain.forEach((drop) => {
      drop.y += drop.speed * dt;
      drop.x += drop.wind * dt;
      if (drop.y > this.height + 30) {
        drop.y = bounds.y + bounds.height * random(0.55, 1);
        drop.x = random(bounds.x + bounds.width * 0.08, bounds.x + bounds.width * 0.92);
      }
    });
  }

  drawCloud(ctx) {
    const bounds = this.cloudBounds();
    const density = 0.62 + this.charge * 0.65 + (this.finaleState ? this.finaleState.intensity * 0.2 : 0);

    ctx.save();
    const halo = ctx.createRadialGradient(bounds.cx, bounds.cy, 0, bounds.cx, bounds.cy, bounds.width * 0.57);
    halo.addColorStop(0, `rgba(79,65,175,${0.08 + this.charge * 0.12})`);
    halo.addColorStop(0.48, `rgba(16,113,189,${0.03 + this.charge * 0.08})`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(bounds.x - 80, bounds.y - 80, bounds.width + 160, bounds.height + 170);

    ctx.globalCompositeOperation = 'source-over';

    if (this.cloudTextureReady) {
      const breathing = 1 + Math.sin(this.time * 0.29) * 0.006 + this.charge * 0.012;
      const textureAspect = this.cloudTexture.naturalWidth / this.cloudTexture.naturalHeight;
      let textureWidth = bounds.width * 1.17 * breathing;
      let textureHeight = textureWidth / textureAspect;
      const minimumHeight = bounds.height * 1.34;
      if (textureHeight < minimumHeight) {
        textureHeight = minimumHeight;
        textureWidth = textureHeight * textureAspect;
      }
      const textureX = bounds.cx - textureWidth / 2 + Math.sin(this.time * 0.11) * 2.5;
      const textureY = bounds.y - bounds.height * 0.20 + Math.cos(this.time * 0.17) * 1.8;
      ctx.save();
      ctx.globalAlpha = 0.72 + this.charge * 0.18 + (this.finaleState ? this.finaleState.intensity * 0.06 : 0);
      ctx.filter = `saturate(${1.08 + this.charge * 0.28}) contrast(${1.02 + this.charge * 0.12}) brightness(${0.88 + this.charge * 0.18})`;
      ctx.drawImage(this.cloudTexture, textureX, textureY, textureWidth, textureHeight);
      ctx.restore();
    }

    ctx.globalAlpha = 0.22 + this.charge * 0.18;
    this.cloudBlobs.forEach((blob, index) => {
      const drift = Math.sin(this.time * blob.speed + blob.phase) * (2 + this.charge * 3.5);
      const swell = 1 + Math.sin(this.time * 0.18 + blob.phase) * 0.025 + this.charge * 0.045;
      const x = blob.x + drift;
      const y = blob.y + Math.cos(this.time * blob.speed * 0.7 + blob.phase) * 1.6;
      const rx = blob.rx * swell * (0.94 + this.charge * 0.12);
      const ry = blob.ry * swell * (0.94 + this.charge * 0.13);
      const gradient = ctx.createRadialGradient(x - rx * 0.18, y - ry * 0.24, 2, x, y, Math.max(rx, ry));
      const topLight = 22 + Math.round(blob.shade * 15 + this.charge * 8);
      gradient.addColorStop(0, `rgba(${topLight + 7},${topLight + 11},${topLight + 30},${0.26 * density})`);
      gradient.addColorStop(0.34, `rgba(${10 + blob.shade * 8},${13 + blob.shade * 10},${31 + blob.shade * 17},${0.48 * density})`);
      gradient.addColorStop(0.72, `rgba(3,5,15,${0.62 * density})`);
      gradient.addColorStop(1, 'rgba(1,2,8,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, blob.phase * 0.08, 0, TAU);
      ctx.fill();

      if (index % 7 === 0 && this.charge > 0.15) {
        ctx.globalCompositeOperation = 'screen';
        const electric = ctx.createRadialGradient(x, y, 0, x, y, rx * 0.85);
        electric.addColorStop(0, `rgba(74,56,184,${this.charge * 0.035})`);
        electric.addColorStop(0.55, `rgba(13,98,173,${this.charge * 0.018})`);
        electric.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = electric;
        ctx.beginPath();
        ctx.ellipse(x, y, rx * 0.9, ry * 0.9, 0, 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    });

    ctx.globalAlpha = 1;
    const under = ctx.createLinearGradient(0, bounds.y + bounds.height * 0.55, 0, bounds.y + bounds.height * 1.08);
    under.addColorStop(0, `rgba(2,4,12,${0.12 + this.charge * 0.22})`);
    under.addColorStop(0.52, `rgba(3,6,16,${0.38 + this.charge * 0.28})`);
    under.addColorStop(1, 'rgba(2,4,10,0)');
    ctx.fillStyle = under;
    ctx.beginPath();
    ctx.ellipse(bounds.cx, bounds.y + bounds.height * 0.72, bounds.width * 0.43, bounds.height * 0.28, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawPulses(ctx) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'screen';
    this.pulses.forEach((pulse) => {
      const alpha = Math.sin(Math.PI * clamp(pulse.life)) * clamp(pulse.life * 1.7);
      const gradient = ctx.createLinearGradient(pulse.nodes[0].x, pulse.nodes[0].y, pulse.nodes.at(-1).x, pulse.nodes.at(-1).y);
      gradient.addColorStop(0, `rgba(44,19,154,${alpha * 0.75})`);
      gradient.addColorStop(0.45, `rgba(122,70,255,${alpha})`);
      gradient.addColorStop(0.72, `rgba(26,128,255,${alpha * 0.9})`);
      gradient.addColorStop(1, `rgba(77,245,255,${alpha * 0.55})`);
      ctx.strokeStyle = gradient;
      ctx.shadowColor = pulse.hue > 0.5 ? '#8057ff' : '#169dff';
      ctx.shadowBlur = 10 + pulse.intensity * 13;
      ctx.lineWidth = pulse.width + pulse.intensity * 0.55;
      ctx.beginPath();
      pulse.nodes.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.stroke();
      ctx.strokeStyle = `rgba(224,239,255,${alpha * 0.36})`;
      ctx.lineWidth = 0.55;
      ctx.stroke();
    });
    ctx.restore();
  }

  drawBoltPath(ctx, points) {
    ctx.beginPath();
    points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.stroke();
  }

  drawBolts(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.bolts.forEach((bolt) => {
      const alpha = clamp(bolt.life * 2.3);
      const all = [bolt.points, ...bolt.branches.map((branch) => branch.points)];
      all.forEach((points, index) => {
        const branchScale = index ? 0.58 : 1;
        ctx.strokeStyle = `rgba(72,35,190,${alpha * 0.72 * branchScale})`;
        ctx.shadowColor = '#5c2cff';
        ctx.shadowBlur = 34 * bolt.intensity;
        ctx.lineWidth = (10 + bolt.intensity * 10) * branchScale;
        this.drawBoltPath(ctx, points);

        ctx.strokeStyle = `rgba(46,155,255,${alpha * 0.88 * branchScale})`;
        ctx.shadowColor = '#169dff';
        ctx.shadowBlur = 19 * bolt.intensity;
        ctx.lineWidth = (4 + bolt.intensity * 5) * branchScale;
        this.drawBoltPath(ctx, points);

        const gradient = ctx.createLinearGradient(points[0].x, points[0].y, points.at(-1).x, points.at(-1).y);
        gradient.addColorStop(0, `rgba(185,199,255,${alpha * branchScale})`);
        gradient.addColorStop(0.34, `rgba(255,255,255,${alpha * branchScale})`);
        gradient.addColorStop(0.68, `rgba(208,249,255,${alpha * branchScale})`);
        gradient.addColorStop(1, `rgba(160,115,255,${alpha * branchScale})`);
        ctx.strokeStyle = gradient;
        ctx.shadowColor = '#ecf9ff';
        ctx.shadowBlur = 10 * bolt.intensity;
        ctx.lineWidth = (1.1 + bolt.intensity * 2.5) * branchScale;
        this.drawBoltPath(ctx, points);
      });
    });
    ctx.restore();
  }

  drawRain(ctx) {
    if (!this.rain.length) return;
    ctx.save();
    ctx.lineCap = 'round';
    const finale = this.finaleState?.intensity || 0;
    this.rain.forEach((drop) => {
      const alpha = drop.alpha * (0.35 + this.charge * 0.8 + finale * 0.45);
      ctx.strokeStyle = `rgba(116,190,255,${alpha})`;
      ctx.lineWidth = finale > 0.5 ? 1.2 : 0.85;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + drop.wind * 0.018, drop.y + drop.length * (1 + finale * 0.35));
      ctx.stroke();
    });
    ctx.restore();
  }

  drawFlash(ctx) {
    if (this.flash <= 0.002) return;
    const bounds = this.cloudBounds();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const flash = ctx.createRadialGradient(bounds.cx, bounds.cy, 0, bounds.cx, bounds.cy, Math.max(this.width, this.height) * 0.72);
    flash.addColorStop(0, `rgba(226,239,255,${this.flash * 0.48})`);
    flash.addColorStop(0.25, `rgba(94,89,255,${this.flash * 0.18})`);
    flash.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = flash;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  render(now) {
    if (!this.running) return;
    if (!this.lastTime) this.lastTime = now;
    const dt = Math.min(0.035, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt, now);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawCloud(ctx);
    this.drawRain(ctx);
    this.drawPulses(ctx);
    this.drawBolts(ctx);
    this.drawFlash(ctx);
    requestAnimationFrame(this.render);
  }
}

function randomInteger(min, max) {
  return Math.floor(random(min, max + 1));
}
