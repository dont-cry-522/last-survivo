/** Touch controls are separate from keyboard state and reuse the existing game actions. */
class MobileControls {
    constructor(game) {
        this.game = game;
        this.pointerId = null;
        this.previousState = null;
        this.enabled = matchMedia('(pointer: coarse)').matches;
        document.body.classList.toggle('touch-device', this.enabled);
        this.stick = document.getElementById('joystick');
        this.knob = document.getElementById('joystick-knob');
        this.action = document.getElementById('mobile-action');
        this.dash = document.getElementById('mobile-dash');
        this.mute = document.getElementById('mobile-mute');
        if (!this.enabled) return;

        this.stick.addEventListener('pointerdown', e => {
            if (this.pointerId !== null || game.state !== 'playing') return;
            e.preventDefault();
            this.pointerId = e.pointerId;
            this.stick.setPointerCapture(e.pointerId);
            this.move(e);
        });
        this.stick.addEventListener('pointermove', e => {
            if (e.pointerId === this.pointerId) this.move(e);
        });
        for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
            this.stick.addEventListener(event, e => {
                if (e.pointerId === this.pointerId) this.release();
            });
        }
        this.dash.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (game.state === 'playing') game.player.tryDash();
        });
        this.action.addEventListener('click', () => {
            this.release();
            if (game.state === 'start') game.startGame();
            else if (game.state === 'gameover') game.restart();
            else game.togglePause();
            this.update();
        });
        document.getElementById('mobile-restart').addEventListener('click', () => {
            this.release();
            game.audio.init();
            game.restart();
            this.update();
        });
        this.mute.addEventListener('click', () => {
            game.audio.init();
            game.audio.toggleMute();
            this.update();
        });
        const suspend = () => {
            this.release();
            if (game.state === 'playing') game.togglePause();
        };
        window.addEventListener('blur', suspend);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) suspend();
        });
        window.addEventListener('resize', () => this.release());
        this.upgrades = document.createElement('section');
        this.upgrades.id = 'mobile-upgrades';
        this.upgrades.hidden = true;
        this.upgrades.setAttribute('aria-label', '选择升级技能');
        document.getElementById('mobile-controls').append(this.upgrades);
        this.update();
    }

    showUpgrades() {
        const game = this.game;
        this.upgrades.replaceChildren();
        const heading = document.createElement('h2');
        heading.textContent = '选择一项升级';
        this.upgrades.append(heading);
        const list = document.createElement('div');
        list.className = 'mobile-skill-list';
        game.skillUI.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'mobile-skill';
            button.style.borderColor = SkillRarity.getColor(choice.config.rarity);
            const name = document.createElement('strong');
            name.textContent = choice.config.name;
            const rarity = document.createElement('small');
            rarity.textContent = SkillRarity.getName(choice.config.rarity) + (choice.isEvolution && choice.evolution ? ` · 进化 T${choice.evolution.tier}` : '');
            const description = document.createElement('span');
            description.textContent = choice.isEvolution && choice.evolution ? choice.evolution.desc : choice.config.description;
            button.append(name, rarity, description);
            button.addEventListener('click', () => {
                if (game.state !== 'upgrading') return;
                game.onKeyDown(String(index + 1));
                this.update();
            });
            list.append(button);
        });
        this.upgrades.append(list);
        const reroll = document.createElement('button');
        reroll.type = 'button';
        reroll.textContent = `刷新选项（剩余 ${game.skillManager.rerollsRemaining} 次）`;
        reroll.disabled = game.skillManager.rerollsRemaining <= 0;
        reroll.addEventListener('click', () => {
            if (game.state !== 'upgrading') return;
            const choices = game.skillManager.reroll();
            if (choices) { game.skillUI.open(choices); this.showUpgrades(); }
        });
        this.upgrades.append(reroll);
    }

    move(e) {
        if (this.game.state !== 'playing') return this.release();
        const rect = this.stick.getBoundingClientRect();
        let x = e.clientX - rect.left - rect.width / 2;
        let y = e.clientY - rect.top - rect.height / 2;
        const distance = Math.hypot(x, y);
        if (distance > 32) { x *= 32 / distance; y *= 32 / distance; }
        this.knob.style.transform = `translate(${x}px, ${y}px)`;
        this.game.player.touchKeys = { w: y < -10, s: y > 10, a: x < -10, d: x > 10 };
    }

    release() {
        const id = this.pointerId;
        this.pointerId = null;
        if (id !== null && this.stick.hasPointerCapture(id)) this.stick.releasePointerCapture(id);
        this.game.player.touchKeys = {};
        this.knob.style.transform = '';
    }

    update() {
        if (!this.enabled) return;
        const state = this.game.state;
        if (state !== this.previousState) {
            this.release();
            this.previousState = state;
            this.action.textContent = { start: '开始游戏', playing: '暂停', paused: '继续游戏', upgrading: '点击卡片升级', gameover: '重新开始' }[state];
            this.action.disabled = state === 'upgrading';
            this.upgrades.hidden = state !== 'upgrading';
            if (state === 'upgrading') this.showUpgrades();
        }
        this.dash.disabled = state !== 'playing';
        const remaining = this.game.player.dashCooldown;
        this.dash.textContent = remaining > 0 && state === 'playing' ? `${remaining.toFixed(1)}秒` : '冲刺';
        const muted = this.game.audio.isMuted();
        this.mute.textContent = muted ? '开启声音' : '静音';
        this.mute.setAttribute('aria-pressed', String(Boolean(muted)));
    }
}


