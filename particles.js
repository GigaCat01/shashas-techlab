const canvas = document.getElementById('antigravity-bg');
const ctx = canvas.getContext('2d');
const energyValueEl = document.getElementById('energy-value');
const energyBarEl = document.getElementById('energy-bar');
const energyContainerEl = document.getElementById('energy-container');

let width, height, particles;
const PARTICLE_COUNT = 150;
const CONNECTION_DIST = 150;
const MOUSE_DIST = 200;

// Minigame State
let systemHeat = 0;
const EXPLOSION_THRESHOLD = 1000;
let isExploding = false;
let explosionRadius = 0;
let explosionX = 0;
let explosionY = 0;

// Interactive State
let clickShockwaves = [];
const SHOCKWAVE_MAX_RADIUS = 150;

function init() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    
    // Set display size
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Set internal resolution
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }
}

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 1;
        this.baseOpacity = Math.random() * 0.6 + 0.3;
        this.opacity = this.baseOpacity;
        const colors = [
            'rgba(66, 133, 244,',   // Blue
            'rgba(219, 68, 55,',   // Red
            'rgba(244, 180, 0,',   // Yellow
            'rgba(15, 157, 88,'    // Green
        ];
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        this.originalColorBase = this.colorBase;
    }

    update(mouseX, mouseY) {
        if (isExploding) {
            const dx = this.x - explosionX;
            const dy = this.y - explosionY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < explosionRadius && dist > 0) {
                const force = (explosionRadius - dist) / explosionRadius;
                this.vx += (dx / dist) * force * 15;
                this.vy += (dy / dist) * force * 15;
                this.colorBase = 'rgba(255, 255, 255,'; // White hot during explosion
            }
        }

        // Click Shockwave Physics
        clickShockwaves.forEach(sw => {
            const dx = this.x - sw.x;
            const dy = this.y - sw.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < sw.radius && dist > 0) {
                const force = (sw.radius - dist) / sw.radius;
                this.vx += (dx / dist) * force * 8;
                this.vy += (dy / dist) * force * 8;
                systemHeat += force * 0.15; // Click shockwaves boost energy
            }
        });

        this.x += this.vx;
        this.y += this.vy;

        // Velocity Cap (Prevent vanishing)
        const maxVel = isExploding ? 20 : 5;
        const currentVel = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentVel > maxVel) {
            this.vx = (this.vx / currentVel) * maxVel;
            this.vy = (this.vy / currentVel) * maxVel;
        }

        // NO Friction (Perpetual motion enabled by user rule)
        // this.vx *= 0.98;
        // this.vy *= 0.98;

        // Constant slight movement (only if not exploding)
        if (!isExploding) {
            this.vx += (Math.random() - 0.5) * 0.05;
            this.vy += (Math.random() - 0.5) * 0.05;
        }

        // Bounce off edges + Clamp (Prevent vanishing)
        if (this.x < 0) { this.x = 0; this.vx *= -1; }
        if (this.x > width) { this.x = width; this.vx *= -1; }
        if (this.y < 0) { this.y = 0; this.vy *= -1; }
        if (this.y > height) { this.y = height; this.vy *= -1; }

        // Mouse Interaction
        if (mouseX && mouseY) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < MOUSE_DIST) {
                const force = (MOUSE_DIST - dist) / MOUSE_DIST;
                this.vx += dx / 800 * force; 
                this.vy += dy / 800 * force;
                this.opacity = Math.min(1, this.baseOpacity + force * 0.5);
                
                // Add heat to system (Extremely slow fill)
                systemHeat += force * 0.01;
            } else {
                this.opacity = this.baseOpacity;
            }
        }

        // Return color to original if not exploding
        if (!isExploding) {
            this.colorBase = this.originalColorBase;
        }
    }

    draw() {
        ctx.fillStyle = `${this.colorBase}${this.opacity})`;
        ctx.shadowBlur = systemHeat > 500 ? 15 : 8;
        ctx.shadowColor = `${this.colorBase}0.5})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('mousedown', (e) => {
    clickShockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        opacity: 0.8
    });
});

function triggerExplosion() {
    isExploding = true;
    const rect = energyContainerEl.getBoundingClientRect();
    explosionX = rect.left + rect.width / 2;
    explosionY = rect.top + rect.height / 2;
    explosionRadius = 0;
    
    // Reset heat after a delay
    setTimeout(() => {
        isExploding = false;
        systemHeat = 0;
    }, 1200);
}

function updateUI() {
    let totalVel = 0;
    particles.forEach(p => {
        totalVel += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    });
    const avgVel = totalVel / particles.length;

    const decayFactor = 0.25 * (1 - Math.min(1, avgVel / 1.5));
    if (systemHeat > 0) systemHeat -= decayFactor;
    if (systemHeat < 0) systemHeat = 0;
    
    const displayPercent = Math.min(100, (systemHeat / EXPLOSION_THRESHOLD) * 100);
    energyValueEl.textContent = `${Math.floor(displayPercent)}%`;
    energyBarEl.style.width = `${displayPercent}%`;
    
    energyContainerEl.classList.toggle('energy-warning', displayPercent > 50 && displayPercent < 85);
    energyContainerEl.classList.toggle('energy-critical', displayPercent >= 85);
    
    if (systemHeat >= EXPLOSION_THRESHOLD && !isExploding) {
        triggerExplosion();
    }
}

function drawAura(x, y) {
    if (!x || !y) return;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 70);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 70, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle glass outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawLines() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONNECTION_DIST) {
                const opacity = (1 - dist / CONNECTION_DIST) * 0.3;
                const displayPercent = (systemHeat / EXPLOSION_THRESHOLD) * 100;
                ctx.strokeStyle = displayPercent > 85 ? `rgba(255, 61, 0, ${opacity})` : `rgba(100, 100, 100, ${opacity})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0,0, width, height);
    
    drawAura(mouseX, mouseY);

    if (isExploding) {
        explosionRadius += 30;
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - explosionRadius / 1500})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(explosionX, explosionY, explosionRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Update and draw Click Shockwaves
    clickShockwaves = clickShockwaves.filter(sw => {
        sw.radius += 10;
        sw.opacity -= 0.02;
        if (sw.opacity <= 0 || sw.radius > SHOCKWAVE_MAX_RADIUS) return false;
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${sw.opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        return true;
    });

    particles.forEach(p => {
        p.update(mouseX, mouseY);
        p.draw();
    });
    
    drawLines();
    updateUI();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', init);
init();
animate();
