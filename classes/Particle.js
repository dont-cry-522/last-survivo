/**
 * ============================================================
 *  Particle.js - 绮掑瓙绯荤粺
 * ============================================================
 *  缁熶竴绠＄悊鎵€鏈夌矑瀛愮壒鏁堬細灏剧劙銆佺垎鐐搞€佸懡涓€佹畫褰辩瓑
 *  浣跨敤瀵硅薄姹犲鐢ㄧ矑瀛愶紝閬垮厤棰戠箒GC
 *  TODO: 鍙互鎸夌被鍨嬪垎灞傛覆鏌擄紝浼樺寲缁樺埗椤哄簭
 *  TODO: 鍙互鍔犲叆绮掑瓙绾圭悊锛屾彁鍗囪瑙夋晥鏋?
 * ============================================================
 */

class Particle {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 1;
        this.size = 2;
        this.color = '#ffffff';
        this.alpha = 1;
        this.gravity = 0;
        this.friction = 0.98;
        this.glow = false;
        this.type = 'default'; // default / trail / explosion / hit / afterimage
    }

    /**
     * 鍒濆鍖栫矑瀛愶紙瀵硅薄姹犲鐢級
     */
    init(x, y, vx, vy, options = {}) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.maxLife = options.life || 0.5;
        this.life = this.maxLife;
        this.size = options.size || 3;
        this.color = options.color || '#ffffff';
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
        this.glow = options.glow || false;
        this.type = options.type || 'default';
        this.alpha = 1;
    }

    update(deltaTime) {
        if (!this.active) return;

        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        // 鐢熷懡鐧惧垎姣?
        const t = this.life / this.maxLife;
        this.alpha = t;

        // 閫熷害鏇存柊
        this.vy += this.gravity * deltaTime;
        this.vx *= this.friction;
        this.vy *= this.friction;

        // 浣嶇疆鏇存柊
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;

        // 娈嬪奖绫诲瀷涓嶇Щ鍔紝鍙贰鍑?
        if (this.type === 'afterimage') {
            this.alpha = t * 0.5;
        }
    }
}

/**
 * 绮掑瓙绠＄悊鍣?- 瀵硅薄姹犳ā寮?
 */
class ParticleManager extends ObjectPool {
    constructor(maxCount = 500) {
        super(() => new Particle(), maxCount);
    }

    /**
     * 鐢熸垚灏剧劙绮掑瓙
     */
    spawnTrail(x, y, angle, color) {
        const p = this.acquire();
        const spread = 0.3;
        const speed = Utils.random(1, 3);
        const a = angle + Math.PI + Utils.random(-spread, spread);
        p.init(x, y,
            Math.cos(a) * speed,
            Math.sin(a) * speed,
            {
                life: Utils.random(0.2, 0.4),
                size: Utils.random(2, 4),
                color: color,
                friction: 0.92,
                glow: true,
                type: 'trail',
            }
        );
    }

    /**
     * 鐢熸垚鐖嗙偢绮掑瓙
     */
    spawnExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const p = this.acquire();
            const angle = (i / count) * Math.PI * 2 + Utils.random(-0.2, 0.2);
            const speed = Utils.random(2, 6);
            p.init(x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                {
                    life: Utils.random(0.3, 0.7),
                    size: Utils.random(2, 5),
                    color: color,
                    friction: 0.94,
                    glow: true,
                    type: 'explosion',
                }
            );
        }
    }

    /**
     * 鐢熸垚鍛戒腑绮掑瓙
     */
    spawnHit(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            const p = this.acquire();
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(1, 4);
            p.init(x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                {
                    life: Utils.random(0.15, 0.3),
                    size: Utils.random(1.5, 3),
                    color: color,
                    friction: 0.9,
                    glow: true,
                    type: 'hit',
                }
            );
        }
    }

    /**
     * 鐢熸垚鐜╁娈嬪奖
     */
    spawnAfterimage(x, y, size, color) {
        const p = this.acquire();
        p.init(x, y, 0, 0, {
            life: 0.3,
            size: size,
            color: color,
            type: 'afterimage',
            glow: true,
        });
    }

    /**
     * 鐢熸垚缁忛獙鍚稿彇绮掑瓙鏁堟灉
     */
    spawnExpPickup(x, y, color) {
        const p = this.acquire();
        const angle = Math.random() * Math.PI * 2;
        p.init(x, y,
            Math.cos(angle) * 2,
            Math.sin(angle) * 2,
            {
                life: 0.4,
                size: 3,
                color: color,
                glow: true,
                type: 'default',
            }
        );
    }

    update(deltaTime) {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].update(deltaTime);
        }
    }

    }
}

if (typeof window !== 'undefined') {
    window.Particle = Particle;
    window.ParticleManager = ParticleManager;
}
