const fs = require('fs');
const path = 'E:/game/last-survivor/skills';
const bs = fs.readFileSync(path + '/BulletStorm.js', 'utf8');

let f = bs;

// Turrets draw
f = f.replace(
    /(sm\.registerHandler\(SkillEffectType\.SUMMON, 'rotary_turret'.+\}\s*\}\);)/s,
    "$1\n                sm.registerDraw(\"turrets\", function(ctx,cx,cy,p) {\n                    const turrets = sm.runtimeState._turrets; if(!turrets)return;\n                    for(const t of turrets) {\n                        const tx = p.x+Math.cos(t.angle)*t.orbitR-cx, ty = p.y+Math.sin(t.angle)*t.orbitR-cy;\n                        ctx.save(); ctx.fillStyle=\"#00aacc\"; ctx.shadowBlur=8; ctx.shadowColor=\"#00ddff\";\n                        ctx.beginPath(); ctx.arc(tx,ty,7,0,Math.PI*2); ctx.fill();\n                        ctx.fillStyle=\"#ffffff\"; ctx.beginPath(); ctx.arc(tx,ty,3,0,Math.PI*2); ctx.fill();\n                        ctx.restore();\n                    }\n                });"
);

// Mines draw
f = f.replace(
    /(apply: function\(player, sm, params, prevParams\) \{\s*\n\s*sm\.registerHandler\(SkillEffectType\.PERIODIC, 'terminator_barrage')/,
    "apply: function(player, sm, params, prevParams) {\n                sm.registerDraw(\"mines\", function(ctx,cx,cy,p) {\n                    const mines = sm.runtimeState._mines?.mines; if(!mines)return;\n                    for(const m of mines) {\n                        const mx=m.x-cx, my=m.y-cy, alpha=m.armed?0.8:0.3;\n                        ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=m.armed?\"#ff4400\":\"#ffaa00\";\n                        ctx.shadowBlur=m.armed?8:3;ctx.shadowColor=\"#ff4400\";\n                        ctx.beginPath();ctx.arc(mx,my,6,0,Math.PI*2);ctx.fill();\n                        if(m.armed){ctx.fillStyle=\"#ffffff\";ctx.beginPath();ctx.arc(mx,my,2,0,Math.PI*2);ctx.fill();}\n                        ctx.restore();\n                    }\n                });\n                sm.registerHandler(SkillEffectType.PERIODIC, 'terminator_barrage'"
);

fs.writeFileSync(path + '/BulletStorm.js', f, 'utf8');
console.log('BulletStorm done');

// Inferno - supernova
let fi = fs.readFileSync(path + '/Inferno.js', 'utf8');
fi = fi.replace(
    /(apply: function\(player, sm, params, prevParams\) \{\s*\n\s*_ensureBurnProcessor\(sm\);\s*\n\s*sm\.registerHandler\(SkillEffectType\.PERIODIC, 'supernova')/,
    "apply: function(player, sm, params, prevParams) {\n                _ensureBurnProcessor(sm);\n                sm.registerDraw(\"supernova\", function(ctx,cx,cy,p) {\n                    const st=sm.runtimeState._supernova; if(!st||st.timer>2||st.timer<=0)return;\n                    const snap=(2-st.timer)/2;\n                    ctx.save();ctx.globalAlpha=snap*0.6;ctx.strokeStyle=\"#ff4400\";ctx.lineWidth=6;\n                    ctx.shadowBlur=20;ctx.shadowColor=\"#ff2200\";\n                    ctx.beginPath();ctx.arc(p.x-cx,p.y-cy,600*(1-snap),0,Math.PI*2);ctx.stroke();ctx.restore();\n                });\n                sm.registerHandler(SkillEffectType.PERIODIC, 'supernova'"
);
fs.writeFileSync(path + '/Inferno.js', fi, 'utf8');
console.log('Inferno done');

// Storm - cloud
let fs2 = fs.readFileSync(path + '/Storm.js', 'utf8');
fs2 = fs2.replace(
    /(apply: function\(player, sm, params, prevParams\) \{\s*\n\s*_ensureBurnProcessor\(sm\);\s*\n\s*sm\.registerHandler\(SkillEffectType\.PERIODIC, 'storm_cloud')/,
    "apply: function(player, sm, params, prevParams) {\n                _ensureBurnProcessor(sm);\n                sm.registerDraw(\"stormCloud\", function(ctx,cx,cy,p) {\n                    const sc=sm.runtimeState._stormCloud; if(!sc)return;\n                    const x=p.x-cx, y=p.y-cy-40;\n                    ctx.save();ctx.globalAlpha=0.7;ctx.fillStyle=\"#667799\";\n                    ctx.beginPath();ctx.arc(x-12,y+4,14,0,Math.PI*2);ctx.fill();\n                    ctx.beginPath();ctx.arc(x+14,y+2,16,0,Math.PI*2);ctx.fill();\n                    ctx.beginPath();ctx.arc(x+2,y-4,18,0,Math.PI*2);ctx.fill();\n                    ctx.fillStyle=\"#8899bb\";ctx.beginPath();ctx.arc(x+26,y+8,12,0,Math.PI*2);ctx.fill();\n                    ctx.beginPath();ctx.arc(x-20,y+10,10,0,Math.PI*2);ctx.fill();\n                    if(Math.random()<0.2){ctx.strokeStyle=\"#ffff88\";ctx.lineWidth=2;\n                    ctx.beginPath();ctx.moveTo(x,y+18);ctx.lineTo(x+(Math.random()-0.5)*30,p.y-cy+(Math.random()*30));ctx.stroke();}\n                    ctx.restore();\n                });\n                sm.registerHandler(SkillEffectType.PERIODIC, 'storm_cloud'"
);
fs.writeFileSync(path + '/Storm.js', fs2, 'utf8');
console.log('Storm done');

// Bastion - phantoms
let fb = fs.readFileSync(path + '/Bastion.js', 'utf8');
fb = fb.replace(
    /(apply: function\(player, sm, params, prevParams\) \{\s*\n\s*_ensureBurnProcessor\(sm\);\s*\n\s*if \(!sm\.runtimeState\._phantoms\) sm\.runtimeState\._phantoms = \[\];\s*\n\s*sm\.registerHandler\(SkillEffectType\.ON_DASH, 'counter_stance')/,
    "apply: function(player, sm, params, prevParams) {\n                _ensureBurnProcessor(sm);\n                sm.registerDraw(\"phantoms\", function(ctx,cx,cy,p) {\n                    const ph=sm.runtimeState._phantoms; if(!ph)return;\n                    for(const pp of ph) {\n                        const px=pp.x-cx, py=pp.y-cy, fade=Math.max(0.1,pp.life/4);\n                        ctx.save();ctx.globalAlpha=fade*0.6;ctx.strokeStyle=\"#88ff88\";ctx.lineWidth=2;\n                        ctx.beginPath();ctx.arc(px,py,25,0,Math.PI*2);ctx.stroke();\n                        ctx.fillStyle=\"#88ff88\";ctx.beginPath();ctx.arc(px,py,10,0,Math.PI*2);ctx.fill();ctx.restore();\n                    }\n                });\n                if (!sm.runtimeState._phantoms) sm.runtimeState._phantoms = [];\n                sm.registerHandler(SkillEffectType.ON_DASH, 'counter_stance'"
);
fs.writeFileSync(path + '/Bastion.js', fb, 'utf8');
console.log('Bastion done');

// Shadow - afterimages + traps
let fsh = fs.readFileSync(path + '/Shadow.js', 'utf8');
fsh = fsh.replace(
    /(apply: function\(player, sm, params, prevParams\) \{\s*\n\s*_ensureBurnProcessor\(sm\);\s*\n\s*if \(!sm\.runtimeState\._afterimages\) sm\.runtimeState\._afterimages = \[\];\s*\n\s*sm\.registerHandler\(SkillEffectType\.ON_DASH, 'afterimage_blast')/,
    "apply: function(player, sm, params, prevParams) {\n                _ensureBurnProcessor(sm);\n                sm.registerDraw(\"afterimages\", function(ctx,cx,cy,p) {\n                    const im=sm.runtimeState._afterimages; if(!im)return;\n                    for(const i of im) {\n                        const ax=i.x-cx, ay=i.y-cy, fade=Math.max(0,i.life/0.5);\n                        ctx.save();ctx.globalAlpha=fade*0.8;ctx.fillStyle=\"#aa66ff\";ctx.shadowBlur=10;ctx.shadowColor=\"#9966ff\";\n                        ctx.beginPath();ctx.arc(ax,ay,8,0,Math.PI*2);ctx.fill();ctx.restore();\n                    }\n                });\n                if (!sm.runtimeState._afterimages) sm.runtimeState._afterimages = [];\n                sm.registerHandler(SkillEffectType.ON_DASH, 'afterimage_blast'"
);
fsh = fsh.replace(
    /(apply: function\(player, sm, params, prevParams\) \{\s*\n\s*_ensureBurnProcessor\(sm\);\s*\n\s*if \(!sm\.runtimeState\._traps\) sm\.runtimeState\._traps = \[\];\s*\n\s*sm\.registerHandler\(SkillEffectType\.ON_DASH, 'trap_rune')/,
    "apply: function(player, sm, params, prevParams) {\n                _ensureBurnProcessor(sm);\n                sm.registerDraw(\"traps\", function(ctx,cx,cy,p) {\n                    const tr=sm.runtimeState._traps; if(!tr)return;\n                    for(const t of tr) {\n                        const tx=t.x-cx, ty=t.y-cy;\n                        ctx.save();ctx.globalAlpha=0.6;ctx.strokeStyle=\"#9966ff\";ctx.lineWidth=2;ctx.setLineDash([4,4]);\n                        ctx.beginPath();ctx.arc(tx,ty,t.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);\n                        ctx.fillStyle=\"#9966ff\";ctx.beginPath();ctx.arc(tx,ty,5,0,Math.PI*2);ctx.fill();ctx.restore();\n                    }\n                });\n                if (!sm.runtimeState._traps) sm.runtimeState._traps = [];\n                sm.registerHandler(SkillEffectType.ON_DASH, 'trap_rune'"
);
fs.writeFileSync(path + '/Shadow.js', fsh, 'utf8');
console.log('Shadow done');

// Summoner - drones + mothership
let fsu = fs.readFileSync(path + '/Summoner.js', 'utf8');
fsu = fsu.replace(
    /(apply: function\(player, sm, params, prevParams\) \{\s*\n\s*_ensureBurnProcessor\(sm\);\s*\n\s*if \(!sm\.runtimeState\._drones\) sm\.runtimeState\._drones = \[\];\s*\n\s*const drones = sm\.runtimeState\._drones;)/,
    "apply: function(player, sm, params, prevParams) {\n                _ensureBurnProcessor(sm);\n                sm.registerDraw(\"drones\", function(ctx,cx,cy,p) {\n                    const d=sm.runtimeState._drones; if(!d)return;\n                    for(const dr of d) {\n                        const dx=p.x+Math.cos(dr.angle)*(dr.orbitR||60)-cx, dy=p.y+Math.sin(dr.angle)*(dr.orbitR||60)-cy;\n                        ctx.save();ctx.fillStyle=\"#ffcc00\";ctx.shadowBlur=10;ctx.shadowColor=\"#ffaa00\";\n                        ctx.beginPath();ctx.arc(dx,dy,6,0,Math.PI*2);ctx.fill();\n                        ctx.fillStyle=\"#ffffff\";ctx.beginPath();ctx.arc(dx,dy,3,0,Math.PI*2);ctx.fill();ctx.restore();\n                    }\n                });\n                if (!sm.runtimeState._drones) sm.runtimeState._drones = [];\n                const drones = sm.runtimeState._drones;"
);
fsu = fsu.replace(
    /(apply: function\(player, sm, params, prevParams\) \{\s*\n\s*_ensureBurnProcessor\(sm\);\s*\n\s*if \(!sm\.runtimeState\._mothership\) sm\.runtimeState\._mothership = \{ timer: 0, interceptors: \[\] \};\s*\n\s*sm\.registerHandler\(SkillEffectType\.PERIODIC, 'mothership')/,
    "apply: function(player, sm, params, prevParams) {\n                _ensureBurnProcessor(sm);\n                sm.registerDraw(\"mothership\", function(ctx,cx,cy,p) {\n                    const ms=sm.runtimeState._mothership; if(!ms)return;\n                    if(ms.timer>0 || ms.interceptors?.length>0) {\n                        const mx=p.x-cx, my=p.y-cy-200;\n                        ctx.save();ctx.globalAlpha=0.5;ctx.fillStyle=\"#444466\";ctx.shadowBlur=20;ctx.shadowColor=\"#334466\";\n                        ctx.beginPath();ctx.ellipse(mx,my,80,20,0,0,Math.PI*2);ctx.fill();\n                        ctx.fillStyle=\"#666688\";ctx.beginPath();ctx.ellipse(mx,my-4,50,12,0,0,Math.PI*2);ctx.fill();ctx.restore();\n                    }\n                    const ic=ms.interceptors; if(!ic)return;\n                    for(const i of ic) {\n                        const ix=i.x-cx, iy=i.y-cy;\n                        ctx.save();ctx.globalAlpha=0.7;ctx.strokeStyle=\"#ffaa00\";ctx.lineWidth=2;\n                        ctx.beginPath();ctx.moveTo(ix,iy-8);ctx.lineTo(ix-6,iy+4);ctx.lineTo(ix+6,iy+4);ctx.closePath();ctx.stroke();\n                        ctx.fillStyle=\"#ffcc00\";ctx.beginPath();ctx.arc(ix,iy+2,4,0,Math.PI*2);ctx.fill();ctx.restore();\n                    }\n                });\n                if (!sm.runtimeState._mothership) sm.runtimeState._mothership = { timer: 0, interceptors: [] };\n                sm.registerHandler(SkillEffectType.PERIODIC, 'mothership'"
);
fs.writeFileSync(path + '/Summoner.js', fsu, 'utf8');
console.log('Summoner done');
