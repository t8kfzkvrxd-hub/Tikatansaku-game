"""Assemble existing sheet pixels; no synthesis or source modification."""
from pathlib import Path
import runpy,json,hashlib
ROOT=Path(__file__).resolve().parent.parent
H=runpy.run_path(str(ROOT/'metadata/extract-parts.py'))
S={'face':'8f628a48-7268-4610-9f6b-0a3beaebb0ac.png','hair':'080505a1-44bf-4da3-96de-7027fc3ec095.png','body':'69572a14-6a05-4ee8-ba91-0d6cd50564f3.png','arms':'ef1ec64a-c9a8-4054-a225-6d698f667f47.png','legs':'064b4d12-e79a-4b19-8557-d7c99cf5d124.png','old':'327cdbfe-255d-4b18-83ee-059ba56af447.png','hand':'bdb578db-f75a-44b1-b7c1-002bc30500b4.png'}
S['finehair']='dfa57b11-2f51-4f7c-8d6b-09413bde4377.png'
# file, source, rectangle, display rectangle, layer. Left/right is character-relative.
PARTS=[
 ('hair/back-hair.png','hair',[492,253,641,740],[182,60,450,690],0),
 ('outfit/coat-right.png','body',[35,58,275,903],[180,512,181,680],10),
 ('outfit/coat-left.png','body',[1224,58,284,903],[440,512,181,680],10),
 ('legs/thigh-right.png','legs',[996,24,209,399],[307,561,101,255],20),
 ('legs/thigh-left.png','legs',[1273,23,220,405],[407,561,101,255],20),
 ('legs/boot-right.png','legs',[476,509,174,498],[299,778,117,350],21),
 ('legs/boot-left.png','legs',[888,509,174,498],[399,778,117,350],21),
 ('outfit/skirt.png','legs',[58,18,506,486],[247,511,306,285],30),
 ('body/arm-right.png','arms',[8,62,323,800],[195,280,163,414],35),
 ('body/arm-left.png','arms',[657,69,313,863],[449,280,157,425],35),
 ('body/hand-right.png','hand',[35,378,91,133],[223,648,54,79],36),
 ('body/hand-left.png','arms',[1318,478,198,369],[530,648,60,100],36),
 ('body/torso.png','body',[601,49,331,559],[277,242,249,383],40),
 ('face/face-base.png','face',[20,15,185,250],[307,45,185,250],38),
 ('face/eye-right.png','face',[202,19,110,69],[335,159,55,35],46),
 ('face/eye-left.png','face',[320,19,103,69],[412,159,52,35],46),
 ('face/eyebrow-right.png','old',[25,436,108,49],[338,145,49,22],47),
 ('face/eyebrow-left.png','old',[174,436,110,49],[414,145,49,22],47),
 ('face/mouth.png','old',[910,501,92,56],[385,213,31,19],47),
 ('hair/bangs.png','hair',[0,12,440,447],[272,14,266,271],50),
 ('hair/side-right.png','finehair',[649,12,116,296],[295,117,64,266],51),
 ('hair/side-left.png','finehair',[772,13,97,292],[445,117,57,266],51),
 ('accessories/ribbon.png','hair',[1247,645,262,367],[460,91,85,119],49),
]
POLYGONS={
 'hair/back-hair.png':[(760,253),(890,270),(940,480),(985,590),(1118,746),(1133,993),(492,993),(492,748),(557,628),(614,511),(650,350)],
 'hair/bangs.png':[(0,12),(440,12),(440,390),(400,420),(310,447),(274,419),(168,415),(133,459),(0,459)]
}
def inside(x,y,points):
 result=False
 j=len(points)-1
 for i,(px,py) in enumerate(points):
  qx,qy=points[j]
  if (py>y)!=(qy>y) and x<(qx-px)*(y-py)/(qy-py)+px:result=not result
  j=i
 return result
def main():
 decoded={k:H['decode'](ROOT/'source'/v) for k,v in S.items()}
 sources=[dict(file='source/'+p.name,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),used=p.name in S.values()) for p in sorted((ROOT/'source').glob('*.png'))]
 config=dict(version=1,status='official-static-v1',canvas=dict(width=800,height=1200),sideConvention='character-relative',sources=sources,parts=[])
 for file,key,rect,display,z in PARTS:
  x,y,w,h=rect
  sw,sh,rows=decoded[key]
  assert 0<=x<x+w<=sw and 0<=y<y+h<=sh
  crop=[bytearray(r[x*4:(x+w)*4]) for r in rows[y:y+h]]
  polygon=POLYGONS.get(file)
  if polygon:
   for cy,row in enumerate(crop):
    for cx in range(w):
     if not inside(x+cx+.5,y+cy+.5,polygon):row[cx*4:cx*4+4]=b'\0'*4
  pad=16;ow,oh=w+32,h+32
  output=[bytes(ow*4)]*16+[bytes(64)+bytes(r)+bytes(64) for r in crop]+[bytes(ow*4)]*16
  data=H['png'](ow,oh,output)
  H['write_new'](ROOT/'official'/file,data)
  assert H['decode'](ROOT/'official'/file)==(ow,oh,output)
  dx,dy,dw,dh=display
  config['parts'].append(dict(file=file,category=file.split('/')[0],sourceFile='source/'+S[key],sourceRect=dict(x=x,y=y,width=w,height=h),sourcePolygon=polygon,width=ow,height=oh,x=dx-pad*dw/w,y=dy-pad*dh/h,displayWidth=dw*ow/w,displayHeight=dh*oh/h,zIndex=z,transformOrigin=dict(x=.5,y=.08),sha256=hashlib.sha256(data).hexdigest(),pixelPolicy='source RGBA unchanged inside selection; transparent padding/outside polygon'))
 for s in sources:assert hashlib.sha256((ROOT/s['file']).read_bytes()).hexdigest()==s['sha256']
 print(json.dumps(config,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
