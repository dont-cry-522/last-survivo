/**
 * ============================================================
 *  Upgrade.js - 升级系统
 * ============================================================
 *  经验满自动升级，弹出三选一升级面板
 *  支持稀有度：普通/稀有/史诗
 *  升级时暂停游戏
 *  TODO: 可以加入升级历史记录
 *  TODO: 可以加入稀有度保底机制
 *  TODO: 可以加入超稀有升级（传说级）
 * ============================================================
 */

class UpgradeManager {
    constructor() {
        this.isUpgrading = false;
        this.currentOptions = [];
        this.player = null;

        // 动画
        this.panelAlpha = 0;
        this.panelScale = 0.8;
        this.animationSpeed = 0.15;

        // 选中索引（键盘操作）
        this.selectedIndex = 0;
    }

    /**
     * 触发升级
     */
    triggerUpgrade(player) {
        this.player = player;
        this.isUpgrading = true;
        this.panelAlpha = 0;
        this.panelScale = 0.8;
        this.selectedIndex = 0;
        this.generateOptions();
        player.upgradeCount++;
        if (player.audio) player.audio.levelUp();
    }

    /**
     * 生成三个随机升级选项
     */
    generateOptions() {
        const allUpgrades = Config.UPGRADES;
        this.currentOptions = [];

        // 按稀有度加权抽取
        // 简单做法：随机选3个不重复的
        const shuffled = [...allUpgrades].sort(() => Math.random() - 0.5);

        for (let i = 0; i < Math.min(3, shuffled.length); i++) {
            this.currentOptions.push({
                ...shuffled[i],
                // 为每个选项生成唯一key用于动画
                key: Date.now() + i,
            });
        }
    }

    /**
     * 选择一个升级
     */
    selectUpgrade(index) {
        if (!this.isUpgrading) return;
        if (index < 0 || index >= this.currentOptions.length) return;

        const upgrade = this.currentOptions[index];
        if (upgrade && upgrade.apply && this.player) {
            upgrade.apply(this.player);
        }

        if (this.player && this.player.audio) this.player.audio.uiClick();
        this.closePanel();
    }

    /**
     * 关闭升级面板
     */
    closePanel() {
        this.isUpgrading = false;
        this.currentOptions = [];
    }

    /**
     * 键盘导航
     */
    handleKey(key) {
        if (!this.isUpgrading) return;

        switch (key.toLowerCase()) {
            case 'arrowleft':
            case 'a':
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                break;
            case 'arrowright':
            case 'd':
                this.selectedIndex = Math.min(this.currentOptions.length - 1, this.selectedIndex + 1);
                break;
            case 'enter':
            case ' ':
                this.selectUpgrade(this.selectedIndex);
                break;
            case '1':
                this.selectUpgrade(0);
                break;
            case '2':
                this.selectUpgrade(1);
                break;
            case '3':
                this.selectUpgrade(2);
                break;
        }
    }

    /**
     * 鼠标点击选择
     */
    handleClick(mouseX, mouseY, canvasWidth, canvasHeight) {
        if (!this.isUpgrading) return false;

        const cardWidth = 200;
        const cardHeight = 250;
        const gap = 30;
        const totalWidth = cardWidth * 3 + gap * 2;
        const startX = (canvasWidth - totalWidth) / 2;
        const startY = (canvasHeight - cardHeight) / 2;

        for (let i = 0; i < this.currentOptions.length; i++) {
            const cardX = startX + i * (cardWidth + gap);
            const cardY = startY;

            if (mouseX >= cardX && mouseX <= cardX + cardWidth &&
                mouseY >= cardY && mouseY <= cardY + cardHeight) {
                this.selectUpgrade(i);
                return true;
            }
        }
        return false;
    }

    /**
     * 更新动画
     */
    update(deltaTime) {
        if (this.isUpgrading) {
            // 淡入 + 缩放
            this.panelAlpha = Math.min(1, this.panelAlpha + this.animationSpeed * deltaTime * 60);
            this.panelScale = Utils.lerp(this.panelScale, 1, 0.1 * deltaTime * 60);
        }
    }

    /**
     * 获取稀有度颜色
     */
    getRarityColor(rarity) {
        switch (rarity) {
            case 'rare': return '#a855f7';
            case 'uncommon': return '#3b82f6';
            case 'common':
            default: return '#9ca3af';
        }
    }

    /**
     * 获取稀有度名称
     */
    getRarityName(rarity) {
        switch (rarity) {
            case 'rare': return '稀有';
            case 'uncommon': return '优秀';
            case 'common':
            default: return '普通';
        }
    }

    /**
     * 绘制升级面板
     */
    draw(ctx, canvasWidth, canvasHeight) {
        if (!this.isUpgrading) return;

        ctx.save();
        ctx.globalAlpha = this.panelAlpha;

        // 半透明背景遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 标题
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
        ctx.fillText('等级提升!', canvasWidth / 2, canvasHeight / 2 - 160);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.fillText(`Lv.${this.player ? this.player.level : '?'}  选择一项强化`, canvasWidth / 2, canvasHeight / 2 - 120);

        // 三张升级卡片
        const cardWidth = 200;
        const cardHeight = 250;
        const gap = 30;
        const totalWidth = cardWidth * 3 + gap * 2;
        const startX = (canvasWidth - totalWidth) / 2;
        const startY = (canvasHeight - cardHeight) / 2;

        for (let i = 0; i < this.currentOptions.length; i++) {
            const upgrade = this.currentOptions[i];
            const cardX = startX + i * (cardWidth + gap);
            const cardY = startY;
            const isSelected = i === this.selectedIndex;

            // 缩放动画（选中的稍微放大）
            const scale = this.panelScale * (isSelected ? 1.05 : 1);
            const centerX = cardX + cardWidth / 2;
            const centerY = cardY + cardHeight / 2;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -centerY);

            // 卡片背景
            const rarityColor = this.getRarityColor(upgrade.rarity);

            // 外发光边框
            if (isSelected) {
                ctx.shadowBlur = 25;
                ctx.shadowColor = rarityColor;
            }

            ctx.fillStyle = 'rgba(20, 20, 40, 0.95)';
            ctx.strokeStyle = rarityColor;
            ctx.lineWidth = isSelected ? 3 : 2;
            this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 12);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 稀有度标签
            ctx.fillStyle = rarityColor;
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.getRarityName(upgrade.rarity), centerX, cardY + 25);

            // 图标
            ctx.font = '48px Arial';
            ctx.fillText(upgrade.icon || '⭐', centerX, cardY + 85);

            // 升级名称
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(upgrade.name, centerX, cardY + 130);

            // 描述
            ctx.fillStyle = '#a0aec0';
            ctx.font = '14px Arial';
            // 简单换行
            const desc = upgrade.desc;
            const maxWidth = cardWidth - 30;
            this.wrapText(ctx, desc, centerX, cardY + 160, maxWidth, 20);

            // 快捷键提示
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px Arial';
            ctx.fillText(`[${i + 1}] 选择`, centerX, cardY + cardHeight - 20);

            ctx.restore();
        }

        // 底部提示
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('使用 A/D 或 方向键 选择，Enter 确认，或直接点击', canvasWidth / 2, canvasHeight / 2 + 170);

        ctx.restore();
    }

    /**
     * 圆角矩形辅助
     */
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /**
     * 文字换行辅助
     */
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = words[i];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }
}

if (typeof window !== 'undefined') {
    window.UpgradeManager = UpgradeManager;
}
