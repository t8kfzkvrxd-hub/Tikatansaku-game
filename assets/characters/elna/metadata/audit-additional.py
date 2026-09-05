"""Audit additional originals and extract only reviewed transparent rectangles."""
from pathlib import Path
import hashlib
import json
import runpy

ROOT=Path(__file__).resolve().parent.parent
helpers=runpy.run_path(str(ROOT/'metadata/extract-parts.py'))
decode,png,write_new=(helpers[k] for k in ('decode','png','write_new'))
ADDITIONAL=[
 ('5030bea6-17b6-4b61-bae8-6f8bf5f64191.png','補完パーツ',False),
 ('af54d04c-f0b5-4061-88c8-0af9aa0024d4.png','上半身／腕／衣装・手ポーズ',False),
 ('bd9695e3-89e9-4b5b-ad83-0d80d2918b9f (2).png','髪・顔／表情',True),
 ('d4d6f4b9-1af3-4ed8-9396-aa99e2642d1a.png','補助エフェクト・追加表情・手ポーズ',False),
 ('ec8966f6-a34d-457a-a3c3-faf964922b12.png','顔／開眼・半目・閉眼・口差分',True),
 ('f6ef9a54-2da8-4a40-96f3-315b38ba7a2a.png','追加表情・下半身・衣装・補完',False),
]
CANDIDATES=[
 ('face/eye-left-half.png',4,539,568,203,108),
 ('face/eye-right-half.png',4,792,568,229,108),
 ('face/eye-left-closed.png',4,1065,596,184,79),
 ('face/eye-right-closed.png',4,1326,596,187,79),
 ('face/mouth-sad.png',4,1357,890,134,53),
 ('hair/bangs.png',2,5,87,244,450),
 ('hair/side-hair-left.png',2,250,87,99,443),
 ('hair/side-hair-right.png',2,351,87,102,443),
 ('hair/braid.png',2,967,94,127,432),
 ('hair/ribbon-main.png',2,1042,97,222,174),
]

def main():
 report=json.loads((ROOT/'metadata/parts.json').read_text())
 decoded=[]
 for name,category,isolated in ADDITIONAL:
  original=ROOT/name
  target=ROOT/'source'/name
  raw=original.read_bytes() if original.exists() else target.read_bytes()
  write_new(target,raw)
  w,h,rows=decode(target)
  decoded.append((w,h,rows))
  alpha=b''.join(r[3::4] for r in rows)
  entry=dict(file='source/'+name,foundAt=name,category=category,format='PNG',width=w,height=h,hasAlpha=True,transparentPixels=alpha.count(0),alphaMin=min(alpha),alphaMax=max(alpha),sha256=hashlib.sha256(raw).hexdigest(),isolatedBackground=isolated)
  report['sources']=[s for s in report['sources'] if s['file']!=entry['file']]+[entry]
 rejected=[]
 for file,index,x,y,w,h in CANDIDATES:
  sw,sh,rows=decoded[index]
  assert 0<=x<x+w<=sw and 0<=y<y+h<=sh
  crop=[r[x*4:(x+w)*4] for r in rows[y:y+h]]
  edge=list(crop[0][3::4])+list(crop[-1][3::4])+[r[3] for r in crop]+[r[-1] for r in crop]
  if max(edge)>24:
   rejected.append(dict(file=file,reason='輪郭／隣接素材が矩形端にかかる',edgeAlphaMax=max(edge)))
   print('REJECT',file,max(edge),flush=True)
   continue
  pad=16
  width,height=w+pad*2,h+pad*2
  blank=bytes(width*4)
  output=[blank]*pad+[bytes(pad*4)+r+bytes(pad*4) for r in crop]+[blank]*pad
  image=png(width,height,output)
  write_new(ROOT/file,image)
  assert decode(ROOT/file)==(width,height,output)
  part=dict(file=file,sourceFile='source/'+ADDITIONAL[index][0],sourceX=x,sourceY=y,sourceWidth=w,sourceHeight=h,width=width,height=height,padding=pad,sha256=hashlib.sha256(image).hexdigest(),recommendedZIndex=None,recommendedTransformOrigin=None)
  report['parts']=[p for p in report['parts'] if p['file']!=file]+[part]
  print('ACCEPT',file,flush=True)
 for part in report['parts']:
  part.update(category=part['file'].split('/')[0],sourceRect=dict(x=part['sourceX'],y=part['sourceY'],width=part['sourceWidth'],height=part['sourceHeight']),x=None,y=None,z=None,transformOriginX=None,transformOriginY=None)
 report['rejectedAdditionalCandidates']=rejected
 report['staticRestorationStatus']='blocked: isolated face/torso/joints and matched assembly still missing'
 report['animationReady']=False
 for source in report['sources']:
  assert hashlib.sha256((ROOT/source['file']).read_bytes()).hexdigest()==source['sha256']
 assert len({p['sha256'] for p in report['parts']})==len(report['parts'])
 print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__': main()
