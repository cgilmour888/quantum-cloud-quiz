export class FXEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.points = [];
    this.ripples = [];
    this.running = true;
    this.lastPointer = null;
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', (event) => this.pointerMove(event), { passive: true });
    window.addEventListener('pointerdown', (event) => this.ripple(event.clientX, event.clientY, 1), { passive: true });
    this.resize();
    requestAnimationFrame(this.render);
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(innerWidth * this.dpr);
    this.canvas.height = Math.floor(innerHeight * this.dpr);
    this.canvas.style.width = `${innerWidth}px`;
    this.canvas.style.height = `${innerHeight}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  pointerMove(event) {
    const now = performance.now();
    const point = { x: event.clientX, y: event.clientY, t: now, life: 1 };
    if (this.lastPointer) {
      const dx = point.x - this.lastPointer.x;
      const dy = point.y - this.lastPointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 2) return;
    }
    this.lastPointer = point;
    this.points.push(point);
    if (this.points.length > 36) this.points.shift();
  }

  ripple(x, y, strength = 1) {
    this.ripples.push({ x, y, radius: 4, opacity: 0.72 * strength, speed: 2.2 + strength * 1.5, strength });
  }

  render() {
    if (!this.running) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    if (this.points.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 1; i < this.points.length; i += 1) {
        const a = this.points[i - 1];
        const b = this.points[i];
        a.life -= 0.03;
        b.life -= 0.018;
        const alpha = Math.max(0, Math.min(a.life, b.life)) * 0.55;
        const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        gradient.addColorStop(0, `rgba(128,87,255,${alpha * 0.5})`);
        gradient.addColorStop(0.5, `rgba(77,245,255,${alpha})`);
        gradient.addColorStop(1, `rgba(55,246,181,${alpha * 0.55})`);
        ctx.strokeStyle = gradient;
        ctx.shadowColor = '#4df5ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.5 + alpha * 2.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo((a.x + b.x) / 2 + 2, (a.y + b.y) / 2 - 2, b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
      this.points = this.points.filter((point) => point.life > 0.02);
    }

    this.ripples.forEach((ripple) => {
      ripple.radius += ripple.speed;
      ripple.opacity *= 0.955;
      ctx.save();
      ctx.strokeStyle = `rgba(77,245,255,${ripple.opacity})`;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#8057ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(236,249,255,${ripple.opacity * 0.5})`;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    this.ripples = this.ripples.filter((ripple) => ripple.opacity > 0.015 && ripple.radius < 360);
    requestAnimationFrame(this.render);
  }
}
