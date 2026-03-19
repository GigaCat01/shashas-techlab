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
const EXPLOSION_THRESHOLD = 100;
let isExploding = false;
let explosionRadius = 0;
let explosionX = 0;
let explosionY = 0;

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

        this.x += this.vx;
        this.y += this.vy;

        // Friction (Velocity decay)
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Constant slight movement
        this.vx += (Math.random() - 0.5) * 0.05;
        this.vy += (Math.random() - 0.5) * 0.05;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse Interaction
        if (mouseX && mouseY) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < MOUSE_DIST) {
                const force = (MOUSE_DIST - dist) / MOUSE_DIST;
                this.vx += dx / 800 * force; // Stronger repulsion for minigame
                this.vy += dy / 800 * force;
                this.opacity = Math.min(1, this.baseOpacity + force * 0.5);
                
                // Add heat to system
                systemHeat += force * 0.5;
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
        ctx.shadowBlur = systemHeat > 50 ? 15 : 8;
        ctx.shadowColor = `${this.colorBase}0.5)`;
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

function triggerExplosion() {
    isExploding = true;
    explosionX = width / 2;
    explosionY = height / 2;
    explosionRadius = 0;
    
    // Reset heat after a delay
    setTimeout(() => {
        isExploding = false;
        systemHeat = 0;
    }, 1000);
}

function updateUI() {
    // Heat decay
    if (systemHeat > 0) systemHeat -= 0.15;
    if (systemHeat < 0) systemHeat = 0;
    
    const displayHeat = Math.min(100, systemHeat);
    energyValueEl.textContent = `${Math.floor(displayHeat)}%`;
    energyBarEl.style.width = `${displayHeat}%`;
    
    // UI Classes
    energyContainerEl.classList.toggle('energy-warning', systemHeat > 50 && systemHeat < 85);
    energyContainerEl.classList.toggle('energy-critical', systemHeat >= 85);
    
    // Trigger Explosion
    if (systemHeat >= EXPLOSION_THRESHOLD && !isExploding) {
        triggerExplosion();
    }
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
                ctx.strokeStyle = systemHeat > 85 ? `rgba(255, 61, 0, ${opacity})` : `rgba(100, 100, 100, ${opacity})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        // Connect to mouse
        if (mouseX && mouseY) {
            const dx = particles[i].x - mouseX;
            const dy = particles[i].y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_DIST) {
                const opacity = (1 - dist / MOUSE_DIST) * 0.5;
                ctx.strokeStyle = systemHeat > 85 ? `rgba(255, 61, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouseX, mouseY);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0a0c'; // Solid dark bg
    ctx.fillRect(0,0, width, height);
    
    if (isExploding) {
        explosionRadius += 30;
        // Draw shockwave ring
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - explosionRadius / 1500})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(explosionX, explosionY, explosionRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

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
