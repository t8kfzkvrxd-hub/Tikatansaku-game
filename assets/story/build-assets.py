"""Lossless source-sheet separation. Run with Pillow and NumPy; no AI/redrawing.

Seams follow transparent/near-transparent fringe pixels, not equal thirds. Visible RGBA pixels are assigned
once, unchanged, to a padded canvas. Refuses seams through visible artwork.
"""
from pathlib import Path
import hashlib
import json
import shutil
import sys
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/story'
SHEETS = [
 ('エルナ立ち絵1.png','elna',['normal','smile','worried']),
 ('エルナ立ち絵２.png','elna',['serious','sad','fear']),
 ('エルナ立ち絵３.png','elna',['empty','cry','angry']),
 ('player立ち絵１.png','player',['normal','smile','confused']),
 ('player立ち絵２.png','player',['serious','angry','shock']),
 ('player立ち絵３.png','player',['sad','fear','empty']),
 ('酒場主人立ち絵.png','tavern_master',['normal','serious','exasperated']),
 ('鍛冶場立ち絵.png','blacksmith',['normal','confident','serious']),
 ('道具屋立ち絵.png','item_shopkeeper',['normal','smile','worried']),
]
BACKGROUNDS = {'酒場背景.png':'tavern','鍛冶場背景.png':'forge',
               '倉庫背景.png':'warehouse','道具屋背景.png':'item-shop'}
def digest(path):
 return hashlib.sha256(path.read_bytes()).hexdigest()

def seam(alpha, fraction):
 h,w=alpha.shape
 lo,hi=int(w*(fraction-.12)),int(w*(fraction+.12))
 visible=(alpha[:,lo:hi]>0)
 # Small centering cost selects a stable transparent path between silhouettes.
 cost=(alpha[:,lo:hi].astype(float)/255)**2*1e7+np.abs(np.arange(lo,hi)-w*fraction)*.0001
 score=cost[0].copy(); history=[]
 for row in cost[1:]:
  candidates=np.stack([np.roll(score,k) for k in range(-4,5)])
  for i,k in enumerate(range(-4,5)):
   if k<0:candidates[i,k:]=np.inf
   if k>0:candidates[i,:k]=np.inf
  best=candidates.argmin(axis=0)
  history.append(best-4)
  score=row+candidates[best,np.arange(hi-lo)]
 x=int(score.argmin()); result=[x+lo]
 for choices in history[::-1]:
  x-=int(choices[x]);result.append(x+lo)
 result=np.array(result[::-1])
 crossed=alpha[np.arange(h),result]
 if np.any(crossed>3):
  raise ValueError(f'Unsafe seam {fraction}: {np.count_nonzero(crossed)} visible pixels')
 return result

def main():
 sources={}; parts=[]; pending=[]; rejected=[]
 for filename,character,expressions in SHEETS:
  path=ROOT/'assets'/filename; before=digest(path)
  im=Image.open(path); rgba=np.array(im.convert('RGBA')); h,w=rgba.shape[:2]
  alpha=rgba[:,:,3]
  try:left=seam(alpha,1/3)
  except ValueError:
   if filename!='player立ち絵２.png':raise
   left=np.full(h,w//3)
   rejected.extend(['characters/player/serious.png','characters/player/angry.png'])
  right=seam(alpha,2/3)
  masks=[np.arange(w)[None,:]<left[:,None],
         (np.arange(w)[None,:]>=left[:,None])&(np.arange(w)[None,:]<right[:,None]),
         np.arange(w)[None,:]>=right[:,None]]
  sources[filename]={'sha256':before,'width':w,'height':h,'format':im.format,
                     'mode':im.mode,'alphaRange':list(im.getchannel('A').getextrema())}
  for expression,region in zip(expressions,masks):
   if f'characters/{character}/{expression}.png' in rejected:continue
   selected=region&(alpha>0); ys,xs=np.where(selected)
   x0,x1,y0,y1=int(xs.min()),int(xs.max()+1),int(ys.min()),int(ys.max()+1)
   crop=rgba[y0:y1,x0:x1].copy();crop[~region[y0:y1,x0:x1]]=0
   pending.append((character,expression,crop,selected,rgba))
   parts.append({'file':f'characters/{character}/{expression}.png','sourceFile':'assets/'+filename,
      'sourceRect':[x0,y0,x1-x0,y1-y0],'sourceType':'transparent-seam-crop',
      'originalEdgeClipped':bool(x0==0 or x1==w or y0==0 or y1==h)})
  assert digest(path)==before
  print(filename,'checked (player serious/angry excluded where joined)',flush=True)
 if '--check' in sys.argv:return
 # Same source scale, full height and padded canvas across all 27 expressions.
 width=max(p[2].shape[1] for p in pending)+32
 height=max(p[2].shape[0] for p in pending)+32
 for part,(character,expression,crop,selected,rgba) in zip(parts,pending):
  h,w=crop.shape[:2];dx=(width-w)//2;dy=height-16-h
  canvas=np.zeros((height,width,4),dtype=np.uint8);canvas[dy:dy+h,dx:dx+w]=crop
  path=OUT/part['file'];path.parent.mkdir(parents=True,exist_ok=True)
  Image.fromarray(canvas).save(path)
  reopened=np.array(Image.open(path));active=reopened[:,:,3]>0
  assert np.array_equal(reopened[active],rgba[selected])
  assert active.sum()==selected.sum()
  assert not reopened[:16,:,3].any() and not reopened[-16:,:,3].any()
  assert not reopened[:,:16,3].any() and not reopened[:,-16:,3].any()
  part.update(width=width,height=height,paddingOffset=[dx,dy],pixelExact=True,sha256=digest(path))
 for filename,name in BACKGROUNDS.items():
  path=ROOT/'assets'/filename;before=digest(path); im=Image.open(path)
  dest=OUT/'backgrounds'/f'{name}.png';dest.parent.mkdir(parents=True,exist_ok=True)
  shutil.copyfile(path,dest)
  assert digest(path)==digest(dest)==before
  sources[filename]={'sha256':before,'width':im.width,'height':im.height,'format':im.format,'mode':im.mode}
 for filename,info in sources.items():assert digest(ROOT/'assets'/filename)==info['sha256']
 (OUT/'manifest.json').write_text(json.dumps({'sources':sources,'parts':parts,'rejected':rejected,
  'seamPolicy':'Only alpha <= 3 fringe may cross a seam; RGBA retained unchanged. No opaque contours cut.'},ensure_ascii=False,indent=2)+'\n')
 print(f'PASS: {len(parts)} pixel-identical transparent portraits, canvas {width}x{height}; 4 backgrounds; originals unchanged')

if __name__=='__main__':
 main()
 if '--check' not in sys.argv:
  import runpy
  runpy.run_path(str(OUT/'build-player-singles.py'),run_name='__main__')
