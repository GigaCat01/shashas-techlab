const canvas = document.getElementById('antigravity-bg');
const ctx = canvas.getContext('2d');
let width, height, particles;
const PARTICLE_COUNT = 150;
const CONNECTION_DIST = 150;
const MOUSE_DIST = 200;

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
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
    }

    update(mouseX, mouseY) {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse Interaction
        if (mouseX && mouseY) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < MOUSE_DIST) {
                // Gentle repulsion (Antigravity feel)
                const force = (MOUSE_DIST - dist) / MOUSE_DIST;
                this.vx += dx / 2000 * force;
                this.vy += dy / 2000 * force;
                this.opacity = Math.min(1, this.baseOpacity + force * 0.5);
            } else {
                this.opacity = this.baseOpacity;
            }
        }
    }

    draw() {
        ctx.fillStyle = `${this.colorBase}${this.opacity})`;
        ctx.shadowBlur = 8;
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
                ctx.strokeStyle = `rgba(100, 100, 100, ${opacity})`;
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
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
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
    
    particles.forEach(p => {
        p.update(mouseX, mouseY);
        p.draw();
    });
    drawLines();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', init);
init();
animate();
