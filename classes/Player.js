/**
 * ============================================================
 *  Player.js - 鐜╁椋炶埞
 * ============================================================
 *  钃濊壊绉戞妧椋炶埞锛屽叓鏂瑰悜绉诲姩锛孲hift鍐插埡锛岃嚜鍔ㄦ敾鍑? *  鏀寔锛氬熬鐒扮矑瀛愩€佺Щ鍔ㄦ畫褰便€佸啿鍒烘畫褰? *  鎶€鑳界郴缁熼€氳繃淇敼 Player 灞炴€у疄鐜版晥鏋? * ============================================================
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

        // 鎶€鑳藉睘鎬?        this._spreadAngle = null;
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
        const k = key.toLowerCase();
        if (k in this.keys) this.keys[k] = true;
        if (k === 'shift') { this.keys.shift = true; this.tryDash(); }
    }

    onKeyUp(key) {
        const k = key.toLowerCase();
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
            this.hp += Config.PLAYER.levelHpBonus;
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
        // 杩囩儹锛氬嚮鏉€瑙﹀彂
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

        // 杩囩儹璁℃椂
        if (this._overheat && this._overheatStacks > 0) {
            this._overheatTimer -= deltaTime;
            if (this._overheatTimer <= 0) this._overheatStacks = 0;
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

        // 鍙屾寔澶氭柟鍚?        const directions = this._dualWieldDirections || 1;
        const dirSpan = (directions - 1) * 0.4;
        const dirStart = -dirSpan / 2;

        for (let d = 0; d < directions; d++) {
            const dirOff = directions > 1 ? dirStart + d * 0.4 : 0;
            for (let i = 0; i < bulletCount; i++) {
                let angle = Utils.angle(this.x, this.y, target.x, target.y) + dirOff;
                if (bulletCount > 1) {
                    angle += (i - (bulletCount - 1) / 2) * spreadAngle;
                }
                const isCrit = Math.random() < this.critRate;
                const damage = isCrit ? this.bulletDamage * this.critDamage : this.bulletDamage;
                const bullet = bulletManager.fire(this.x, this.y, angle, damage, this.bulletSpeed, this.pierce, target);
                if (bullet) bullet.isCrit = isCrit;
            }
        }

        if (this.audio) this.audio.shoot();
    }

    update(deltaTime, enemies, bulletManager, particleManager) {
        if (this.dashCooldown > 0) { this.dashCooldown -= deltaTime; if (this.dashCooldown < 0) this.dashCooldown = 0; }
        if (this.invincibleTimer > 0) this.invincibleTimer -= deltaTime;
        if (this.comboTimer > 0) { this.comboTimer -= deltaTime; if (this.comboTimer <= 0) this.combo = 0; }

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
                this.afterimageTimer -= deltaTime;
                if (this.afterimageTimer <= 0) {
                    this.afterimageTimer = 0.08;
                    particleManager.spawnAfterimage(this.x, this.y, this.size * 0.8, this.glowColor);
                }
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
        // 鎶€鑳藉睘鎬ч噸缃?        this._spreadAngle = null;
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
