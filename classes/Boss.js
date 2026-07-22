/**
 * ============================================================
 *  Boss.js - Boss 鏁屼汉
 * ============================================================
 *  姣?0绉掑嚭鐜扮殑寮哄姏Boss
 *  鎶€鑳斤細鍐叉挒銆佽寖鍥碅OE鏀诲嚮
 *  鐗规晥锛氱孩鑹插厜鍦堛€佽鍛婃枃瀛椼€侀渿灞?
 *  TODO: 鍙互鍔犲叆鏇村Boss绫诲瀷锛屾瘡绉嶆湁鐙壒鎶€鑳?
 *  TODO: 鍙互鍔犲叆Boss闃舵杞崲锛堣閲忓埌闃堝€煎垏鎹㈡ā寮忥級
 *  TODO: 鍙互鍔犲叆鍙敜灏忔€妧鑳?
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

        // 鍐叉挒鎶€鑳?
        this.chargeSpeed = 6;
        this.chargeCooldown = 5;
        this.chargeTimer = 5;
        this.isCharging = false;
        this.chargeDuration = 0.8;
        this.chargeCurrentDuration = 0;
        this.chargeDirection = { x: 0, y: 0 };
        this.chargeWindup = 1; // 鍐叉挒鍓嶆憞
        this.chargeWindupTimer = 0;
        this.isWindup = false;

        // 鑼冨洿鏀诲嚮
        this.aoeRadius = 150;
        this.aoeDamage = 30;
        this.aoeCooldown = 8;
        this.aoeTimer = 8;
        this.isAoeWarning = false;
        this.aoeWarningDuration = 1.5;
        this.aoeWarningTimer = 0;
        this.aoeX = 0;
        this.aoeY = 0;

        // 鍙楀嚮闂儊
        this.hitFlash = 0;

        // 鍑虹幇璀﹀憡
        this.spawnWarning = true;
        this.spawnWarningTimer = 2;

        // 闅惧害缂╂斁
        this.hpMultiplier = 1;

        // 闊抽寮曠敤
        this.audio = null;
    }

    /**
     * 鍒濆鍖朆oss
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
     * 鍙楀埌浼ゅ
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
     * 姝讳骸
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
     * 寮€濮嬪啿鎾炲墠鎽?
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
     * 鎵ц鍐叉挒
     */
    executeCharge() {
        this.isWindup = false;
        this.isCharging = true;
        this.chargeCurrentDuration = this.chargeDuration;
        if (this.audio) this.audio.bossCharge();
    }

    /**
     * 寮€濮婣OE璀﹀憡
     */
    startAoe(player) {
        this.isAoeWarning = true;
        this.aoeWarningTimer = this.aoeWarningDuration;
        this.aoeX = player.x;
        this.aoeY = player.y;
    }

    /**
     * 鎵цAOE
     */
    executeAoe(particleManager, player, game) {
        this.isAoeWarning = false;

        particleManager.spawnExplosion(this.aoeX, this.aoeY, '#ff6b6b', 40);

        if (game) {
            game.screenShake = Math.max(game.screenShake, 10);
        }

        if (this.audio) this.audio.bossAOE();

        // 鑼冨洿浼ゅ
        const dist = Utils.distance(this.aoeX, this.aoeY, player.x, player.y);
        if (dist < this.aoeRadius + player.size) {
            player.takeDamage(this.aoeDamage);
        }

        // TODO: playSound('aoe')
    }

    /**
     * 鏇存柊Boss
     */
    update(deltaTime, player, particleManager, game) {
        if (!this.active) return;

        // 鍑虹幇璀﹀憡
        if (this.spawnWarning) {
            this.spawnWarningTimer -= deltaTime;
            if (this.spawnWarningTimer <= 0) {
                this.spawnWarning = false;
            }
            return; // 璀﹀憡鏈熼棿涓嶇Щ鍔?
        }

        // 鍙楀嚮闂儊
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }

        // 鍐叉挒鍓嶆憞
        if (this.isWindup) {
            this.chargeWindupTimer -= deltaTime;
            // 鍓嶆憞鏈熼棿缂撴參璺熼殢
            const angle = Utils.angle(this.x, this.y, player.x, player.y);
            this.x += Math.cos(angle) * this.speed * 0.3 * deltaTime * 60;
            this.y += Math.sin(angle) * this.speed * 0.3 * deltaTime * 60;

            if (this.chargeWindupTimer <= 0) {
                this.executeCharge();
            }
            return;
        }

        // 鍐叉挒涓?
        if (this.isCharging) {
            this.chargeCurrentDuration -= deltaTime;
            this.x += this.chargeDirection.x * this.chargeSpeed * deltaTime * 60;
            this.y += this.chargeDirection.y * this.chargeSpeed * deltaTime * 60;

            // 鍐叉挒鎺ヨЕ浼ゅ
            if (Utils.circleCollision(this.x, this.y, this.size, player.x, player.y, player.size)) {
                player.takeDamage(this.damage * 1.5);
            }

            // 鍐插埡娈嬪奖
            if (Math.random() < 0.5) {
                particleManager.spawnAfterimage(this.x, this.y, this.size, this.color);
            }

            if (this.chargeCurrentDuration <= 0) {
                this.isCharging = false;
                this.chargeTimer = this.chargeCooldown;
            }
            return;
        }

        // AOE璀﹀憡涓?
        if (this.isAoeWarning) {
            this.aoeWarningTimer -= deltaTime;
            if (this.aoeWarningTimer <= 0) {
                this.executeAoe(particleManager, player, game);
            }
            // 璀﹀憡鏈熼棿姝ｅ父绉诲姩浣嗗噺閫?
            const angle = Utils.angle(this.x, this.y, player.x, player.y);
            this.x += Math.cos(angle) * this.speed * 0.5 * deltaTime * 60;
            this.y += Math.sin(angle) * this.speed * 0.5 * deltaTime * 60;
            return;
        }

        // 鏅€氳拷韪Щ鍔?
        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        this.x += Math.cos(angle) * this.speed * deltaTime * 60;
        this.y += Math.sin(angle) * this.speed * deltaTime * 60;

        // 鎺ヨЕ浼ゅ
        if (Utils.circleCollision(this.x, this.y, this.size, player.x, player.y, player.size)) {
            player.takeDamage(this.damage * deltaTime * 2);
        }

        // 鎶€鑳藉喎鍗?
        this.chargeTimer -= deltaTime;
        this.aoeTimer -= deltaTime;

        // 閲婃斁鎶€鑳?
        if (this.chargeTimer <= 0) {
            this.startCharge(player);
        } else if (this.aoeTimer <= 0) {
            this.startAoe(player);
        }
    }

    /**
     * 缁樺埗Boss
     */

        ctx.save();

        // 绾㈣壊鍏夊湀锛堣剦鍔級
        const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.1;
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.glowColor;

        // 鍙楀嚮闂櫧
        let fillColor = this.color;
        if (this.hitFlash > 0) {
            fillColor = '#ffffff';
        }

        // Boss涓讳綋 - 澶嶆潅澶氳竟褰?
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

        // 鍐呴儴鏍稿績
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 鐪肩潧
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

        // 鍐叉挒鍓嶆憞璀﹀憡鏁堟灉
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

        // AOE璀﹀憡鍦?
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

            // 鍐呴儴濉厖
            ctx.fillStyle = `rgba(255, 100, 100, ${0.1 + warningProgress * 0.2})`;
            ctx.fill();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    /**
     * 缁樺埗Boss琛€鏉★紙椤堕儴涓撶敤锛?
     */
    drawHealthBar(ctx, canvasWidth) {
        if (!this.active || this.spawnWarning) return;

        const barWidth = canvasWidth * 0.6;
        const barHeight = 12;
        const barX = (canvasWidth - barWidth) / 2;
        const barY = 20;

        ctx.save();

        // 鑳屾櫙
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

        // 琛€鏉¤儗鏅?
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 琛€閲?
        const hpPercent = this.hp / this.maxHp;
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        gradient.addColorStop(0, '#ff4757');
        gradient.addColorStop(1, '#ff6b81');
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // 杈规
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // 鏂囧瓧
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
