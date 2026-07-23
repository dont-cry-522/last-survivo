/**
 * ============================================================
 *  Enemy.js - 敌人系统
 * ============================================================
 *  四种敌人类型：普通、快速、坦克、自爆
 *  统一AI：追踪玩家移动
 *  Enemy 实体是纯数据+行为，不直接调用任何外部系统。
 *  所有跨系统效果（粒子/音效/经验/伤害）由 EnemyManager 统一处理。
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

        this.animTimer = Math.random() * Math.PI * 2;
        this.angle = 0;
    }

    /**
     * 初始化敌人
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
     * 受到伤害（纯数据变更，不产生外部效果）
     * @returns {boolean} 是否死亡
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
     * 死亡（纯状态变更，外部效果由 EnemyManager 处理）
     */
    die() {
        this.active = false;
    }

    /**
     * 更新移动AI（不调用任何外部系统）
     * 仅处理：移动追踪 + 自爆接近标记
     */
    update(deltaTime, player) {
        if (!this.active) return;

        this.animTimer += deltaTime;

        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }

        if (this.contactCooldown > 0) {
            this.contactCooldown -= deltaTime;
        }

        if (Enemy._statusSystem) Enemy._statusSystem.update(this, deltaTime);

        this.knockbackX *= this.knockbackDecay;
        this.knockbackY *= this.knockbackDecay;

        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        const speedMul = Enemy._statusSystem ? Enemy._statusSystem.getSpeedMultiplier(this) : 1;
        const moveX = Math.cos(angle) * this.speed * speedMul * deltaTime * 60;
        const moveY = Math.sin(angle) * this.speed * speedMul * deltaTime * 60;

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
     * 绘制敌人
     */
    draw(ctx, cameraX, cameraY) {
        if (!this.active) return;

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const s = this.size;
        const t = this.animTimer;

        let bodyColor = this.color;
        let flashWhite = this.hitFlash > 0;
        if (this.burnStacks > 0) {
            bodyColor = '#ff6600';
        } else if (this.frozen) {
            bodyColor = '#88ccff';
        } else if (this.paralyzed) {
            bodyColor = '#ffff88';
        }

        ctx.save();
        ctx.translate(screenX, screenY);

        switch (this.type) {
            case 'normal':
                this._drawLost(ctx, s, t, bodyColor, flashWhite);
                break;
            case 'fast':
                this._drawCrawler(ctx, s, t, bodyColor, flashWhite);
                break;
            case 'tank':
                this._drawBrute(ctx, s, t, bodyColor, flashWhite);
                break;
            case 'exploder':
                this._drawBurst(ctx, s, t, bodyColor, flashWhite);
                break;
            case 'elite':
                this._drawCommander(ctx, s, t, bodyColor, flashWhite);
                break;
        }

        ctx.restore();

        if (this.hp < this.maxHp) {
            const barW = s * EnemyConfig.HP_BAR_WIDTH_RATIO;
            const barH = EnemyConfig.HP_BAR_HEIGHT;
            const barX = screenX - barW / 2;
            const barY = screenY - s - EnemyConfig.HP_BAR_OFFSET_Y;
            ctx.fillStyle = EnemyConfig.HP_BAR_BG;
            ctx.fillRect(barX, barY, barW, barH);
            const pct = this.hp / this.maxHp;
            ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#fbbf24' : '#ef4444';
            ctx.fillRect(barX, barY, barW * pct, barH);
        }
    }

    // ── 迷失者：驼背歪头、手臂下垂的人形 ──
    _drawLost(ctx, s, t, color, flash) {
        const bob = Math.sin(t * 2.5) * 1.5;
        ctx.save();
        ctx.translate(0, bob);

        const headTilt = Math.sin(t * 1.8) * 0.3;
        const bodyLean = 0.15;

        ctx.fillStyle = flash ? '#ffffff' : color;

        // 腿（两条短柱）
        ctx.fillRect(-s * 0.25, s * 0.35, s * 0.18, s * 0.5);
        ctx.fillRect(s * 0.08, s * 0.35, s * 0.18, s * 0.5);

        // 躯干（倾斜的椭圆，驼背感）
        ctx.save();
        ctx.rotate(-bodyLean);
        ctx.beginPath();
        ctx.ellipse(0, s * 0.05, s * 0.4, s * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 手臂（垂在两侧）
        ctx.save();
        ctx.rotate(-0.3);
        ctx.fillRect(-s * 0.55, s * 0.1, s * 0.1, s * 0.45);
        ctx.restore();
        ctx.save();
        ctx.rotate(0.25);
        ctx.fillRect(s * 0.3, s * -0.05, s * 0.1, s * 0.4);
        ctx.restore();

        // 头（歪向一侧的圆）
        ctx.save();
        ctx.translate(s * 0.08, -s * 0.45);
        ctx.rotate(headTilt);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // 眼眶（两个暗红小点）
        ctx.fillStyle = '#882222';
        ctx.beginPath();
        ctx.arc(-s * 0.08, -s * 0.04, s * 0.06, 0, Math.PI * 2);
        ctx.arc(s * 0.08, -s * 0.04, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    // ── 爬行者：四足着地、脊椎骨刺、像野兽 ──
    _drawCrawler(ctx, s, t, color, flash) {
        const gallop = Math.sin(t * 6) * 2;
        const spineWave = Math.sin(t * 5) * s * 0.1;
        ctx.save();

        ctx.fillStyle = flash ? '#ffffff' : color;

        // 前腿
        ctx.fillRect(-s * 0.6, -s * 0.15 + gallop * 0.5, s * 0.12, s * 0.6);
        ctx.fillRect(-s * 0.3, -s * 0.15 - gallop * 0.5, s * 0.12, s * 0.6);

        // 后腿
        ctx.fillRect(s * 0.1, -s * 0.15 - gallop * 0.5, s * 0.12, s * 0.55);
        ctx.fillRect(s * 0.35, -s * 0.15 + gallop * 0.5, s * 0.12, s * 0.55);

        // 躯干（细长横椭圆）
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.55, s * 0.9, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 脊柱骨刺（白色锯齿线）
        ctx.strokeStyle = flash ? '#ffffff' : '#c8c0b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, -s * 0.6 + spineWave);
        for (let i = 0; i < 6; i++) {
            const px = -s * 0.7 + i * s * 0.28;
            const py = -s * 0.6 + spineWave + (i % 2 === 0 ? -s * 0.1 : s * 0.05);
            ctx.lineTo(px, py);
        }
        ctx.stroke();

        // 头部（尖锐三角）
        ctx.beginPath();
        ctx.moveTo(-s * 1.1, -s * 0.55);
        ctx.lineTo(-s * 0.75, -s * 0.45);
        ctx.lineTo(-s * 0.75, -s * 0.65);
        ctx.closePath();
        ctx.fill();

        // 眼缝
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-s * 1.0, -s * 0.58, s * 0.15, s * 0.04);

        ctx.restore();
    }

    // ── 蛮兽：上宽下窄的倒三角巨躯、细腿 ──
    _drawBrute(ctx, s, t, color, flash) {
        const stomp = Math.abs(Math.sin(t * 1.5)) * 1.5;
        ctx.save();
        ctx.translate(0, stomp);

        ctx.fillStyle = flash ? '#ffffff' : color;

        // 粗腿
        ctx.fillRect(-s * 0.3, s * 0.2, s * 0.25, s * 0.55);
        ctx.fillRect(s * 0.05, s * 0.2, s * 0.25, s * 0.55);

        // 巨大躯干（向上变宽的梯形）
        ctx.beginPath();
        ctx.moveTo(-s * 0.65, s * 0.15);
        ctx.lineTo(-s * 0.9, -s * 0.4);
        ctx.lineTo(-s * 0.55, -s * 0.75);
        ctx.lineTo(s * 0.55, -s * 0.75);
        ctx.lineTo(s * 0.9, -s * 0.4);
        ctx.lineTo(s * 0.65, s * 0.15);
        ctx.closePath();
        ctx.fill();

        // 肩部骨板
        ctx.fillStyle = flash ? '#ffffff' : '#c8b898';
        ctx.beginPath();
        ctx.moveTo(-s * 0.9, -s * 0.4);
        ctx.lineTo(-s * 1.05, -s * 0.6);
        ctx.lineTo(-s * 0.6, -s * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.9, -s * 0.4);
        ctx.lineTo(s * 1.05, -s * 0.6);
        ctx.lineTo(s * 0.6, -s * 0.65);
        ctx.closePath();
        ctx.fill();

        // 头（嵌在肩膀里的小圆）
        ctx.fillStyle = flash ? '#ffffff' : color;
        ctx.beginPath();
        ctx.arc(0, -s * 0.6, s * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 眼点
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-s * 0.06, -s * 0.63, s * 0.05, 0, Math.PI * 2);
        ctx.arc(s * 0.06, -s * 0.63, s * 0.05, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ── 脓肿：巨大球形腹腔、小头、细腿、脉动 ──
    _drawBurst(ctx, s, t, color, flash) {
        const pulseFreq = 6 + (this.hp / this.maxHp) * 4;
        const pulse = 1 + Math.sin(t * pulseFreq) * 0.12;
        const hpRatio = this.hp / this.maxHp;
        const bellyColor = flash ? '#ffffff' : `rgb(${Math.floor(200 - hpRatio * 100)},${Math.floor(80 - hpRatio * 60)},0)`;
        const coreBright = 1 - hpRatio;

        ctx.save();

        // 细腿
        ctx.fillStyle = flash ? '#ffffff' : color;
        ctx.fillRect(-s * 0.15, s * 0.15, s * 0.13, s * 0.4);
        ctx.fillRect(s * 0.02, s * 0.15, s * 0.13, s * 0.4);

        // 腹腔（扁椭圆、脉动）
        const bellyR = s * 0.75 * pulse;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.05, bellyR, bellyR * 0.85, 0, 0, Math.PI * 2);
        ctx.fillStyle = bellyColor;
        ctx.fill();

        // 血管纹路
        if (!flash && !this.frozen) {
            ctx.strokeStyle = `rgba(106,16,16,${0.5 + coreBright * 0.3})`;
            ctx.lineWidth = 0.8;
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 + t * 0.3;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * bellyR * 0.3, -s * 0.05 + Math.sin(a) * bellyR * 0.25);
                ctx.lineTo(Math.cos(a) * bellyR * 0.85, -s * 0.05 + Math.sin(a) * bellyR * 0.7);
                ctx.stroke();
            }
        }

        // 核心光（中心橙点）
        const coreAlpha = 0.4 + coreBright * 0.6;
        ctx.fillStyle = `rgba(255,102,0,${coreAlpha})`;
        ctx.beginPath();
        ctx.arc(0, -s * 0.05, bellyR * 0.3 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // 小头（在腹腔上方边缘）
        ctx.fillStyle = flash ? '#ffffff' : color;
        ctx.beginPath();
        ctx.arc(0, -s * 0.55 - bellyR * 0.15, s * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 眼
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-0.04 * s, -s * 0.57 - bellyR * 0.12, s * 0.04, 0, Math.PI * 2);
        ctx.arc(0.04 * s, -s * 0.57 - bellyR * 0.12, s * 0.04, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ── 督军：直立士兵、残破头盔、披风、拖行武器 ──
    _drawCommander(ctx, s, t, color, flash) {
        const bob = Math.sin(t * 1.8) * 1;
        ctx.save();
        ctx.translate(0, bob);

        // 披风（在身后飘动）
        const capeWave = Math.sin(t * 1.2) * s * 0.15;
        ctx.fillStyle = flash ? '#ffffff' : '#2a3028';
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, -s * 0.1);
        ctx.lineTo(-s * 0.15, s * 0.7 + capeWave);
        ctx.lineTo(s * 0.15, s * 0.7 - capeWave);
        ctx.lineTo(s * 0.35, -s * 0.1);
        ctx.closePath();
        ctx.fill();

        // 腿
        ctx.fillStyle = flash ? '#ffffff' : color;
        ctx.fillRect(-s * 0.2, s * 0.2, s * 0.16, s * 0.5);
        ctx.fillRect(s * 0.04, s * 0.2, s * 0.16, s * 0.5);

        // 躯干
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.05, s * 0.35, s * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 手臂（一条拖武器）
        ctx.fillRect(s * 0.3, -s * 0.15, s * 0.1, s * 0.4);

        // 武器（在地上的残破刀刃）
        const wepX = s * 0.35;
        const wepY = s * 0.3;
        ctx.fillStyle = flash ? '#ffffff' : '#557788';
        ctx.beginPath();
        ctx.moveTo(wepX, wepY);
        ctx.lineTo(wepX - s * 0.1, wepY + s * 0.6);
        ctx.lineTo(wepX + s * 0.1, wepY + s * 0.55);
        ctx.closePath();
        ctx.fill();

        // 武器刃口冷光
        ctx.strokeStyle = flash ? '#ffffff' : 'rgba(68,204,221,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(wepX, wepY);
        ctx.lineTo(wepX - s * 0.08, wepY + s * 0.55);
        ctx.stroke();

        // 头盔
        ctx.fillStyle = flash ? '#ffffff' : color;
        ctx.beginPath();
        ctx.arc(0, -s * 0.4, s * 0.25, Math.PI, 0);
        ctx.fill();

        // 头盔冠顶（褪色金、残破）
        ctx.fillStyle = flash ? '#ffffff' : '#8a8040';
        ctx.beginPath();
        ctx.moveTo(-s * 0.12, -s * 0.65);
        ctx.lineTo(s * 0.12, -s * 0.65);
        ctx.lineTo(s * 0.04, -s * 0.8);
        ctx.lineTo(-s * 0.06, -s * 0.8);
        ctx.closePath();
        ctx.fill();

        // 冠顶裂缝
        ctx.strokeStyle = '#1a2020';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.65);
        ctx.lineTo(s * 0.02, -s * 0.78);
        ctx.stroke();

        // 眼睛（青色冷光缝隙）
        ctx.fillStyle = flash ? '#ffffff' : '#44ccdd';
        ctx.fillRect(-s * 0.1, -s * 0.44, s * 0.06, s * 0.03);
        ctx.fillRect(s * 0.04, -s * 0.44, s * 0.06, s * 0.03);

        ctx.restore();
    }
}

// StatusSystem 委托 getter/setter（向后兼容技能直接读写）
Object.defineProperties(Enemy.prototype, {
    burnStacks: {
        get() { return Enemy._statusSystem ? Enemy._statusSystem.burnStacks(this) : 0; },
        set(v) { if (Enemy._statusSystem) Enemy._statusSystem.setBurnStacks(this, v); }
    },
    burnTimer: {
        get() { return Enemy._statusSystem ? Enemy._statusSystem.burnTimer(this) : 0; },
        set(v) { if (Enemy._statusSystem) Enemy._statusSystem.setBurnTimer(this, v); }
    },
    burnDmgPerStack: {
        get() { return Enemy._statusSystem ? Enemy._statusSystem.burnDmgPerStack(this) : 0; },
        set(v) { if (Enemy._statusSystem) Enemy._statusSystem.setBurnDmgPerStack(this, v); }
    },
    slowAmount: {
        get() { return Enemy._statusSystem ? Enemy._statusSystem.slowAmount(this) : 0; },
        set(v) { if (Enemy._statusSystem) Enemy._statusSystem.setSlowAmount(this, v); }
    },
    frozen: {
        get() { return Enemy._statusSystem ? Enemy._statusSystem.frozen(this) : false; },
        set(v) { if (Enemy._statusSystem) Enemy._statusSystem.setFrozen(this, v); }
    },
    frozenTimer: {
        get() { return Enemy._statusSystem ? Enemy._statusSystem.frozenTimer(this) : 0; },
        set(v) { if (Enemy._statusSystem) Enemy._statusSystem.setFrozenTimer(this, v); }
    },
    paralyzed: {
        get() { return Enemy._statusSystem ? Enemy._statusSystem.paralyzed(this) : false; },
        set(v) { if (Enemy._statusSystem) Enemy._statusSystem.setParalyzed(this, v); }
    },
    paralyzeTimer: {
        get() { return Enemy._statusSystem ? Enemy._statusSystem.paralyzeTimer(this) : 0; },
        set(v) { if (Enemy._statusSystem) Enemy._statusSystem.setParalyzeTimer(this, v); }
    },
});

Enemy._statusSystem = null;

/**
 * 敌人管理器
 * 所有跨系统效果（粒子/经验/音效/伤害）在此集中处理，
 * 而非分散在 Enemy 实体中。未来迁移到 EventBus 监听模式。
 */
class EnemyManager extends ObjectPool {
    constructor(maxEnemies = 500) {
        super(() => new Enemy(), maxEnemies);
        this.events = null;
    }

    /**
     * 生成敌人
     */
    spawn(type, x, y, hpMultiplier = 1, speedMultiplier = 1) {
        const enemy = this.acquire();
        if (enemy) {
            enemy.init(type, x, y, hpMultiplier, speedMultiplier);
        }
        return enemy;
    }

    /**
     * 获取所有活跃敌人数组
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
     * 统一处理敌人死亡效果
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

    draw(ctx, cameraX, cameraY) {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].draw(ctx, cameraX, cameraY);
        }
    }
}

if (typeof window !== 'undefined') {
    window.Enemy = Enemy;
    window.EnemyManager = EnemyManager;
}
