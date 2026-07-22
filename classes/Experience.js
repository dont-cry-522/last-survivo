/**
 * ============================================================
 *  Experience.js - 缁忛獙鐞冪郴缁?
 * ============================================================
 *  鏁屼汉姝讳骸鎺夎惤缁忛獙鐞冿紝鐜╁闈犺繎鑷姩鍚稿彇
 *  鏀寔纾侀搧鏁堟灉锛堝崌绾у悗鎵╁ぇ鍚稿彇鑼冨洿锛?
 *  浣跨敤瀵硅薄姹犱紭鍖栨€ц兘
 *  TODO: 鍙互鍔犲叆涓嶅悓鍝佽川鐨勭粡楠岀悆锛堢豢/钃?绱?閲戯級
 *  TODO: 鍙互鍔犲叆閲戝竵鐙珛鎺夎惤
 *  TODO: 鍙互鍔犲叆鍚稿紩绮掑瓙鐗规晥
 * ============================================================
 */

class ExperienceOrb {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.exp = 5;
        this.gold = 0;
        this.size = 6;
        this.color = Config.COLORS.expOrb;
        this.glowColor = Config.COLORS.expGlow;

        // 琚惛寮曠姸鎬?
        this.isAttracting = false;
        this.attractSpeed = 8;

        // 鎺夎惤寮硅烦
        this.vx = 0;
        this.vy = 0;
        this.bounceDecay = 0.9;
        this.isBouncing = false;

        // 鑴夊姩鍔ㄧ敾
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    /**
     * 鍒濆鍖栫粡楠岀悆
     */
    init(x, y, exp, gold = 0) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.exp = exp;
        this.gold = gold;
        this.isAttracting = false;
        this.isBouncing = true;

        // 闅忔満寮硅烦鏂瑰悜
        const angle = Math.random() * Math.PI * 2;
        const speed = Utils.random(1, 3);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // 鏍规嵁缁忛獙鍊艰皟鏁村ぇ灏?
        this.size = 5 + Math.min(exp / 10, 8);
    }

    /**
     * 鏇存柊
     */
    update(deltaTime, player, particleManager) {
        if (!this.active) return;

        // 寮硅烦琛板噺
        if (this.isBouncing) {
            this.vx *= this.bounceDecay;
            this.vy *= this.bounceDecay;
            this.x += this.vx;
            this.y += this.vy;

            if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
                this.isBouncing = false;
            }
        }

        // 纾侀搧妫€娴?
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        if (dist < player.magnetRange) {
            this.isAttracting = true;
        }

        // 琚惛寮曞悜鐜╁
        if (this.isAttracting) {
            const angle = Utils.angle(this.x, this.y, player.x, player.y);
            // 瓒婅繎瓒婂揩
            const speedMultiplier = Utils.clamp(1 + (player.magnetRange - dist) / player.magnetRange, 1, 3);
            this.x += Math.cos(angle) * this.attractSpeed * speedMultiplier * deltaTime * 60;
            this.y += Math.sin(angle) * this.attractSpeed * speedMultiplier * deltaTime * 60;

            // 鍚稿紩绮掑瓙杞ㄨ抗
            if (Math.random() < 0.3) {
                particleManager.spawnExpPickup(this.x, this.y, this.color);
            }
        }

        // 琚帺瀹舵嬀鍙?
        if (dist < player.size + this.size) {
            this.pickup(player);
            return true; // 鏍囪闇€瑕佺Щ闄?
        }

        return false;
    }

    /**
     * 琚嬀鍙?
     */
    pickup(player) {
        this.active = false;
        player.addExp(this.exp);
        if (this.gold > 0) {
            player.addGold(this.gold);
        }
        if (player.audio) player.audio.pickup();
    }

    /**
     * 缁樺埗
     */
}

/**
 * 缁忛獙鐞冪鐞嗗櫒
 */
class ExperienceManager extends ObjectPool {
    constructor(maxOrbs = 300) {
        super(() => new ExperienceOrb(), maxOrbs);
    }

    /**
     * 鐢熸垚缁忛獙鐞?
     */
    spawnOrb(x, y, exp, gold = 0) {
        const orb = this.acquire();
        if (orb) {
            orb.init(x, y, exp, gold);
        }
        return orb;
    }

    /**
     * 鏇存柊鎵€鏈夌粡楠岀悆
     * @returns {boolean} 鏄惁鏈夊崌绾?
     */
    update(deltaTime, player, particleManager) {
        let leveledUp = false;
        for (let i = 0; i < this.pool.length; i++) {
            const orb = this.pool[i];
            if (!orb.active) continue;

            const picked = orb.update(deltaTime, player, particleManager);
            if (picked) {
                if (player.exp >= player.expToNext) {
                    leveledUp = true;
                }
            }
        }
        return leveledUp;
    }

    }
}

if (typeof window !== 'undefined') {
    window.ExperienceOrb = ExperienceOrb;
    window.ExperienceManager = ExperienceManager;
}
