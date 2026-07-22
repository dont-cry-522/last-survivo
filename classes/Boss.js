/**
 * ============================================================
 *  Boss.js - Boss 敌人
 * ============================================================
 *  每90秒出现的强力Boss
 *  技能：冲撞、范围AOE攻击
 *  特效：红色光圈、警告文字、震屏
 *  TODO: 可以加入更多Boss类型，每种有独特技能
 *  TODO: 可以加入Boss阶段转换（血量到阈值切换模式）
 *  TODO: 可以加入召唤小怪技能
 * ============================================================
 */

class Boss {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.maxHp = 2000;
        this.hp = 2000;
        this.speed = 1.2;
        this.damage = 40;
        this.size = 50;
        this.exp = 200;
        this.gold = 100;
        this.color = '#ee5253';
        this.glowColor = 'rgba(238, 82, 83, 0.8)';

        // 冲撞技能
        this.chargeSpeed = 6;
        this.chargeCooldown = 5;
        this.chargeTimer = 5;
        this.isCharging = false;
        this.chargeDuration = 0.8;
        this.chargeCurrentDuration = 0;
        this.chargeDirection = { x: 0, y: 0 };
        this.chargeWindup = 1; // 冲撞前摇
        this.chargeWindupTimer = 0;
        this.isWindup = false;

        // 范围攻击
        this.aoeRadius = 150;
        this.aoeDamage = 30;
        this.aoeCooldown = 8;
        this.aoeTimer = 8;
        this.isAoeWarning = false;
        this.aoeWarningDuration = 1.5;
        this.aoeWarningTimer = 0;
        this.aoeX = 0;
        this.aoeY = 0;

        // 受击闪烁
        this.hitFlash = 0;

        // 出现警告
        this.spawnWarning = true;
        this.spawnWarningTimer = 2;

        // 难度缩放
        this.hpMultiplier = 1;

        // 音频引用
        this.audio = null;
    }

    /**
     * 初始化Boss
     */
    init(x, y, hpMultiplier = 1) {
        const cfg = Config.BOSS;
        this.active = true;
        this.x = x;
        this.y = y;
        this.hpMultiplier = hpMultiplier;
        this.maxHp = cfg.hp * hpMultiplier;
        this.hp = this.maxHp;
        this.speed = cfg.speed;
        this.damage = cfg.damage;
        this.size = cfg.size;
        this.exp = cfg.exp;
        this.gold = cfg.gold;
        this.chargeSpeed = cfg.chargeSpeed;
        this.chargeCooldown = cfg.chargeCooldown;
        this.chargeTimer = cfg.chargeCooldown;
        this.aoeRadius = cfg.aoeRadius;
        this.aoeDamage = cfg.aoeDamage;
        this.aoeCooldown = cfg.aoeCooldown;
        this.aoeTimer = cfg.aoeCooldown;

        this.isCharging = false;
        this.isWindup = false;
        this.isAoeWarning = false;
        this.hitFlash = 0;
        this.spawnWarning = true;
        this.spawnWarningTimer = 2;
    }

    /**
     * 受到伤害
     */
    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlash = 0.1;

        if (this.hp <= 0) {
            this.hp = 0;
            return true;
        }
        return false;
    }

    /**
     * 死亡
     */
    die(particleManager, experienceManager, game) {
        this.active = false;

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (particleManager) {
                    particleManager.spawnExplosion(
                        this.x + Utils.random(-30, 30),
                        this.y + Utils.random(-30, 30),
                        this.color,
                        20
                    );
                }
            }, i * 100);
        }

        experienceManager.spawnOrb(this.x, this.y, this.exp, this.gold);

        if (game) {
            game.screenShake = 20;
        }
    }

    /**
     * 开始冲撞前摇
     */
    startCharge(player) {
        this.isWindup = true;
        this.chargeWindupTimer = this.chargeWindup;
        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        this.chargeDirection.x = Math.cos(angle);
        this.chargeDirection.y = Math.sin(angle);
        if (this.audio) this.audio.bossChargeWindup();
    }

    /**
     * 执行冲撞
     */
    executeCharge() {
        this.isWindup = false;
        this.isCharging = true;
        this.chargeCurrentDuration = this.chargeDuration;
        if (this.audio) this.audio.bossCharge();
    }

    /**
     * 开始AOE警告
     */
    startAoe(player) {
        this.isAoeWarning = true;
        this.aoeWarningTimer = this.aoeWarningDuration;
        this.aoeX = player.x;
        this.aoeY = player.y;
    }

    /**
     * 执行AOE
     */
    executeAoe(particleManager, player, game) {
        this.isAoeWarning = false;

        particleManager.spawnExplosion(this.aoeX, this.aoeY, '#ff6b6b', 40);

        if (game) {
            game.screenShake = Math.max(game.screenShake, 10);
        }

        if (this.audio) this.audio.bossAOE();

        // 范围伤害
        const dist = Utils.distance(this.aoeX, this.aoeY, player.x, player.y);
        if (dist < this.aoeRadius + player.size) {
            player.takeDamage(this.aoeDamage);
        }

        // TODO: playSound('aoe')
    }

    /**
     * 更新Boss
     */
    update(deltaTime, player, particleManager, game) {
        if (!this.active) return;

        // 出现警告
        if (this.spawnWarning) {
            this.spawnWarningTimer -= deltaTime;
            if (this.spawnWarningTimer <= 0) {
                this.spawnWarning = false;
            }
            return; // 警告期间不移动
        }

        // 受击闪烁
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }

        // 冲撞前摇
        if (this.isWindup) {
            this.chargeWindupTimer -= deltaTime;
            // 前摇期间缓慢跟随
            const angle = Utils.angle(this.x, this.y, player.x, player.y);
            this.x += Math.cos(angle) * this.speed * 0.3 * deltaTime * 60;
            this.y += Math.sin(angle) * this.speed * 0.3 * deltaTime * 60;

            if (this.chargeWindupTimer <= 0) {
                this.executeCharge();
            }
            return;
        }

        // 冲撞中
        if (this.isCharging) {
            this.chargeCurrentDuration -= deltaTime;
            this.x += this.chargeDirection.x * this.chargeSpeed * deltaTime * 60;
            this.y += this.chargeDirection.y * this.chargeSpeed * deltaTime * 60;

            // 冲撞接触伤害
            if (Utils.circleCollision(this.x, this.y, this.size, player.x, player.y, player.size)) {
                player.takeDamage(this.damage * 1.5);
            }

            // 冲刺残影
            if (Math.random() < 0.5) {
                particleManager.spawnAfterimage(this.x, this.y, this.size, this.color);
            }

            if (this.chargeCurrentDuration <= 0) {
                this.isCharging = false;
                this.chargeTimer = this.chargeCooldown;
            }
            return;
        }

        // AOE警告中
        if (this.isAoeWarning) {
            this.aoeWarningTimer -= deltaTime;
            if (this.aoeWarningTimer <= 0) {
                this.executeAoe(particleManager, player, game);
            }
            // 警告期间正常移动但减速
            const angle = Utils.angle(this.x, this.y, player.x, player.y);
            this.x += Math.cos(angle) * this.speed * 0.5 * deltaTime * 60;
            this.y += Math.sin(angle) * this.speed * 0.5 * deltaTime * 60;
            return;
        }

        // 普通追踪移动
        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        this.x += Math.cos(angle) * this.speed * deltaTime * 60;
        this.y += Math.sin(angle) * this.speed * deltaTime * 60;

        // 接触伤害
        if (Utils.circleCollision(this.x, this.y, this.size, player.x, player.y, player.size)) {
            player.takeDamage(this.damage * deltaTime * 2);
        }

        // 技能冷却
        this.chargeTimer -= deltaTime;
        this.aoeTimer -= deltaTime;

        // 释放技能
        if (this.chargeTimer <= 0) {
            this.startCharge(player);
        } else if (this.aoeTimer <= 0) {
            this.startAoe(player);
        }
    }

    /**
     * 绘制Boss
     */
    draw(ctx, cameraX, cameraY) {
        if (!this.active) return;

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        // 出现警告闪烁
        if (this.spawnWarning) {
            const alpha = 0.3 + Math.sin(Date.now() * 0.02) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 50;
            ctx.shadowColor = this.glowColor;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();

        // 红色光圈（脉动）
        const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.1;
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.glowColor;

        // 受击闪白
        let fillColor = this.color;
        if (this.hitFlash > 0) {
            fillColor = '#ffffff';
        }

        // Boss主体 - 复杂多边形
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
            const a = (i / points) * Math.PI * 2 + Date.now() * 0.0005;
            const r = i % 2 === 0 ? this.size * pulse : this.size * 0.7 * pulse;
            const px = screenX + Math.cos(a) * r;
            const py = screenY + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // 内部核心
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX - 10, screenY - 5, 6, 0, Math.PI * 2);
        ctx.arc(screenX + 10, screenY - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX - 10, screenY - 5, 3, 0, Math.PI * 2);
        ctx.arc(screenX + 10, screenY - 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // 冲撞前摇警告效果
        if (this.isWindup) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(
                screenX + this.chargeDirection.x * 500,
                screenY + this.chargeDirection.y * 500
            );
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();

        // AOE警告圈
        if (this.isAoeWarning) {
            const aoeScreenX = this.aoeX - cameraX;
            const aoeScreenY = this.aoeY - cameraY;
            const warningProgress = 1 - this.aoeWarningTimer / this.aoeWarningDuration;

            ctx.save();
            ctx.strokeStyle = `rgba(255, 100, 100, ${0.5 + warningProgress * 0.5})`;
            ctx.lineWidth = 3 + warningProgress * 3;
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.arc(aoeScreenX, aoeScreenY, this.aoeRadius * (0.5 + warningProgress * 0.5), 0, Math.PI * 2);
            ctx.stroke();

            // 内部填充
            ctx.fillStyle = `rgba(255, 100, 100, ${0.1 + warningProgress * 0.2})`;
            ctx.fill();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    /**
     * 绘制Boss血条（顶部专用）
     */
    drawHealthBar(ctx, canvasWidth) {
        if (!this.active || this.spawnWarning) return;

        const barWidth = canvasWidth * 0.6;
        const barHeight = 12;
        const barX = (canvasWidth - barWidth) / 2;
        const barY = 20;

        ctx.save();

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

        // 血条背景
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 血量
        const hpPercent = this.hp / this.maxHp;
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        gradient.addColorStop(0, '#ff4757');
        gradient.addColorStop(1, '#ff6b81');
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // 边框
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', canvasWidth / 2, barY + barHeight - 2);

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.Boss = Boss;
}
