// Simulace hry bez prohlížeče: node dev/sim.js  (skript se vytáhne z index.html automaticky)
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const src=html.split('<script>')[1].split('</script>')[0];
fs.writeFileSync(__dirname+'/game.js',src);
const noop=()=>{};
const mkCtx=()=>new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createRadialGradient:()=>({addColorStop:noop}),measureText:()=>({width:1})},{get:(t,k)=>k in t?t[k]:noop,set:()=>true});
const mkEl=()=>({hidden:false,style:{},dataset:{},innerHTML:'',textContent:'',width:0,height:0,clientWidth:960,clientHeight:600,addEventListener:noop,getBoundingClientRect:()=>({left:0,top:0}),getContext:()=>mkCtx(),toDataURL:()=>'',closest:()=>null});
const els={};
const document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl(),addEventListener:noop,fullscreenElement:null};
const store={};const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
const window={__TEST__:true,addEventListener:noop,devicePixelRatio:1,ResizeObserver:undefined,requestAnimationFrame:noop};
const ctx={document,window,localStorage,requestAnimationFrame:noop,console,setTimeout:()=>0,clearTimeout:noop,confirm:()=>true,Math,JSON,Map,Set,Uint8Array,Uint16Array,Int16Array,Int32Array,Uint8ClampedArray,Array,Object,Proxy,String,Number,Infinity,NaN,Date,RegExp,Error};
vm.createContext(ctx);vm.runInContext(src,ctx);
const G=ctx.window.G;
let fails=0;function assert(c,m){if(!c){console.error('FAIL:',m);fails++;process.exitCode=1}else console.log('ok:',m)}
const run=(sec)=>{for(let i=0;i<60*sec;i++)G.update(1/60)};
G.newGame();const S=G.S;
// --- linka 1: přímé napojení strojů bez pásů ---
// sklady -> hnětač(10,10) -> pec(12,10) -> plnička(14,10) <- šlehač(14,12 dir 0) ; čokoláda -> polévačka(16,10) -> chladič(18,10) -> expedice(20,10)
const src1=(it,x,y,dir)=>{const e=G.place('sklad',x,y,dir);e.item=it;return e};
src1('mouka',9,10,1);src1('cukr',9,11,1);src1('vejce',10,9,2);
const hn=G.place('hnetac',10,10,1);const pec=G.place('pec',12,10,1);const pl=G.place('plnicka',14,10,1);
const sl=G.place('slehac',14,12,0);src1('maslo',13,12,1);src1('cukr',13,13,1);src1('kakao',16,12,3);src1('konak',16,13,3);
const po=G.place('polevacka',16,10,1);src1('cokolada',16,9,2);
const chl=G.place('chladic',18,10,1);const ex=G.place('expedice',20,10,1);
const m0=S.money;run(60);
console.log('hnetac',hn.inp,hn.out,'pec',pec.inp,pec.out,'slehac',sl.inp,sl.out,'plnicka',pl.inp,pl.out,'polev',po.inp,po.out,'chladic',chl.inp,chl.out,'sold',ex.sold,'money',S.money.toFixed(0),'rate',G.rate());
assert(ex.sold>5,'špičky prodány přímým řetězcem: '+ex.sold);
assert(S.stats.pieces===ex.sold,'statistika sedí');
run(60);assert(S.zak.done>=1,'první zakázka splněna (prodáno '+ex.sold+')');
assert(S.money>m0,'linka je zisková: '+m0.toFixed(0)+' -> '+S.money.toFixed(0));
// --- linka 2: pásy + ruka + regál + koš ---
const s2=src1('mouka',2,20,1);const b=[];for(let x=3;x<8;x++)b.push(G.place('pas',x,20,1));
const reg=G.place('regal',8,20,0);const ruka=G.place('ruka',9,20,1);const kos=G.place('kos',10,20,0);
run(20);console.log('regal',reg.inv,'kos trashed',S.stats.trashed);
assert((reg.inv.mouka||0)>0||S.stats.trashed>0,'mouka doputovala po pásu do regálu');
assert(S.stats.trashed>0,'ruka přenáší z regálu do koše');
// pás do stroje a boční napojení
const s3=src1('cokolada',2,24,1);G.place('pas',3,24,1);G.place('pas',4,24,1);G.place('pas',5,24,0);G.place('pas',5,23,0);const reg2=G.place('regal',5,22,0);
run(10);assert((reg2.inv.cokolada||0)>0,'zatáčka pásu funguje: '+reg2.inv.cokolada);
// výstup stroje na pás před sebou, pás nesmí vracet do stroje
const hn2=G.place('hnetac',20,20,1);src1('mouka',19,20,1);src1('cukr',19,21,1);src1('vejce',20,19,2);G.place('pas',22,20,1);G.place('pas',23,20,1);const reg3=G.place('regal',24,20,0);
run(20);assert((reg3.inv.testo||0)>0,'těsto jede z hnětače po pásu do regálu: '+reg3.inv.testo);
// odstranění vrací peníze
const mm=S.money;G.removeEnt(reg3);assert(S.money===mm+G.BUILD.regal.cost,'odstranění vrátí cenu');
// ukládání a načtení
G.save();const n1=S.ents.size,mon=S.money;assert(G.load(),'load');assert(G.S.ents.size===n1&&G.S.money===mon,'save/load zachová entity a peníze');
run(5);assert(G.S.stats.pieces>0,'po načtení hra běží');
// výstup plný -> stroj čeká, nic nepadá
const lone=G.place('pec',30,5,1);lone.inp.testo=40;run(30);assert(lone.out<=10,'výstupní buffer omezen: '+lone.out);
// --- linka 3: větrník (volitelné recepty) ---
G.S.zak.done=5;// odemknout vše
const vh=G.place('hnetac',2,2,1);src1('mouka',1,2,1);src1('maslo',1,3,1);src1('vejce',2,1,2);G.setRecipe(vh,'odpal');
const vp=G.place('pec',4,2,1);G.setRecipe(vp,'vkorpus');
const vpl=G.place('plnicka',6,2,1);G.setRecipe(vpl,'vplneny');
const vs=G.place('slehac',6,4,0);G.setRecipe(vs,'karamel');src1('smetana',5,4,1);src1('cukr',5,5,1);src1('maslo',8,4,3);
const vpo=G.place('polevacka',8,2,1);G.setRecipe(vpo,'vpolity');src1('cukr',8,1,2);
const vch=G.place('chladic',10,2,1);G.setRecipe(vch,'vetrnik');const vex=G.place('expedice',12,2,1);
run(60);console.log('vetrnik: hnetac',vh.inp,vh.out,'pec',vp.out,'slehac',vs.inp,vs.out,'plnicka',vpl.inp,vpl.out,'polev',vpo.out,'chladic',vch.out,'sold',vex.sold);
assert(vex.sold>3,'větrníky prodány: '+vex.sold);
assert((G.S.stats.sold.vetrnik||0)===vex.sold,'prodané větrníky se počítají');
// --- linka 4: rakvička (bez polevy a chlazení, plnička rovnou do expedice) ---
const rh=G.place('hnetac',2,27,1);src1('cukr',1,27,1);src1('vejce',1,28,1);src1('mouka',2,26,2);G.setRecipe(rh,'rtesto');
const rp=G.place('pec',4,27,1);G.setRecipe(rp,'rkorpus');
const rpl=G.place('plnicka',6,27,1);G.setRecipe(rpl,'rakvicka');
const rs=G.place('slehac',6,29,0);G.setRecipe(rs,'slehacka');src1('smetana',5,29,1);src1('cukr',5,30,1);
const rex=G.place('expedice',8,27,1);
run(60);console.log('rakvicka: pec',rp.out,'slehac',rs.out,'plnicka',rpl.inp,rpl.out,'sold',rex.sold);
assert(rex.sold>3,'rakvičky prodány: '+rex.sold);
// přepnutí receptu vyhodí obsah
rpl.inp.rkorpus=3;G.setRecipe(rpl,'plnena');assert(Object.keys(rpl.inp).length===0&&rpl.out===0&&rpl.rec==='plnena','přepnutí receptu vyprázdní stroj');
assert(G.accepts(rpl,'korpus')&&!G.accepts(rpl,'rkorpus'),'stroj přijímá podle zvoleného receptu');
// dárková krabice
const bal=G.place('balicka',30,27,1);G.setRecipe(bal,'darkova');const bex=G.place('expedice',32,27,1);
bal.inp={spicka:4,vetrnik:4,rakvicka:4,krabicka:2};run(12);assert(bex.sold===12&&G.S.stats.sold.darkova===2,'dárková krabice: 2 krabice = 12 ks: '+bex.sold);
// stará uložená pozice bez e.rec
G.save();const o=JSON.parse(localStorage.getItem('spicky-save'));for(const e of o.ents)delete e.rec;localStorage.setItem('spicky-save',JSON.stringify(o));
assert(G.load(),'load staré pozice');run(2);assert([...G.S.ents.values()].filter(e=>e.k==='machine').every(e=>G.BUILD[e.type].rec),'stroje bez receptu používají výchozí');
// render nespadne
G.render();
// Banka / půjčky
{const S=G.S;const m0=S.money;S.money=100;
 assert(G.takeLoan(0)&&S.money===5100&&S.loan&&S.loan.debt===5500,'půjčka připíše peníze a dluh s úrokem');
 assert(!G.takeLoan(1),'druhá půjčka současně nejde');
 const inst=S.loan.inst;S.loan.next=S.time+1;S.money=10000;run(1.1);
 assert(S.loan.debt===5500-inst,'automatická splátka po minutě: '+inst);
 S.money=0;S.loan.next=S.time+1;const d1=S.loan.debt;run(1.1);
 assert(S.loan.debt>d1&&S.loan.late===1,'bez peněz naskočí penále: '+(S.loan.debt-d1));
 S.money=20000;assert(G.repay(1000)&&S.money===19000,'ruční splátka 1 000');
 assert(G.repay(null)&&S.loan===null,'splacení celého dluhu');
 assert(G.takeLoan(0),'po splacení lze půjčit znovu');
 G.save();assert(G.load()&&G.S.loan&&G.S.loan.debt===5500,'save/load zachová půjčku');
 G.toggleZak();G.refreshZak();G.refreshTop();G.closeAll();assert(G.UI.lastHtml.zak.includes('Splatit vše'),'panel Banka s aktivní půjčkou se vykreslí');G.S.money=99999;G.repay(null);G.S.money=m0;}
// UI panely pro všechny druhy entit
G.refreshHotbar();G.refreshTop();for(const g in G.PRODUCT){G.UI.recTab=g;G.refreshRec()}G.toggleZak();G.refreshZak();G.closeAll();
for(const e of G.S.ents.values()){G.openEnt(e);G.refreshEnt()}G.closeAll();
assert(true,'UI panely se vykreslí bez chyby');
console.log(fails?'CHYBY: '+fails:'VŠE OK');
