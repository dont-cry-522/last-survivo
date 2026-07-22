/**
 * ============================================================
 *  RenderSystem.js - 渲染适配层
 * ============================================================
 *  桥接游戏逻辑 (x,y 2D) 和 Three.js 渲染引擎
 *  游戏实体 → 读取状态 → 同步到 Mesh → 调用 ThreeRenderer 渲染
 *
 *  不包含任何游戏逻辑。不修改任何游戏数据。
 * ============================================================
 */

class RenderSystem {
    constructor(canvas, width, height) {
        this.renderer = new ThreeRenderer(canvas, width, height);

        this._createMeshes();
    }

    // ================================================================
    //  Mesh 工厂 — 每个实体类型对应一种 3D 几何体
    // ================================================================

    _createMeshes() {
        const scene = this.renderer.getScene();

        this._createPlayerMesh(scene);
        this._createEnemyMeshes(scene);
        this._createBossMesh(scene);
        this._createBulletMeshes(scene);
        this._createExperienceMeshes(scene);
        this._createParticleMeshes(scene);
    }

    _createPlayerMesh(scene) {
        const group = new THREE.Group();
        const bodyGeo = new THREE.ConeGeometry(12, 30, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#00d4ff', emissive: '#004466', roughness: 0.3, metalness: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        body.position.z = 5;
        body.castShadow = true;

        const cockpitGeo = new THREE.SphereGeometry(5, 8, 8);
        const cockpitMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#aaddff', roughness: 0.2 });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.z = 12;

        const shieldGeo = new THREE.TorusGeometry(20, 1.5, 16, 32);
        const shieldMat = new THREE.MeshStandardMaterial({ color: '#66ccff', emissive: '#2266aa', roughness: 0.3, transparent: true, opacity: 0.6 });
        this.playerShield = new THREE.Mesh(shieldGeo, shieldMat);

        group.add(body, cockpit, this.playerShield);
        group.userData.meshes = [body, cockpit, this.playerShield];
        this.playerShield.visible = false;
        scene.add(group);
        this.playerGroup = group;
    }

    _createEnemyMeshes(scene) {
        const baseGeo = new THREE.SphereGeometry(14, 12, 12);
        const baseMat = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.2 });

        this.renderer.registerGroup('enemy', 500, () => {
            const mesh = new THREE.Mesh(baseGeo, baseMat.clone());
            mesh.castShadow = true;
            return mesh;
        });
    }

    _createBossMesh(scene) {
        const group = new THREE.Group();

        const coreGeo = new THREE.IcosahedronGeometry(45, 1);
        const coreMat = new THREE.MeshStandardMaterial({ color: '#ee5253', emissive: '#440000', roughness: 0.3, metalness: 0.5 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.castShadow = true;

        const eyeGeo = new THREE.SphereGeometry(8, 8, 8);
        const eyeMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', roughness: 0.1 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-12, 0, -6);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(12, 0, -6);

        const pupilGeo = new THREE.SphereGeometry(4, 8, 8);
        const pupilMat = new THREE.MeshStandardMaterial({ color: '#000000' });
        const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
        pupilL.position.set(-12, 0, -10);
        const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
        pupilR.position.set(12, 0, -10);

        group.add(core, eyeL, eyeR, pupilL, pupilR);
        group.visible = false;
        group.userData = {
            core, eyeL, eyeR, pupilL, pupilR,
            all: [core, eyeL, eyeR, pupilL, pupilR],
        };
        this.bossGroup = group;
        scene.add(group);

        const hpBarGeo = new THREE.PlaneGeometry(500, 10);
        const hpBarMat = new THREE.MeshBasicMaterial({ color: '#ff4757', side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        this.bossHpBar = new THREE.Mesh(hpBarGeo, hpBarMat);
        this.bossHpBar.visible = false;
        scene.add(this.bossHpBar);
    }

    _createBulletMeshes(scene) {
        const geo = new THREE.CapsuleGeometry(2.5, 6, 4, 8);
        const mat = new THREE.MeshStandardMaterial({ color: '#00ffff', emissive: '#00aaaa', roughness: 0.2 });
        this.renderer.registerGroup('bullet', 200, () => new THREE.Mesh(geo, mat.clone()));
    }

    _createExperienceMeshes(scene) {
        const geo = new THREE.SphereGeometry(5, 8, 8);
        const mat = new THREE.MeshStandardMaterial({ color: '#7bed9f', emissive: '#1a4a2a', roughness: 0.3 });
        this.renderer.registerGroup('exp', 300, () => new THREE.Mesh(geo, mat.clone()));
    }

    _createParticleMeshes(scene) {
        const geo = new THREE.SphereGeometry(2.5, 4, 4);
        const mat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
        this.renderer.registerGroup('particle', 500, () => new THREE.Mesh(geo, mat.clone()));
    }

    // ================================================================
    //  同步 — 每帧从游戏对象读取状态，更新 Mesh
    // ================================================================

    syncFromGame(game) {
        this._syncPlayer(game.player);
        this._syncEnemies(game.enemyManager);
        this._syncBoss(game.boss);
        this._syncBullets(game.bulletManager);
        this._syncExperience(game.experienceManager);
        this._syncParticles(game.particleManager);
        this._syncCamera(game);
    }

    _syncPlayer(player) {
        const g = this.playerGroup;
        g.position.set(player.x, 0, player.y);
        g.rotation.set(0, 0, player.angle + Math.PI / 2);

        if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 20) % 2 === 0) {
            g.children.forEach(c => { if (c.material && c.material.opacity !== undefined) c.material.opacity = 0.4; });
        } else {
            g.children.forEach(c => { if (c.material && c.material.opacity !== undefined) c.material.opacity = 1; });
        }

        this.playerShield.visible = player.shield > 0;
    }

    _syncEnemies(enemyManager) {
        for (let i = 0; i < enemyManager.pool.length; i++) {
            const e = enemyManager.pool[i];
            if (e.active) {
                this.renderer.setMesh('enemy', i, e.x, e.y, 0, e.size / 14, true);
                const mesh = this.renderer.meshGroups['enemy'].userData.pool[i];
                if (mesh) {
                    const col = e.hitFlash > 0 ? '#ffffff' : e.color;
                    mesh.material.color.set(col);
                    mesh.material.emissive.set(col);
                    mesh.material.emissiveIntensity = 0.3;
                }
            } else {
                this.renderer.setMesh('enemy', i, 0, 0, 0, 1, false);
            }
        }
    }

    _syncBoss(boss) {
        this.bossGroup.visible = boss.active && !boss.spawnWarning;
        if (boss.active) {
            const scale = boss.size / 45;
            this.bossGroup.position.set(boss.x, 0, boss.y);
            this.bossGroup.rotation.y += 0.01;
            this.bossGroup.scale.setScalar(scale);

            if (boss.spawnWarning) {
                this.bossGroup.position.set(boss.x, 0, boss.y);
                this.bossGroup.scale.setScalar(scale * (0.5 + Math.sin(Date.now() * 0.02) * 0.5));
            }

            this.bossHpBar.visible = true;
            const hpPct = boss.hp / boss.maxHp;
            this.bossHpBar.position.set(boss.x, 2, boss.y - 80);
            this.bossHpBar.scale.x = hpPct;
            this.bossHpBar.material.color.set(hpPct > 0.5 ? '#ff4757' : hpPct > 0.25 ? '#ffaa00' : '#ff0000');
        } else {
            this.bossGroup.position.set(0, -100, 0);
            this.bossHpBar.visible = false;
        }
    }

    _syncBullets(bulletManager) {
        for (let i = 0; i < bulletManager.pool.length; i++) {
            const b = bulletManager.pool[i];
            if (b.active) {
                const angle = Math.atan2(b.vy, b.vx);
                this.renderer.setMesh('bullet', i, b.x, b.y, angle, b.size / 5, true);
            } else {
                this.renderer.setMesh('bullet', i, 0, 0, 0, 1, false);
            }
        }
    }

    _syncExperience(experienceManager) {
        for (let i = 0; i < experienceManager.pool.length; i++) {
            const orb = experienceManager.pool[i];
            if (orb.active) {
                this.renderer.setMesh('exp', i, orb.x, orb.y, 0, orb.size / 5, true);
            } else {
                this.renderer.setMesh('exp', i, 0, 0, 0, 1, false);
            }
        }
    }

    _syncParticles(particleManager) {
        for (let i = 0; i < particleManager.pool.length; i++) {
            const p = particleManager.pool[i];
            if (p.active) {
                this.renderer.setMesh('particle', i, p.x, p.y, 0, p.size * p.alpha, true);
                const mesh = this.renderer.meshGroups['particle'].userData.pool[i];
                if (mesh && p.color) {
                    mesh.material.color.set(p.color);
                    mesh.material.opacity = p.alpha;
                }
            } else {
                this.renderer.setMesh('particle', i, 0, 0, 0, 1, false);
            }
        }
    }

    _syncCamera(game) {
        const shakeX = game.screenShake > 0 ? (Math.random() - 0.5) * game.screenShake * 1.5 : 0;
        const shakeZ = game.screenShake > 0 ? (Math.random() - 0.5) * game.screenShake * 1.5 : 0;
        this.renderer.updateCamera(
            game.cameraX + game.canvas.width / 2,
            game.cameraY + game.canvas.height / 2,
            shakeX, shakeZ
        );
    }

    // ================================================================
    //  渲染入口
    // ================================================================

    update(deltaTime) { this.renderer.render(deltaTime); }

    resize(w, h) {
        this.renderer.width = w;
        this.renderer.height = h;
        this.renderer.renderer.setSize(w, h);
        const aspect = w / h;
        const vs = 900;
        this.renderer.camera.left = -vs * aspect / 2;
        this.renderer.camera.right = vs * aspect / 2;
        this.renderer.camera.top = vs / 2;
        this.renderer.camera.bottom = -vs / 2;
        this.renderer.camera.updateProjectionMatrix();
    }

    getScene() { return this.renderer.getScene(); }
}

if (typeof window !== 'undefined') { window.RenderSystem = RenderSystem; }
