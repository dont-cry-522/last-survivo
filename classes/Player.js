/**
 * ============================================================
 *  Player.js - 玩家飞船
 * ============================================================
 *  蓝色科技飞船，八方向移动，Shift冲刺，自动攻击
 *  支持：尾焰粒子、移动残影、冲刺残影
 *  技能系统通过修改 Player 属性实现效果
 * ============================================================
 */

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 2;

        const cfg = Config.PLAYER;
        this.maxHp = cfg.maxHp;
        this.hp = cfg.maxHp;
        this.speed = cfg.speed;
        this.baseSpeed = cfg.speed;
        this.attackSpeed = cfg.attackSpeed;
        this.attackRange = cfg.attackRange;
        this.bulletDamage = cfg.bulletDamage;
        this.bulletSpeed = cfg.bulletSpeed;
        this.bulletCount = cfg.bulletCount;
        this.pierce = cfg.pierce;
        this.critRate = cfg.critRate;
        this.critDamage = cfg.critDamage;
        this.magnetRange = cfg.magnetRange;
        this.expMultiplier = cfg.expMultiplier;
        this.size = cfg.size;
        this.shield = 0;

        this.dashCooldown = cfg.dashCooldown;
        this.dashCooldownMax = cfg.dashCooldown;
        this.dashDuration = cfg.dashDuration;
        this.dashSpeedMultiplier = cfg.dashSpeedMultiplier;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDirection = { x: 0, y: 0 };

        this.attackTimer = 0;
        this.attackInterval = 1 / this.attackSpeed;

        this.level = 1;
        this.exp = 0;
        this.expToNext = Config.getExpForLevel(1);
        this.gold = 0;

        this.invincibleTimer = 0;
        this.invincibleDuration = 0.5;

        this.afterimageTimer = 0;
        this.trailTimer = 0;

        this.keys = { w: false, a: false, s: false, d: false, shift: false };

        this.kills = 0;
        this.bossKills = 0;
        this.upgradeCount = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;

        this.color = Config.COLORS.player;
        this.glowColor = Config.COLORS.playerGlow;
        this.audio = null;

        this.animTimer = 0;
        this.muzzleFlash = 0;
        this.walkCycle = 0;

        // 技能属性
        this._spreadAngle = null;
        this._dualWieldDirections = 0;
        this._overheat = null;
        this._overheatStacks = 0;
        this._overheatTimer = 0;
        this._pierceDmgBonus = 0;
        this._bounce = null;
        this._splitter = null;
        this._turrets = null;
        this._mines = null;
    }

    onKeyDown(key) {
        let k = key.toLowerCase();
        if (k === 'arrowup' || k === 'home' || k === 'pageup' || k === 'numpad8') k = 'w';
        if (k === 'arrowdown' || k === 'end' || k === 'pagedown' || k === 'numpad2') k = 's';
        if (k === 'arrowleft' || k === 'numpad4') k = 'a';
        if (k === 'arrowright' || k === 'numpad6') k = 'd';
        if (k in this.keys) this.keys[k] = true;
        if (k === 'shift') { this.keys.shift = true; this.tryDash(); }
    }

    onKeyUp(key) {
        let k = key.toLowerCase();
        if (k === 'arrowup' || k === 'home' || k === 'pageup' || k === 'numpad8') k = 'w';
        if (k === 'arrowdown' || k === 'end' || k === 'pagedown' || k === 'numpad2') k = 's';
        if (k === 'arrowleft' || k === 'numpad4') k = 'a';
        if (k === 'arrowright' || k === 'numpad6') k = 'd';
        if (k in this.keys) this.keys[k] = false;
        if (k === 'shift') this.keys.shift = false;
    }

    tryDash() {
        if (this.dashCooldown > 0 || this.isDashing) return;

        let dx = 0, dy = 0;
        if (this.keys.w) dy -= 1;
        if (this.keys.s) dy += 1;
        if (this.keys.a) dx -= 1;
        if (this.keys.d) dx += 1;

        if (dx === 0 && dy === 0) {
            dx = Math.cos(this.angle);
            dy = Math.sin(this.angle);
        } else {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        this.dashDirection.x = dx;
        this.dashDirection.y = dy;
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = this.dashCooldownMax;
        this.invincibleTimer = Math.max(this.invincibleTimer, this.dashDuration);

        if (this.audio) this.audio.dash();
        if (this._onDash) this._onDash();
    }

    takeDamage(amount) {
        if (this.shield > 0) {
            const d = Math.min(this.shield, amount);
            this.shield -= d;
            amount -= d;
        }
        this.hp -= amount;
        this.combo = 0;
        if (this.audio) this.audio.playerHit();
        if (this._onDamaged && amount > 0) this._onDamaged(amount);
        if (this.hp <= 0) { this.hp = 0; return true; }
        return false;
    }

    addExp(amount) {
        this.exp += amount * this.expMultiplier;
        let leveledUp = false;
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level++;
            this.expToNext = Config.getExpForLevel(this.level);
            this.maxHp += Config.PLAYER.levelHpBonus;
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.2);
            this.bulletDamage += Config.PLAYER.levelDamageBonus;
            leveledUp = true;
        }
        return leveledUp;
    }

    addGold(amount) { this.gold += amount; }

    addKill(isBoss = false) {
        this.kills++;
        this.combo++;
        this.comboTimer = 3;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        if (isBoss) this.bossKills++;
        // 过热：击杀触发
        if (this._overheat) {
            this._overheatStacks = Math.min((this._overheatStacks || 0) + 1, this._overheat.maxStacks);
            this._overheatTimer = this._overheat.duration;
        }
    }

    findNearestEnemy(enemies) {
        let nearest = null;
        let nearestDist = this.attackRange * this.attackRange;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e.active) continue;
            const dist = Utils.distanceSq(this.x, this.y, e.x, e.y);
            if (dist < nearestDist) { nearestDist = dist; nearest = e; }
        }
        return nearest;
    }

    autoAttack(deltaTime, enemies, bulletManager, particleManager) {
        this.attackTimer -= deltaTime;

        // 过热计时
        if (this._overheat && this._overheatStacks > 0) {
            this._overheatTimer -= deltaTime;
            if (this._overheatTimer <= 0) this._overheatStacks = 0;
        }
        if (this._blinkCrit) {
            this._blinkCrit.timer -= deltaTime;
            if (this._blinkCrit.timer <= 0) this._blinkCrit = null;
        }
        const bonusAS = (this._overheatStacks || 0) * (this._overheat ? this._overheat.perStack : 0);
        const currentAS = this.attackSpeed * (1 + bonusAS);

        if (this.attackTimer > 0) return;

        const target = this.findNearestEnemy(enemies);
        if (!target) return;

        this.attackInterval = 1 / currentAS;
        this.attackTimer = this.attackInterval;

        const bulletCount = this.bulletCount;
        const spreadAngle = this._spreadAngle !== null ? this._spreadAngle : (bulletCount > 1 ? 0.3 : 0);

        // 双持多方向
        const directions = this._dualWieldDirections || 1;
        const dirSpan = (directions - 1) * 0.4;
        const dirStart = -dirSpan / 2;

        for (let d = 0; d < directions; d++) {
            const dirOff = directions > 1 ? dirStart + d * 0.4 : 0;
            for (let i = 0; i < bulletCount; i++) {
                let angle = Utils.angle(this.x, this.y, target.x, target.y) + dirOff;
                if (bulletCount > 1) {
                    angle += (i - (bulletCount - 1) / 2) * spreadAngle;
                }
                let isCrit = Math.random() < this.critRate;
                let baseDmg = this.bulletDamage;
                // 弱点洞悉：低血量必暴
                const w = window.game?.skillManager?.runtimeState?._weakness;
                if (w && target && target.active && target.hp / target.maxHp <= w.threshold) {
                    isCrit = true;
                    baseDmg *= (1 + (w.critDmgBonus || 0));
                }
                // 鲜血狂怒 + 灵魂收割暴伤
                const frenzy = window.game?.skillManager?.runtimeState?._frenzy;
                const frenzyBonus = (frenzy && frenzy.timer > 0) ? frenzy.stacks * (window.game?.skillManager?.getSkill('blood_frenzy')?.getCurrentEffect()?.params?.perStack || 0) : 0;
                const soulBonus = (window.game?.skillManager?.runtimeState?._souls || 0) * (window.game?.skillManager?.getSkill('soul_harvest')?.getCurrentEffect()?.params?.perStack || 0);
                // 闪现暴伤
                if (this._blinkCrit && this._blinkCrit.timer > 0) {
                    isCrit = true;
                    baseDmg *= (1 + (this._blinkCrit.bonus || 0));
                }
                const voidBonus = (window.game?.skillManager?.runtimeState?._voidStacks || 0) * (window.game?.skillManager?.getSkill('void_walker')?.getCurrentEffect()?.params?.perStack || 0);
                const critDmg = this.critDamage * (1 + frenzyBonus + soulBonus);
                const damage = (isCrit ? baseDmg * critDmg : baseDmg) * (1 + voidBonus);
                const bullet = bulletManager.fire(this.x, this.y, angle, damage, this.bulletSpeed, this.pierce, target);
                if (bullet) bullet.isCrit = isCrit;
                this.muzzleFlash = 0.05;
            }
        }

        if (this.audio) this.audio.shoot();
    }

    update(deltaTime, enemies, bulletManager, particleManager) {
        this.animTimer += deltaTime;
        if (this.muzzleFlash > 0) this.muzzleFlash -= deltaTime;
        if (this.dashCooldown > 0) { this.dashCooldown -= deltaTime; if (this.dashCooldown < 0) this.dashCooldown = 0; }
        if (this.invincibleTimer > 0) this.invincibleTimer -= deltaTime;
        if (this.comboTimer > 0) { this.comboTimer -= deltaTime; if (this.comboTimer <= 0) this.combo = 0; }

        let moved = false;
        if (this.isDashing) {
            this.dashTimer -= deltaTime;
            if (this.dashTimer <= 0) this.isDashing = false;
            const dashSpeed = this.speed * this.dashSpeedMultiplier;
            this.x += this.dashDirection.x * dashSpeed * deltaTime * 60;
            this.y += this.dashDirection.y * dashSpeed * deltaTime * 60;
            this.afterimageTimer -= deltaTime;
            if (this.afterimageTimer <= 0) {
                this.afterimageTimer = 0.03;
                particleManager.spawnAfterimage(this.x, this.y, this.size, this.color);
            }
        } else {
            let dx = 0, dy = 0;
            if (this.keys.w) dy -= 1;
            if (this.keys.s) dy += 1;
            if (this.keys.a) dx -= 1;
            if (this.keys.d) dx += 1;
            if (dx !== 0 && dy !== 0) { const len = Math.sqrt(dx * dx + dy * dy); dx /= len; dy /= len; }
            if (dx !== 0 || dy !== 0) this.angle = Math.atan2(dy, dx);
            this.x += dx * this.speed * deltaTime * 60;
            this.y += dy * this.speed * deltaTime * 60;
            if (dx !== 0 || dy !== 0) {
                moved = true;
                this.walkCycle += deltaTime * 8;
                this.afterimageTimer -= deltaTime;
                if (this.afterimageTimer <= 0) {
                    this.afterimageTimer = 0.08;
                    particleManager.spawnAfterimage(this.x, this.y, this.size * 0.8, this.glowColor);
                }
            } else {
                this.walkCycle = 0;
            }
        }

        this.trailTimer -= deltaTime;
        if (this.trailTimer <= 0) {
            this.trailTimer = 0.03;
            particleManager.spawnTrail(
                this.x - Math.cos(this.angle) * this.size * 0.8,
                this.y - Math.sin(this.angle) * this.size * 0.8,
                this.angle, this.color
            );
        }

        this.autoAttack(deltaTime, enemies, bulletManager, particleManager);
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const s = this.size;
        const t = this.animTimer;
        const walk = Math.sin(this.walkCycle) * 2;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 20) % 2 === 0) ctx.globalAlpha = 0.5;

        const bodyColor = '#b8976e';
        const darkColor = '#8a6d50';

        // 腿（走路动画）
        if (this.isDashing) {
            ctx.globalAlpha *= 0.6;
        }
        ctx.fillStyle = darkColor;
        ctx.fillRect(-s * 0.15, s * 0.15, s * 0.16, s * 0.45);
        ctx.fillRect(s * 0.02, s * 0.15, s * 0.16, s * 0.45);
        // 靴子
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(-s * 0.2, s * 0.55, s * 0.24, s * 0.1);
        ctx.fillRect(-s * 0.02, s * 0.55, s * 0.24, s * 0.1);

        // 披风 / 背包
        ctx.fillStyle = '#6b5030';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.05, s * 0.3, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 躯干（收腰）
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, -s * 0.05);
        ctx.lineTo(-s * 0.22, s * 0.3);
        ctx.lineTo(s * 0.22, s * 0.3);
        ctx.lineTo(s * 0.35, -s * 0.05);
        ctx.closePath();
        ctx.fill();

        // 肩甲（最宽部分）
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-s * 0.55, -s * 0.15);
        ctx.lineTo(-s * 0.35, -s * 0.05);
        ctx.lineTo(-s * 0.25, -s * 0.25);
        ctx.lineTo(-s * 0.45, -s * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.55, -s * 0.15);
        ctx.lineTo(s * 0.35, -s * 0.05);
        ctx.lineTo(s * 0.25, -s * 0.25);
        ctx.lineTo(s * 0.45, -s * 0.35);
        ctx.closePath();
        ctx.fill();

        // 头盔
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.arc(0, -s * 0.2, s * 0.32, Math.PI, 0);
        ctx.fill();
        // 头盔顶
        ctx.fillRect(-s * 0.32, -s * 0.38, s * 0.64, s * 0.2);

        // 护目镜（琥珀色横条）
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-s * 0.22, -s * 0.26, s * 0.44, s * 0.07);
        // 护目镜微光
        ctx.fillStyle = 'rgba(255,136,0,0.3)';
        ctx.fillRect(-s * 0.22, -s * 0.28, s * 0.44, s * 0.12);

        // 枪管（从身体前方伸出）
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(s * 0.38, -s * 0.1, s * 0.8, s * 0.08);
        // 枪口
        ctx.fillStyle = '#666';
        ctx.fillRect(s * 1.15, -s * 0.13, s * 0.12, s * 0.14);

        // 枪口火焰
        if (this.muzzleFlash > 0) {
            const flashAlpha = this.muzzleFlash / 0.05;
            ctx.fillStyle = `rgba(255,200,100,${flashAlpha})`;
            ctx.beginPath();
            ctx.arc(s * 1.3, -s * 0.05, s * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255,255,200,${flashAlpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(s * 1.3, -s * 0.05, s * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }

        // 护盾
        if (this.shield > 0) {
            ctx.strokeStyle = 'rgba(255,180,100,0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, s * 0.05, s * 1.0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    reset(x, y) {
        const cfg = Config.PLAYER;
        this.x = x;
        this.y = y;
        this.maxHp = cfg.maxHp;
        this.hp = cfg.maxHp;
        this.speed = cfg.speed;
        this.attackSpeed = cfg.attackSpeed;
        this.attackRange = cfg.attackRange;
        this.bulletDamage = cfg.bulletDamage;
        this.bulletSpeed = cfg.bulletSpeed;
        this.bulletCount = cfg.bulletCount;
        this.pierce = cfg.pierce;
        this.critRate = cfg.critRate;
        this.critDamage = cfg.critDamage;
        this.magnetRange = cfg.magnetRange;
        this.expMultiplier = cfg.expMultiplier;
        this.dashCooldown = 0;
        this.dashCooldownMax = cfg.dashCooldown;
        this.level = 1;
        this.exp = 0;
        this.expToNext = Config.getExpForLevel(1);
        this.gold = 0;
        this.kills = 0;
        this.bossKills = 0;
        this.upgradeCount = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.shield = 0;
        this.angle = -Math.PI / 2;
        this.isDashing = false;
        this.invincibleTimer = 0;
        // 技能属性重置
        this._spreadAngle = null;
        this._dualWieldDirections = 0;
        this._overheat = null;
        this._overheatStacks = 0;
        this._overheatTimer = 0;
        this._pierceDmgBonus = 0;
        this._bounce = null;
        this._splitter = null;
        this._turrets = null;
        this._mines = null;
    }
}

if (typeof window !== 'undefined') {
    window.Player = Player;
}
