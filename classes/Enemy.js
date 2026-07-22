/**
 * ============================================================
 *  Enemy.js - 鏁屼汉绯荤粺
 * ============================================================
 *  鍥涚鏁屼汉绫诲瀷锛氭櫘閫氥€佸揩閫熴€佸潶鍏嬨€佽嚜鐖?
 *  缁熶竴AI锛氳拷韪帺瀹剁Щ鍔?
 *  Enemy 瀹炰綋鏄函鏁版嵁+琛屼负锛屼笉鐩存帴璋冪敤浠讳綍澶栭儴绯荤粺銆?
 *  鎵€鏈夎法绯荤粺鏁堟灉锛堢矑瀛?闊虫晥/缁忛獙/浼ゅ锛夌敱 EnemyManager 缁熶竴澶勭悊銆?
 * ============================================================
 */

class Enemy {
    constructor() {
        this.active = false;
        this.type = 'normal';
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.maxHp = 30;
        this.hp = 30;
        this.speed = 1.5;
        this.damage = 10;
        this.size = 15;
        this.exp = 5;
        this.gold = 1;
        this.color = '#ff6b6b';
        this.glowColor = 'rgba(255, 107, 107, 0.5)';

        this.explodeRadius = 0;
        this.isExploder = false;
        this.explodeTriggerDistance = EnemyConfig.EXPLODE_TRIGGER_DISTANCE;
        this._triggeredExplode = false;

        this.hitFlash = 0;

        this.knockbackX = 0;
        this.knockbackY = 0;
        this.knockbackDecay = EnemyConfig.KNOCKBACK_DECAY;

        this.contactCooldown = 0;

        this.hpMultiplier = 1;
        this.speedMultiplier = 1;
    }

    /**
     * 鍒濆鍖栨晫浜?
     */
    init(type, x, y, hpMultiplier = 1, speedMultiplier = 1) {
        const cfg = EnemyConfig.TYPES[type];
        if (!cfg) return;

        this.active = true;
        this.type = type;
        this.x = x;
        this.y = y;
        this.maxHp = cfg.hp * hpMultiplier;
        this.hp = this.maxHp;
        this.speed = cfg.speed * speedMultiplier;
        this.damage = cfg.damage;
        this.size = cfg.size;
        this.exp = cfg.exp;
        this.gold = cfg.gold;
        this.color = cfg.color;
        this.glowColor = cfg.glowColor;
        this.hitFlash = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this._triggeredExplode = false;
        this.contactCooldown = 0;

        this.hpMultiplier = hpMultiplier;
        this.speedMultiplier = speedMultiplier;

        if (type === 'exploder') {
            this.isExploder = true;
            this.explodeRadius = cfg.explodeRadius;
            this.explodeTriggerDistance = EnemyConfig.EXPLODE_TRIGGER_DISTANCE;
        } else {
            this.isExploder = false;
            this.explodeRadius = 0;
        }
    }

    /**
     * 鍙楀埌浼ゅ锛堢函鏁版嵁鍙樻洿锛屼笉浜х敓澶栭儴鏁堟灉锛?
     * @returns {boolean} 鏄惁姝讳骸
     */
    takeDamage(amount, bulletAngle = 0) {
        this.hp -= amount;
        this.hitFlash = EnemyConfig.HIT_FLASH_DURATION;

        const knockbackForce = amount * EnemyConfig.KNOCKBACK_FORCE_COEFFICIENT;
        this.knockbackX += Math.cos(bulletAngle) * knockbackForce;
        this.knockbackY += Math.sin(bulletAngle) * knockbackForce;

        if (this.hp <= 0) {
            this.hp = 0;
            return true;
        }
        return false;
    }

    /**
     * 姝讳骸锛堢函鐘舵€佸彉鏇达紝澶栭儴鏁堟灉鐢?EnemyManager 澶勭悊锛?
     */
    die() {
        this.active = false;
    }

    /**
     * 鏇存柊绉诲姩AI锛堜笉璋冪敤浠讳綍澶栭儴绯荤粺锛?
     * 浠呭鐞嗭細绉诲姩杩借釜 + 鑷垎鎺ヨ繎鏍囪
     */
    update(deltaTime, player) {
        if (!this.active) return;

        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }

        if (this.contactCooldown > 0) {
            this.contactCooldown -= deltaTime;
        }

        this.knockbackX *= this.knockbackDecay;
        this.knockbackY *= this.knockbackDecay;

        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        const moveX = Math.cos(angle) * this.speed * deltaTime * 60;
        const moveY = Math.sin(angle) * this.speed * deltaTime * 60;

        this.x += moveX + this.knockbackX;
        this.y += moveY + this.knockbackY;

        if (this.isExploder) {
            const dist = Utils.distance(this.x, this.y, player.x, player.y);
            if (dist < this.explodeTriggerDistance) {
                this._triggeredExplode = true;
                this.active = false;
            }
        }
    }

    /**
     * 缁樺埗鏁屼汉
     */

        ctx.fillStyle = fillColor;

        switch (this.type) {
            case 'normal':
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'fast':
                ctx.beginPath();
                ctx.moveTo(screenX, screenY - this.size);
                ctx.lineTo(screenX + this.size * 0.7, screenY);
                ctx.lineTo(screenX, screenY + this.size);
                ctx.lineTo(screenX - this.size * 0.7, screenY);
                ctx.closePath();
                ctx.fill();
                break;

            case 'tank':
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    const px = screenX + Math.cos(a) * this.size;
                    const py = screenY + Math.sin(a) * this.size;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                break;

            case 'exploder':
                const pulse = 1 + Math.sin(Date.now() * EnemyConfig.EXPLODER_PULSE_SPEED) * EnemyConfig.EXPLODER_PULSE_AMPLITUDE;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * EnemyConfig.EXPLODER_INNER_RATIO, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'elite':
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    const r = i % 2 === 0 ? this.size : this.size * EnemyConfig.ELITE_STAR_INNER_RATIO;
                    const px = screenX + Math.cos(a) * r;
                    const py = screenY + Math.sin(a) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                break;
        }

        if (this.hp < this.maxHp) {
            ctx.shadowBlur = 0;
            const barWidth = this.size * EnemyConfig.HP_BAR_WIDTH_RATIO;
            const barHeight = EnemyConfig.HP_BAR_HEIGHT;
            const barX = screenX - barWidth / 2;
            const barY = screenY - this.size - EnemyConfig.HP_BAR_OFFSET_Y;

            ctx.fillStyle = EnemyConfig.HP_BAR_BG;
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const hpPercent = this.hp / this.maxHp;
            ctx.fillStyle = hpPercent > EnemyConfig.HP_THRESHOLD_HIGH ? EnemyConfig.HP_COLOR_HIGH
                : hpPercent > EnemyConfig.HP_THRESHOLD_MID ? EnemyConfig.HP_COLOR_MID
                : EnemyConfig.HP_COLOR_LOW;
            ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        }

        ctx.restore();
    }
}

/**
 * 鏁屼汉绠＄悊鍣?
 * 鎵€鏈夎法绯荤粺鏁堟灉锛堢矑瀛?缁忛獙/闊虫晥/浼ゅ锛夊湪姝ら泦涓鐞嗭紝
 * 鑰岄潪鍒嗘暎鍦?Enemy 瀹炰綋涓€傛湭鏉ヨ縼绉诲埌 EventBus 鐩戝惉妯″紡銆?
 */
class EnemyManager extends ObjectPool {
    constructor(maxEnemies = 500) {
        super(() => new Enemy(), maxEnemies);
        this.events = null;
    }

    /**
     * 鐢熸垚鏁屼汉
     */
    spawn(type, x, y, hpMultiplier = 1, speedMultiplier = 1) {
        const enemy = this.acquire();
        if (enemy) {
            enemy.init(type, x, y, hpMultiplier, speedMultiplier);
        }
        return enemy;
    }

    /**
     * 鑾峰彇鎵€鏈夋椿璺冩晫浜烘暟缁?
     */
    getActiveEnemies() {
        const result = [];
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) {
                result.push(this.pool[i]);
            }
        }
        return result;
    }

    update(deltaTime, player, particleManager, experienceManager, audio) {
        for (let i = 0; i < this.pool.length; i++) {
            const e = this.pool[i];
            if (!e.active) continue;

            e.update(deltaTime, player);

            if (!e.active) {
                this._handleDeath(e, player, particleManager, experienceManager, audio);
                continue;
            }

            if (e.hp <= 0) {
                this._handleDeath(e, player, particleManager, experienceManager, audio);
                continue;
            }

            if (!e.isExploder && e.contactCooldown <= 0 && Utils.circleCollision(e.x, e.y, e.size, player.x, player.y, player.size)) {
                player.takeDamage(e.damage);
                e.contactCooldown = EnemyConfig.CONTACT_DAMAGE_COOLDOWN;
            }
        }
    }

    /**
     * 缁熶竴澶勭悊鏁屼汉姝讳骸鏁堟灉
     */
    _handleDeath(e, player, particleManager, experienceManager, audio) {
        if (this.events) {
            this.events.emit('enemy:dead', {
                x: e.x, y: e.y,
                color: e.color,
                isExploder: e.isExploder,
                type: e.type,
                exp: e.exp, gold: e.gold,
                proximityExplode: e._triggeredExplode,
            });
        }

        particleManager.spawnExplosion(e.x, e.y, e.color, EnemyConfig.DEATH_PARTICLE_COUNT);
        experienceManager.spawnOrb(e.x, e.y, e.exp, e.gold);
        player.addKill(e.type === 'elite');

        if (e.isExploder) {
            if (e._triggeredExplode) {
                particleManager.spawnExplosion(e.x, e.y, EnemyConfig.EXPLODE_PARTICLE_COLOR, EnemyConfig.EXPLODE_PROXIMITY_PARTICLE_COUNT);
            }
            particleManager.spawnExplosion(e.x, e.y, EnemyConfig.EXPLODE_PARTICLE_COLOR, EnemyConfig.EXPLODE_PARTICLE_COUNT);
            const dist = Utils.distance(e.x, e.y, player.x, player.y);
            if (dist < e.explodeRadius + player.size) {
                player.takeDamage(e.damage);
            }
        }

        if (audio) {
            if (e.isExploder) {
                audio.exploderExplode();
            } else if (e.type === 'tank' || e.type === 'elite') {
                audio.enemyDeadBig();
            } else {
                audio.enemyDead();
            }
        }

        e.die();
    }

    }
}

if (typeof window !== 'undefined') {
    window.Enemy = Enemy;
    window.EnemyManager = EnemyManager;
}
