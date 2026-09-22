"""Export anonymous team differences from the existing Deadlock collection."""
import argparse
import json
from collections import defaultdict
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--source-dir',required=True);a=p.parse_args();source=Path(a.source_dir)
metrics=['net_worth','player_damage','boss_damage','kills','denies','gold_treasure','player_healing','damage_mitigated']
groups={}
for line in (source/'urn_rows.jsonl').open(encoding='utf-8'):
 r=json.loads(line);key=r['match_id'];g=groups.setdefault(key,{'teams':{},'date':r['start_time'],'duration':r['duration_s']})
 t=g['teams'].setdefault(r['team'],{'n':0,'win':r['win'],**dict.fromkeys(metrics,0)})
 t['n']+=1
 for m in metrics:t[m]+=r.get(m) or 0
checkpoints=defaultdict(lambda:defaultdict(lambda:defaultdict(int)))
for line in (source/'urn_checkpoints.jsonl').open(encoding='utf-8'):
 r=json.loads(line)
 for sec in [600,900,1200]:
  if r.get(f'nw_{sec}') is not None:
   t=checkpoints[r['match_id']][r['team']];t[f'nw_{sec}']+=r[f'nw_{sec}'];t[f'n_{sec}']+=1
rows=[]
for mid,g in groups.items():
 if set(g['teams'])!={'Team0','Team1'}:continue
 x,y=g['teams']['Team0'],g['teams']['Team1']
 if x['n']!=6 or y['n']!=6 or x['win']==y['win']:continue
 row={'id':mid,'date':g['date'],'duration':g['duration'],'win':x['win'],**{m:round(x[m]-y[m],2) for m in metrics}}
 for sec in [600,900,1200]:
  a,b=checkpoints[mid]['Team0'],checkpoints[mid]['Team1']
  row[f'nw_{sec}']=a[f'nw_{sec}']-b[f'nw_{sec}'] if a[f'n_{sec}']==b[f'n_{sec}']==6 else None
 rows.append(row)
rows.sort(key=lambda r:r['date'])
output=Path(__file__).resolve().parents[1]/'examples/portfolio/data';output.mkdir(parents=True,exist_ok=True)
(output/'matches.json').write_text(json.dumps({'source':'Collected Deadlock public match statistics; existing Eternus research census','scope':'Complete six-versus-six matches only. Team differences, no account identifiers. Historical May-June 2026 sample, not live data.','first':rows[0]['date'],'last':rows[-1]['date'],'matches':rows},separators=(',',':')),encoding='utf-8')
print(len(rows),'complete real matches exported')
