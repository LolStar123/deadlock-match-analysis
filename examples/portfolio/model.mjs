export const metrics={nw_600:{label:'souls at 10 minutes',unit:'souls',step:1000,limit:20000,checkpoint:true},nw_900:{label:'souls at 15 minutes',unit:'souls',step:2000,limit:40000,checkpoint:true},nw_1200:{label:'souls at 20 minutes',unit:'souls',step:3000,limit:60000,checkpoint:true},net_worth:{label:'final net worth',unit:'souls',step:5000,limit:100000},player_damage:{label:'hero damage',unit:'damage',step:10000,limit:200000},boss_damage:{label:'objective damage',unit:'damage',step:5000,limit:60000},kills:{label:'kills',unit:'kills',step:2,limit:50},denies:{label:'denies',unit:'denies',step:2,limit:50},gold_treasure:{label:'urn treasure',unit:'souls',step:2000,limit:40000},player_healing:{label:'healing',unit:'healing',step:2000,limit:40000}};
export function interval(wins,n){if(!n)return null;const z=1.959963984540054,p=wins/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [c-h,c+h];}
export function analyse(rows,metric,minimum=0,minMinutes=0,maxMinutes=120){
 if(!metrics[metric]||!Number.isFinite(minimum)||minimum<0)throw Error('Invalid metric or threshold');
 const eligible=rows.filter(r=>Number.isFinite(r[metric])&&r[metric]!==0&&r.duration/60>=minMinutes&&r.duration/60<=maxMinutes).map(r=>({...r,lead:Math.abs(r[metric]),leaderWon:r[metric]>0?!!r.win:!r.win}));
 const selected=eligible.filter(r=>r.lead>=minimum),wins=selected.filter(r=>r.leaderWon).length;
 const max=Math.max(metrics[metric].step,...eligible.map(r=>r.lead));const width=max/12;
 const bins=Array.from({length:12},(_,i)=>{const sample=eligible.filter(r=>r.lead>=i*width&&(i===11||r.lead<(i+1)*width)),w=sample.filter(r=>r.leaderWon).length;return{lo:i*width,hi:(i+1)*width,n:sample.length,wins:w,p:sample.length?w/sample.length:null,ci:interval(w,sample.length)}});
 return{eligible:eligible.length,selected,wins,n:selected.length,p:selected.length?wins/selected.length:null,ci:interval(wins,selected.length),bins};
}
