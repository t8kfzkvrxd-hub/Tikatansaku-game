"""Pixel-preserving candidate extraction from the latest sheet."""
import runpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
H=runpy.run_path(str(ROOT/'metadata/extract-parts.py'))
NAME='8f628a48-7268-4610-9f6b-0a3beaebb0ac.png'
CROPS=[
 ('face/face-base.png',20,15,185,250),
 ('face/eye-left-half.png',418,17,95,70),
 ('face/eye-right-half.png',513,17,95,70),
 ('face/eye-left-closed.png',418,90,95,67),
 ('face/eye-right-closed.png',513,90,95,67),
 ('hair/bangs.png',598,10,243,250),
 ('hair/back-hair-center.png',1072,8,288,393),
 ('body/torso.png',4,340,257,355),
]
def main():
 original=ROOT/NAME
 raw=original.read_bytes()
 H['write_new'](ROOT/'source'/NAME,raw)
 w,h,rows=H['decode'](original)
 alpha=b''.join(r[3::4] for r in rows)
 d=json.loads((ROOT/'metadata/parts.json').read_text())
 source=dict(file='source/'+NAME,foundAt=NAME,category='顔・髪・上半身・衣装・下半身・小物の追加シート',format='PNG',width=w,height=h,hasAlpha=True,transparentPixels=alpha.count(0),alphaMin=min(alpha),alphaMax=max(alpha),sha256=hashlib.sha256(raw).hexdigest())
 assert source['sha256'] not in [s['sha256'] for s in d['sources']], 'Duplicate original'
 d['sources'].append(source)
 rejected=[]
 for file,x,y,cw,ch in CROPS:
  crop=[r[4*x:4*(x+cw)] for r in rows[y:y+ch]]
  edge=list(crop[0][3::4])+list(crop[-1][3::4])+[r[3] for r in crop]+[r[-1] for r in crop]
  if max(edge)>24:
   rejected.append(file)
   print('REJECT',file,max(edge),flush=True)
   continue
  ow,oh=cw+32,ch+32
  out=[bytes(ow*4)]*16+[bytes(64)+r+bytes(64) for r in crop]+[bytes(ow*4)]*16
  image=H['png'](ow,oh,out)
  H['write_new'](ROOT/file,image)
  assert H['decode'](ROOT/file)==(ow,oh,out)
  d['parts'].append(dict(file=file,category=file.split('/')[0],sourceFile=source['file'],sourceRect=dict(x=x,y=y,width=cw,height=ch),sourceX=x,sourceY=y,sourceWidth=cw,sourceHeight=ch,width=ow,height=oh,padding=16,x=None,y=None,z=None,transformOriginX=None,transformOriginY=None,sha256=hashlib.sha256(image).hexdigest()))
  print('ACCEPT',file,flush=True)
 d['latestRejectedCandidates']=rejected
 assert hashlib.sha256(original.read_bytes()).hexdigest()==source['sha256']
 print(json.dumps(d,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
