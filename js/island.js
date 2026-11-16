/* Hearth Isle night-island renderer (Lanternlight). isoScene(progress 0..1, palette, idPrefix) -> {svg, W}. Exposes window.Isle. */
(function(){
/* ================= shared data ================= */
const STAGES=[
 {wk:'Week 1', season:'Spring · Week 1', settlers:3,  gp:4,   gt:'Plans drawn',     res:[2,3,4,5],    note:'Three settlers landed and lit the first fire.'},
 {wk:'Week 3', season:'Spring · Week 3', settlers:7,  gp:14,  gt:'Foundation laid', res:[16,11,19,14], note:'Juno finished the first cottage by the camp.'},
 {wk:'Week 6', season:'Spring · Week 6', settlers:14, gp:41,  gt:'Tier 1 of 3',     res:[41,27,46,33], note:'The market opened beside the new well.'},
 {wk:'Week 9', season:'Summer · Week 9', settlers:22, gp:72,  gt:'Tier 2 of 3',     res:[68,44,71,52], note:'Pell raised the windmill on the east field.'},
 {wk:'Week 12',season:'Summer · Week 12',settlers:31, gp:100, gt:'Complete',        res:[97,63,98,74], note:'The Hanging Gardens are finished. Festival tonight.'}
];
/* ================= isometric renderer (A + B) ================= */
const TW=16, TH=8, D=12;
const P=(x,y,z=0)=>[(x-y)*TW,(x+y)*TH-z];
const pts=a=>a.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
const poly=(a,f,x='')=>`<polygon points="${pts(a)}" fill="${f}" ${x}/>`;
const R=[2.6,3.6,4.6,5.5,6.3];
function rAt(f){const a=Math.floor(f),b=Math.min(4,a+1);return R[a]+(R[b]-R[a])*(f-a);}
function baseLand(x,y,s){const d=Math.hypot(x,y),th=Math.atan2(y,x);return d<rAt(s)*(1+.13*Math.sin(3*th+.6)+.07*Math.cos(5*th+1.3));}

const OBJ=[
 {k:'fire',t:'fire',x:0,y:0,s:0},{k:'tent',t:'tent',x:1,y:-1,s:0},
 {k:'t1',t:'tree',x:-1,y:-1,s:0},{k:'t2',t:'tree',x:-1,y:1,s:0},
 {k:'g',t:'gardens',x:-3,y:-3,w:2,h:2,s:1},
 {k:'h1',t:'house',x:-2,y:0,s:1,roof:0},{k:'f1',t:'farm',x:2,y:0,s:1},{k:'f2',t:'farm',x:2,y:1,s:1,crop:1},{k:'t4',t:'tree',x:0,y:-2,s:1},
 {k:'h2',t:'house',x:-1,y:2,s:2,roof:1},{k:'h3',t:'house',x:2,y:-2,s:2,roof:2},{k:'well',t:'well',x:1,y:1,s:2},{k:'stall',t:'stall',x:-1,y:0,s:2},
 {k:'f3',t:'farm',x:3,y:0,s:2,crop:2},{k:'f4',t:'farm',x:3,y:1,s:2},{k:'p1',t:'pine',x:3,y:-2,s:2},{k:'t5',t:'tree',x:-3,y:1,s:2},
 {k:'wm',t:'windmill',x:4,y:2,s:3},{k:'h4',t:'house',x:-3,y:2,s:3,roof:0},{k:'h5',t:'house',x:2,y:3,s:3,roof:1},{k:'tw',t:'tower',x:-4,y:-1,s:3},
 {k:'o1',t:'tree',x:-2,y:4,s:3,fruit:1},{k:'o2',t:'tree',x:-1,y:4,s:3,fruit:1},{k:'o3',t:'tree',x:-3,y:4,s:3,fruit:1},{k:'p5',t:'pine',x:0,y:-4,s:3},
 {k:'h6',t:'house',x:3,y:-3,s:4,roof:2},{k:'h7',t:'house',x:-4,y:3,s:4,roof:1},{k:'l1',t:'lantern',x:1,y:2,s:4},{k:'l2',t:'lantern',x:-2,y:1,s:4},{k:'l3',t:'lantern',x:0,y:4,s:4},
 {k:'p2',t:'pine',x:5,y:-1,s:4},{k:'p3',t:'pine',x:4,y:-3,s:4},{k:'p4',t:'pine',x:-5,y:1,s:4},{k:'fl1',t:'flowers',x:4,y:0,s:4},{k:'fl2',t:'flowers',x:-2,y:3,s:4},{k:'fl3',t:'flowers',x:1,y:4,s:4},{k:'rk',t:'rock',x:-1,y:-4,s:4}
];
const PATHS=[[0,1,1],[0,2,1],[0,3,2],[-1,1,2],[1,0,2],[0,4,3],[1,3,3],[-1,3,4],[0,5,4]];
const WALK=[
 {f:[.6,1.5],t:[1.4,1.8],s:0,c:0,d:7},{f:[-.25,.6],t:[-.25,.6],s:0,c:1},{f:[1.7,.3],t:[1.3,1.2],s:0,c:2,d:5.5},
 {f:[.5,2.6],t:[.5,1.4],s:1,c:3,d:8},{f:[2.5,.4],t:[2.5,1.7],s:1,c:4,d:6},
 {f:[-.5,1.6],t:[-1.5,1.4],s:2,c:5,d:7},{f:[1.5,.5],t:[1.6,1.6],s:2,c:0,d:9},{f:[3.4,.6],t:[3.6,1.5],s:2,c:2,d:6.5},
 {f:[.5,3.6],t:[.5,2.4],s:3,c:1,d:7.5},{f:[-1.4,3.6],t:[-2.6,3.6],s:3,c:3,d:8.5},{f:[-1.2,-.6],t:[-1.2,-.6],s:3,c:4},{f:[3.6,2.5],t:[3.4,1.6],s:3,c:5,d:6},
 {f:[1.5,3.5],t:[.5,4.5],s:4,c:2,d:7},{f:[-1.6,2.5],t:[-.6,1.5],s:4,c:0,d:8},{f:[2.4,-1],t:[1.6,-.4],s:4,c:3,d:7},{f:[.5,5.5],t:[.5,4.4],s:4,c:1,d:9}
];
/* unlock thresholds: each stage's objects appear one by one across the previous stage interval */
(function(){for(let s=0;s<=4;s++){const g=OBJ.filter(o=>o.s===s&&o.t!=='gardens');g.forEach((o,i)=>o.th=s===0?0:s-1+(i+1)/g.length);const w=WALK.filter(o=>o.s===s);w.forEach((o,i)=>o.th=s===0?0:s-1+(i+.5)/w.length);}OBJ.find(o=>o.t==='gardens').th=.6;})();
const PAL_B={night:true,shallow:'#1f3f5f',foam:'#2e5779',g1:'#2f5d55',g2:'#2c5951',sand:'#7a7564',path:'#5d5747',gSideL:'#24493f',gSideR:'#1c3b34',sSideL:'#625c4c',sSideR:'#524c3f',eL:'#433429',eR:'#33281f',
 wallL:'#76839a',wallR:'#56627a',door:'#3a2b24',win:'#ffcf73',roofs:['#8c4f45','#3f5e82','#8a7240'],roofsD:['#6c3a33','#2f4865','#6b5731'],trunk:'#4a3628',can:'#24493f',canL:'#2f5d50',canD:'#1b3a32',pineL:'#26503f',pineD:'#1a3a2e',
 soil:'#4d3c2e',crops:['#3a6b4a','#8a7a3e','#8f5a35'],stoneT:'#8c8270',stoneL:'#776e5e',stoneR:'#5f574a',vine:'#2f6247',water:'#3d6f9a',waterL:'#9cc6e6',canvas:'#a69a83',canvasD:'#7e7462',wood:'#5f4532',woodD:'#47331f',rock:'#566068',rockD:'#424a51',
 skin:'#d8a985',shirts:['#c05f3a','#4f7fae','#c79a3a','#7a63ab','#3b8a6a','#b0527a'],shadow:'rgba(0,0,0,.28)',smoke:'#9fb0c8',flower:['#e07a8c','#e8c35a','#d8dde8','#a98ad6']};

function isoTile(x,y,c){return poly([P(x,y),P(x+1,y),P(x+1,y+1),P(x,y+1)],c,`stroke="${c}" stroke-width=".7"`);}
function box(x0,y0,x1,y1,z0,h,cT,cL,cR){
  return poly([P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z0+h),P(x0,y1,z0+h)],cL)
   +poly([P(x1,y0,z0),P(x1,y1,z0),P(x1,y1,z0+h),P(x1,y0,z0+h)],cR)
   +(cT?poly([P(x0,y0,z0+h),P(x1,y0,z0+h),P(x1,y1,z0+h),P(x0,y1,z0+h)],cT):'');
}
function shadowAt(sx,sy,rx,p){return `<ellipse cx="${sx}" cy="${sy}" rx="${rx}" ry="${rx/2}" fill="${p.shadow}"/>`;}
function glow(sx,sy,r,id,o=1){return `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${r}" fill="url(#gl${id})" opacity="${o}"/>`;}

function isoHouse(o,p,id){
  const x0=o.x+.18,x1=o.x+.82,y0=o.y+.2,y1=o.y+.8,h=13,r=9,ym=(y0+y1)/2,ov=.07,xm=(x0+x1)/2;
  const roof=p.roofs[o.roof||0],roofD=p.roofsD[o.roof||0];
  let s=box(x0,y0,x1,y1,0,h,null,p.wallL,p.wallR);
  s+=poly([P(xm-.1,y1,0),P(xm+.06,y1,0),P(xm+.06,y1,7.5),P(xm-.1,y1,7.5)],p.door);
  const wf=p.night?` filter="url(#gw${id})"`:'';
  s+=poly([P(x1-.2,y1,5.5),P(x1-.08,y1,5.5),P(x1-.08,y1,9.5),P(x1-.2,y1,9.5)],p.win,wf);
  s+=poly([P(x1,ym-.12,5.5),P(x1,ym+.08,5.5),P(x1,ym+.08,9.8),P(x1,ym-.12,9.8)],p.win,wf);
  s+=poly([P(x1,y0,h),P(x1,y1,h),P(x1,ym,h+r)],p.wallR);
  // chimney behind ridge
  s+=box(x0+.12,ym-.16,x0+.26,ym-.02,h+3,9,roofD,p.wallR,p.wallR);
  s+=poly([P(x0-ov,y1+ov,h-1),P(x1+ov,y1+ov,h-1),P(x1+ov,ym,h+r),P(x0-ov,ym,h+r)],roof);
  s+=`<polyline points="${pts([P(x1+ov,y1+ov,h-1),P(x1+ov,ym,h+r),P(x0-ov,ym,h+r)])}" fill="none" stroke="${roofD}" stroke-width="1.4" stroke-linejoin="round"/>`;
  const [cx,cy]=P(x0+.19,ym-.09,h+13);
  s+=`<circle class="smoke" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.4" fill="${p.smoke}" style="animation-delay:-${(o.x*7+o.y*3+20)%4}s"/>`;
  if(p.night){const [gx,gy]=P(x1,y1,4);s=glow(gx,gy,16,id,.55)+s;}
  return s;
}
function isoTree(o,p,id){
  const [sx,sy]=P(o.x+.5,o.y+.5);
  let s=shadowAt(sx+2,sy,7,p)+`<rect x="${sx-1.3}" y="${sy-8}" width="2.6" height="8" rx="1" fill="${p.trunk}"/>`;
  s+=`<circle cx="${sx}" cy="${sy-14}" r="7.5" fill="${p.can}"/><circle cx="${sx+2.5}" cy="${sy-11.5}" r="5" fill="${p.canD}"/><circle cx="${sx-2.2}" cy="${sy-16.5}" r="4" fill="${p.canL}"/>`;
  if(o.fruit) s+=`<circle cx="${sx-3}" cy="${sy-11}" r="1.3" fill="#e2573f"/><circle cx="${sx+3.5}" cy="${sy-15}" r="1.3" fill="#e2573f"/><circle cx="${sx+.5}" cy="${sy-18.5}" r="1.3" fill="#e2573f"/>`;
  return s;
}
function isoPine(o,p){
  const [sx,sy]=P(o.x+.5,o.y+.5);
  let s=shadowAt(sx+2,sy,6,p)+`<rect x="${sx-1.1}" y="${sy-5}" width="2.2" height="5" fill="${p.trunk}"/>`;
  [[0,11],[6,9],[12,7]].forEach(([dy,w],i)=>{const b=sy-4-dy,t=b-12;
    s+=poly([[sx-w/2*1.0,b],[sx,b+2.5],[sx,t]],p.pineL)+poly([[sx,b+2.5],[sx+w/2,b],[sx,t]],p.pineD);});
  return s;
}
function isoFire(o,p,id){
  const [sx,sy]=P(o.x+.5,o.y+.5);
  let s='';
  if(p.night) s+=glow(sx,sy-3,30,id,.9);
  s+=`<ellipse cx="${sx}" cy="${sy}" rx="7" ry="3.5" fill="${p.rock}"/><ellipse cx="${sx}" cy="${sy-.4}" rx="5" ry="2.4" fill="#5a4636"/>`;
  s+=`<path d="M${sx-5} ${sy+1}l10 -3M${sx-5} ${sy-2}l10 3" stroke="${p.wood}" stroke-width="2" stroke-linecap="round"/>`;
  s+=`<path class="flick" d="M${sx} ${sy-12}c3 4 4.5 6 3.5 8.5-.8 2-6.2 2-7 0-1-2.5.8-4.2 3.5-8.5z" fill="#f08a2c"/>`;
  s+=`<path class="flick" style="animation-delay:-.2s" d="M${sx} ${sy-8}c1.7 2.3 2.5 3.4 2 5-.5 1.1-3.5 1.1-4 0-.5-1.6.4-2.7 2-5z" fill="#ffd45a"/>`;
  return s;
}
function isoTent(o,p){
  const x0=o.x+.2,x1=o.x+.85,y0=o.y+.2,y1=o.y+.8,ym=(y0+y1)/2,h=11;
  return shadowAt(...P(o.x+.6,o.y+.6),9,p)+poly([P(x1,y0),P(x1,y1),P(x1,ym,h)],p.canvasD)+poly([P(x1,ym-.13),P(x1,ym+.13),P(x1,ym,6.5)],'#5a4636')
   +poly([P(x0,y1),P(x1,y1),P(x1,ym,h),P(x0,ym,h)],p.canvas)+`<polyline points="${pts([P(x0,ym,h),P(x1,ym,h)])}" stroke="${p.canvasD}" stroke-width="1.2"/>`;
}
function isoFarm(o,p){
  const i=.1;let s=poly([P(o.x+i,o.y+i),P(o.x+1-i,o.y+i),P(o.x+1-i,o.y+1-i),P(o.x+i,o.y+1-i)],p.soil);
  const c=p.crops[o.crop||0];
  for(let r=0;r<3;r++){const y=o.y+.25+r*.25;
    s+=`<line x1="${P(o.x+.18,y)[0]}" y1="${P(o.x+.18,y)[1]}" x2="${P(o.x+.82,y)[0]}" y2="${P(o.x+.82,y)[1]}" stroke="${p.night?'#3b2e23':'#a07a52'}" stroke-width="1.2"/>`;
    for(let k=0;k<4;k++){const [cx,cy]=P(o.x+.22+k*.19,y,1.6);s+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.9" fill="${c}"/>`;}}
  return s;
}
function isoWell(o,p){
  const [sx,sy]=P(o.x+.5,o.y+.5);
  return shadowAt(sx+2,sy+1,8,p)+`<path d="M${sx-6} ${sy-5}v5a6 3 0 0 0 12 0v-5z" fill="${p.rock}"/><ellipse cx="${sx}" cy="${sy-5}" rx="6" ry="3" fill="${p.rockD}"/><ellipse cx="${sx}" cy="${sy-5}" rx="4.2" ry="2" fill="${p.water}"/>`
   +`<path d="M${sx-5} ${sy-5}v-10M${sx+5} ${sy-5}v-10" stroke="${p.woodD}" stroke-width="1.6"/><path d="M${sx-8} ${sy-14}l8 -5 8 5z" fill="${p.roofs[0]}"/>`;
}
function isoStall(o,p){
  const x0=o.x+.15,x1=o.x+.85,y0=o.y+.3,y1=o.y+.75,ym=(y0+y1)/2;
  let s=shadowAt(...P(o.x+.6,o.y+.6),9,p)+box(x0,y0,x1,y1,0,7,p.wood,p.wood,p.woodD);
  for(let k=0;k<4;k++){const a=x0-.04+k*.19,b=a+.19;
    s+=poly([P(a,y1+.12,11),P(b,y1+.12,11),P(b,ym-.1,16),P(a,ym-.1,16)],k%2?'#f3efe6':p.roofs[0]);}
  [[.2,'#e3573f'],[.42,'#f2b33d'],[.64,'#6fbf5c']].forEach(([f,c])=>{const [cx,cy]=P(x0+f,y1-.05,8.5);s+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2" fill="${c}"/>`;});
  return s;
}
function isoWindmill(o,p,id){
  const x0=o.x+.22,x1=o.x+.78,y0=o.y+.22,y1=o.y+.78,t=.1,h=26,xm=(x0+x1)/2,ym=(y0+y1)/2;
  let s=shadowAt(...P(o.x+.7,o.y+.7),12,p);
  s+=poly([P(x0,y1),P(x1,y1),P(x1-t,y1-t,h),P(x0+t,y1-t,h)],p.wallL)+poly([P(x1,y0),P(x1,y1),P(x1-t,y1-t,h),P(x1-t,y0+t,h)],p.wallR);
  s+=poly([P(x0,y1-t+.02,h),P(x1-t+.02,y1-t+.02,h),P(xm,ym,h+11)],p.roofs[1])+poly([P(x1-t+.02,y0,h),P(x1-t+.02,y1-t+.02,h),P(xm,ym,h+11)],p.roofsD[1]);
  s+=poly([P(xm-.07,y1-.05,0),P(xm+.07,y1-.05,0),P(xm+.07,y1-.05,7),P(xm-.07,y1-.05,7)],p.door);
  if(p.night){const [gx,gy]=P(xm+.12,y1-.04,15);s+=`<rect x="${gx-1.6}" y="${gy-2.5}" width="3.2" height="4.5" fill="${p.win}" filter="url(#gw${id})"/>`;}
  const [hx,hy]=P(xm,y1-.02,h-3);let b='';
  for(let a=0;a<4;a++)b+=`<g transform="rotate(${a*90} ${hx.toFixed(1)} ${hy.toFixed(1)})"><rect x="${(hx-1.6).toFixed(1)}" y="${(hy-17).toFixed(1)}" width="3.2" height="15" rx="1" fill="${p.canvas}" stroke="${p.woodD}" stroke-width=".8"/></g>`;
  s+=`<g class="spin" style="transform-origin:${hx.toFixed(1)}px ${hy.toFixed(1)}px">${b}</g><circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="1.8" fill="${p.woodD}"/>`;
  return s;
}
function isoTower(o,p,id){
  const x0=o.x+.25,x1=o.x+.75,y0=o.y+.25,y1=o.y+.75,h=30,xm=.5+o.x,ym=.5+o.y;
  let s=shadowAt(...P(o.x+.7,o.y+.7),10,p)+box(x0,y0,x1,y1,0,h,null,p.stoneL,p.stoneR);
  s+=box(x0-.06,y0-.06,x1+.06,y1+.06,h,3,p.stoneT,p.stoneL,p.stoneR);
  s+=poly([P(x0-.06,y1+.06,h+3),P(x1+.06,y1+.06,h+3),P(xm,ym,h+16)],p.roofs[0])+poly([P(x1+.06,y0-.06,h+3),P(x1+.06,y1+.06,h+3),P(xm,ym,h+16)],p.roofsD[0]);
  const wf=p.night?` filter="url(#gw${id})"`:'';
  s+=poly([P(xm-.06,y1,18),P(xm+.06,y1,18),P(xm+.06,y1,24),P(xm-.06,y1,24)],p.win,wf);
  const [fx,fy]=P(xm,ym,h+16);s+=`<path d="M${fx} ${fy}v-8" stroke="${p.woodD}" stroke-width="1"/><path class="float" d="M${fx} ${fy-8}l7 2-7 2z" fill="${p.roofs[2]}"/>`;
  if(p.night)s=glow(...P(x1,y1,20),id,.4)+s;
  return s;
}
function isoLantern(o,p,id){
  const [sx,sy]=P(o.x+.5,o.y+.5);
  let s=(p.night?glow(sx,sy-11,20,id,1):'')+`<path d="M${sx} ${sy}v-10" stroke="${p.woodD}" stroke-width="1.3"/><rect x="${sx-2}" y="${sy-14}" width="4" height="4.5" rx="1" fill="${p.night?'#ffd77e':'#f2c14e'}"${p.night?` filter="url(#gw${id})"`:''}/>`;
  return s;
}
function isoFlowers(o,p){
  let s='';for(let k=0;k<9;k++){const fx=o.x+.2+((k*37)%60)/100,fy=o.y+.2+((k*53)%60)/100;const [cx,cy]=P(fx,fy,1);
    s+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.5" fill="${p.flower[k%4]}"/>`;}return s;
}
function isoRock(o,p){const [sx,sy]=P(o.x+.5,o.y+.5);return poly([[sx-7,sy],[sx-4,sy-6],[sx+2,sy-7],[sx+6,sy-1],[sx+2,sy+2]],p.rock)+poly([[sx+2,sy-7],[sx+6,sy-1],[sx+2,sy+2],[sx+1,sy-3]],p.rockD);}
function isoGardens(o,p,stage,id){
  const gx=o.x,gy=o.y;let s='';
  if(stage===1){ // foundation + scaffold
    s+=box(gx+.1,gy+.1,gx+1.9,gy+1.9,0,3,p.stoneT,p.stoneL,p.stoneR);
    [[.4,1.5],[1.5,.5]].forEach(([a,b])=>{s+=box(gx+a,gy+b,gx+a+.25,gy+b+.25,3,5,p.wood,p.wood,p.woodD);});
    const q=(x,y,z)=>P(gx+x,gy+y,z);
    s+=`<path d="M${pts([q(1.75,1.85,3)])} L${pts([q(1.75,1.85,22)])} M${pts([q(.25,1.85,3)])} L${pts([q(.25,1.85,22)])} M${pts([q(.25,1.85,20)])} L${pts([q(1.75,1.85,20)])} M${pts([q(1.75,.25,3)])} L${pts([q(1.75,.25,22)])} M${pts([q(1.75,.25,20)])} L${pts([q(1.75,1.85,20)])}" stroke="${p.woodD}" stroke-width="1.1" fill="none"/>`;
    return s;
  }
  const tiers=stage>=4?3:stage-1;
  for(let i=0;i<tiers;i++){
    const ins=.08+.3*i,x0=gx+ins,y0=gy+ins,x1=gx+2-ins,y1=gy+2-ins,z0=i*12,h=12;
    s+=box(x0,y0,x1,y1,z0,h,p.g1,p.stoneL,p.stoneR);
    // grass lip
    s+=poly([P(x0,y1,z0+h),P(x1,y1,z0+h),P(x1,y1,z0+h-2.2),P(x0,y1,z0+h-2.2)],p.vine)+poly([P(x1,y0,z0+h),P(x1,y1,z0+h),P(x1,y1,z0+h-2.2),P(x1,y0,z0+h-2.2)],p.canD);
    // vines
    const n=Math.round((x1-x0)*6);
    for(let k=0;k<n;k++){const f=(k+.5)/n,L=4+((k*7+i*3)%6);
      const xa=x0+(x1-x0)*f;s+=poly([P(xa-.04,y1,z0+h-1),P(xa+.04,y1,z0+h-1),P(xa,y1,z0+h-1-L)],p.vine);
      const ya=y0+(y1-y0)*f;s+=poly([P(x1,ya-.04,z0+h-1),P(x1,ya+.04,z0+h-1),P(x1,ya,z0+h-1-L*.8)],p.canD);}
    // flowers on rim
    for(let k=0;k<5;k++){const [cx,cy]=P(x0+.15+k*(x1-x0-.3)/4,y1-.06,z0+h+.6);s+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.4" fill="${p.flower[(k+i)%4]}"/>`;}
    // arch on the front face
    const xm=(x0+x1)/2;s+=poly([P(xm-.13,y1,z0),P(xm+.13,y1,z0),P(xm+.13,y1,z0+7),P(xm,y1,z0+9),P(xm-.13,y1,z0+7)],p.night?'#2a2420':'#7d6448');
  }
  if(stage>=4){
    const [tx,ty]=P(gx+1,gy+1,36);
    s+=`<rect x="${tx-1.2}" y="${ty-7}" width="2.4" height="7" fill="${p.trunk}"/><circle cx="${tx}" cy="${ty-12}" r="6.5" fill="${p.can}"/><circle cx="${tx-2}" cy="${ty-14}" r="3.4" fill="${p.canL}"/><circle cx="${tx+3}" cy="${ty-11}" r="1.5" fill="${p.flower[0]}"/><circle cx="${tx-3}" cy="${ty-9.5}" r="1.4" fill="${p.flower[1]}"/>`;
    // waterfall down the right faces into a pool
    const wy=gy+1.25;
    let d='';[[.68,24,36],[.38,12,24],[.08,0,12]].forEach(([ins,zb,zt])=>{const x=gx+2-ins;d+=pts([P(x,wy-.08,zt),P(x,wy+.08,zt),P(x,wy+.08,zb),P(x,wy-.08,zb)])+' ';});
    [[.68,24,36],[.38,12,24],[.08,0,12]].forEach(([ins,zb,zt])=>{const x=gx+2-ins;
      s+=poly([P(x,wy-.08,zt),P(x,wy+.08,zt),P(x,wy+.08,zb),P(x,wy-.08,zb)],p.water);
      const a=P(x,wy,zt),b=P(x,wy,zb);s+=`<line class="fall" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${p.waterL}" stroke-width="1.2" stroke-dasharray="3 5"/>`;});
    s+=poly([P(gx+2.02,wy-.3,.2),P(gx+2.45,wy-.3,.2),P(gx+2.45,wy+.3,.2),P(gx+2.02,wy+.3,.2)],p.water);
    if(p.night)s=glow(...P(gx+1,gy+1,30),id,.35)+s;
  }
  return s;
}
const DRAW={house:isoHouse,tree:isoTree,pine:isoPine,fire:isoFire,tent:isoTent,farm:isoFarm,well:isoWell,stall:isoStall,windmill:isoWindmill,tower:isoTower,lantern:isoLantern,flowers:isoFlowers,rock:isoRock};

function person(sx,sy,c,p,scale=1){
  return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${scale})"><g class="bob"><ellipse cx="0" cy="0" rx="2.6" ry="1.2" fill="${p.shadow}"/><rect x="-1.6" y="-6.2" width="3.2" height="5.6" rx="1.3" fill="${p.shirts[c]}"/><circle cx="0" cy="-7.8" r="1.8" fill="${p.skin}"/></g></g>`;
}

function isoScene(prog,p,id){
  const f=Math.max(0,Math.min(4,prog*4)),stage=Math.floor(f+1e-9),gst=f<.6?0:f<1.5?1:f<2.5?2:f<3.6?3:4;
  const vis=OBJ.filter(o=>o.th<=f);
  const forced=new Set();
  vis.forEach(o=>{const w=o.w||1,h=o.h||1;for(let i=-1;i<=w;i++)for(let j=-1;j<=h;j++)forced.add((o.x+i)+','+(o.y+j));});
  WALK.filter(w=>w.th<=f).forEach(w=>{[w.f,w.t].forEach(([a,b])=>forced.add(Math.floor(a)+','+Math.floor(b)));});
  const L=(x,y)=>forced.has(x+','+y)||baseLand(x,y,f);
  const tiles=[];for(let x=-10;x<=10;x++)for(let y=-10;y<=10;y++)if(L(x,y))tiles.push([x,y]);
  tiles.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
  const pathSet=new Set(PATHS.filter(q=>q[2]-.5<=f).map(q=>q[0]+','+q[1]));
  let s=`<defs><radialGradient id="gl${id}"><stop offset="0" stop-color="#ffc86b" stop-opacity=".55"/><stop offset="1" stop-color="#ffc86b" stop-opacity="0"/></radialGradient>
    <filter id="gw${id}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  // night sky dressing: moon reflection
  if(p.night){s+=`<g opacity=".5">${[0,1,2,3,4].map(i=>`<rect class="glint" style="animation-delay:-${i*.6}s" x="${118-i*3}" y="${-70+i*9}" width="${14+i*4}" height="1.5" rx=".75" fill="#c9d8f0"/>`).join('')}</g>`;}
  // water glints
  [[-130,-40],[110,60],[-100,80],[140,-10],[-40,110],[60,-90]].forEach(([x,y],i)=>{s+=`<path class="glint" style="animation-delay:-${i*.7}s" d="M${x} ${y}h8" stroke="${p.night?'#4d7aa5':'#ffffff'}" stroke-width="1.3" stroke-linecap="round"/>`;});
  // shoreline halos
  tiles.forEach(([x,y])=>{const e=.75;s+=poly([P(x-e,y-e,-D),P(x+1+e,y-e,-D),P(x+1+e,y+1+e,-D),P(x-e,y+1+e,-D)],p.shallow);});
  tiles.forEach(([x,y])=>{const e=.25;s+=poly([P(x-e,y-e,-D),P(x+1+e,y-e,-D),P(x+1+e,y+1+e,-D),P(x-e,y+1+e,-D)],p.foam);});
  tiles.forEach(([x,y])=>{
    const sand=!L(x+1,y)||!L(x-1,y)||!L(x,y+1)||!L(x,y-1);
    const path=pathSet.has(x+','+y);
    const c=path?p.path:sand?p.sand:(((x*7+y*13)&1)?p.g1:p.g2);
    s+=isoTile(x,y,c);
    if(!L(x+1,y)){s+=poly([P(x+1,y),P(x+1,y+1),P(x+1,y+1,-D),P(x+1,y,-D)],p.eR)+poly([P(x+1,y),P(x+1,y+1),P(x+1,y+1,-3),P(x+1,y,-3)],sand?p.sSideR:p.gSideR);}
    if(!L(x,y+1)){s+=poly([P(x,y+1),P(x+1,y+1),P(x+1,y+1,-D),P(x,y+1,-D)],p.eL)+poly([P(x,y+1),P(x+1,y+1),P(x+1,y+1,-3),P(x,y+1,-3)],sand?p.sSideL:p.gSideL);}
  });
  // objects + walkers in depth order
  const items=[];
  vis.forEach(o=>{const w=o.w||1,h=o.h||1;items.push({z:o.x+o.y+w+h-(o.t==='farm'||o.t==='flowers'?1.5:0),k:o.k,svg:()=>o.t==='gardens'?isoGardens(o,p,gst,id):DRAW[o.t](o,p,id)});});
  WALK.filter(w=>w.th<=f).forEach((w,i)=>{const a=P(w.f[0],w.f[1]),b=P(w.t[0],w.t[1]);
    items.push({z:w.f[0]+w.f[1]+.3,k:'w'+i,svg:()=>{const moving=w.d?` class="walk" style="--dx:${(b[0]-a[0]).toFixed(1)}px;--dy:${(b[1]-a[1]).toFixed(1)}px;animation-duration:${w.d}s;animation-delay:-${i*1.3}s"`:'';
      return `<g${moving}>${person(a[0],a[1],w.c,p)}</g>`;}});});
  // boat moored off the east shore
  let bx=0;for(let x=0;x<=10;x++)if(L(x,0)||L(x,1))bx=x;
  const [bsx,bsy]=P(bx+2.2,.6,-D+2);
  items.push({z:99,k:'boat',svg:()=>`<g class="float"><path d="M${bsx-11} ${bsy-3}h22l-4 5h-14z" fill="${p.wood}"/><path d="M${bsx-11} ${bsy-3}h22" stroke="${p.woodD}" stroke-width="1.2"/><path d="M${bsx} ${bsy-3}v-15" stroke="${p.woodD}" stroke-width="1.1"/><path d="M${bsx+.8} ${bsy-17}l8 11h-8z" fill="${p.canvas}"/></g>`});
  items.sort((a,b)=>a.z-b.z);
  items.forEach(it=>{s+=`<g class="o" data-k="${it.k}">${it.svg()}</g>`;});
  // fireflies at night
  if(p.night&&stage>=2){[[-60,-10],[-20,-40],[30,20],[70,-20],[-80,30],[10,-60],[90,30],[-40,40]].slice(0,stage*2).forEach(([x,y],i)=>{s+=`<circle class="fly" style="animation-delay:-${i*.9}s" cx="${x}" cy="${y}" r="1.3" fill="#ffe28a"/>`;});}
  const W=72+(148-72)*f/4;
  return {svg:s,W};
}


window.Isle={STAGES,isoScene,PAL_B};
})();
