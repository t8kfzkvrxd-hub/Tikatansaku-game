"""Lossless rectangular extraction; original RGBA pixels remain unchanged."""
from pathlib import Path
import hashlib
import json
import struct
import zlib

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [
    ('327cdbfe-255d-4b18-83ee-059ba56af447.png', '顔・目・口差分シート'),
    ('bdb578db-f75a-44b1-b7c1-002bc30500b4.png', '腕・手・衣装パーツシート'),
    ('cbb15781-45b4-481f-ac92-7a36284e45b2.png', '正面全身ベース'),
    ('dfa57b11-2f51-4f7c-8d6b-09413bde4377.png', '髪パーツシート'),
    ('e2cf96f5-5013-4c65-bb05-57dabadaecce.png', '脚・ブーツ・下半身パーツシート'),
    ('elna-base.png', 'キービジュアル／キャラクターデザイン参考'),
]
# x, y, width, height in the original sheet. Left/right follows sheet labels.
CROPS = [
    ('face/eyebrow-left.png',0,25,436,108,49),
    ('face/eyebrow-right.png',0,174,436,110,49),
    ('face/eye-left-open.png',0,22,539,115,80),
    ('face/eye-right-open.png',0,174,539,116,80),
    ('face/mouth-closed.png',0,910,501,92,56),
    ('face/mouth-small.png',0,1054,499,55,57),
    ('face/mouth-medium.png',0,1174,494,68,66),
    ('face/mouth-smile.png',0,1290,494,96,66),
    ('face/mouth-surprised.png',0,1437,491,54,68),
    ('hair/ribbon-left.png',3,1316,16,91,307),
    ('body/hand-left.png',1,35,378,91,133),
    ('legs/boot-left.png',4,439,736,124,274),
    ('legs/boot-right.png',4,593,735,128,275),
    ('legs/thigh-pouch.png',4,1035,486,102,149),
    ('legs/underskirt.png',4,737,252,299,102),
]

def decode(path):
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    pos, compressed = 8, bytearray()
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos+4])[0]
        kind, chunk = data[pos+4:pos+8], data[pos+8:pos+8+length]
        assert zlib.crc32(kind+chunk) & 0xffffffff == struct.unpack('>I',data[pos+8+length:pos+12+length])[0]
        if kind == b'IHDR':
            width,height,depth,color,_,_,interlace = struct.unpack('>IIBBBBB',chunk)
        if kind == b'IDAT': compressed.extend(chunk)
        pos += length+12
    assert (depth,color,interlace) == (8,6,0)
    raw = zlib.decompress(compressed)
    stride = width*4
    assert len(raw) == height*(stride+1)
    rows, previous = [], bytearray(stride)
    for y in range(height):
        offset = y*(stride+1)
        mode = raw[offset]
        row = bytearray(raw[offset+1:offset+1+stride])
        for x in range(stride):
            a = row[x-4] if x>=4 else 0
            b = previous[x]
            c = previous[x-4] if x>=4 else 0
            if mode == 1: predictor = a
            elif mode == 2: predictor = b
            elif mode == 3: predictor = (a+b)//2
            elif mode == 4:
                p=a+b-c
                pa,pb,pc=abs(p-a),abs(p-b),abs(p-c)
                predictor=a if pa<=pb and pa<=pc else b if pb<=pc else c
            else:
                assert mode == 0
                predictor=0
            row[x]=(row[x]+predictor)&255
        rows.append(bytes(row))
        previous=row
    return width,height,rows

def write_new(path,data):
    if path.exists():
        assert path.read_bytes() == data, f'Refusing overwrite: {path}'
    else:
        path.parent.mkdir(parents=True,exist_ok=True)
        with path.open('xb') as stream: stream.write(data)

def png(width,height,rows):
    def chunk(kind,data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(b'\0'+r for r in rows)))+chunk(b'IEND',b'')

def main():
    sources, decoded = [], []
    for name,category in SOURCES:
        original=ROOT.parent/name
        saved=ROOT/'source'/name
        data=original.read_bytes() if original.exists() else saved.read_bytes()
        write_new(saved,data)
        w,h,rows=decode(saved)
        decoded.append((w,h,rows))
        alpha=b''.join(r[3::4] for r in rows)
        sources.append(dict(file='source/'+name,foundAt='../'+name,category=category,format='PNG',width=w,height=h,hasAlpha=True,transparentPixels=alpha.count(0),alphaMin=min(alpha),alphaMax=max(alpha),sha256=hashlib.sha256(data).hexdigest()))
    reference='base/elna-reference.png'
    write_new(ROOT/reference,(ROOT/sources[2]['file']).read_bytes())
    parts=[]
    hashes=set()
    for file,index,x,y,w,h in CROPS:
        sw,sh,rows=decoded[index]
        assert x>=0 and y>=0 and x+w<=sw and y+h<=sh
        selected=[r[x*4:(x+w)*4] for r in rows[y:y+h]]
        edge=list(selected[0][3::4])+list(selected[-1][3::4])+[r[3] for r in selected]+[r[-1] for r in selected]
        print(file,'edge-alpha-max',max(edge),flush=True)
        assert max(edge)<=24, 'Visible contour or adjacent content at crop boundary'
        pad=16
        width,height=w+pad*2,h+pad*2
        blank=bytes(width*4)
        output=[blank]*pad+[bytes(pad*4)+r+bytes(pad*4) for r in selected]+[blank]*pad
        image=png(width,height,output)
        digest=hashlib.sha256(image).hexdigest()
        assert digest not in hashes
        hashes.add(digest)
        write_new(ROOT/file,image)
        rw,rh,readback=decode(ROOT/file)
        assert (rw,rh)==(width,height) and readback==output
        parts.append(dict(file=file,sourceFile=sources[index]['file'],sourceX=x,sourceY=y,sourceWidth=w,sourceHeight=h,width=width,height=height,padding=pad,recommendedZIndex=None,recommendedTransformOrigin=None,sha256=digest))
    report=dict(sources=sources,reference=dict(file=reference,sourceFile=sources[2]['file'],note='原本とバイト同一の比較用全身画像。分離ベースではない'),parts=parts,animationReady=False,notes=['原本RGBとアルファを無変更で矩形抽出。16px透明余白。','左右はラベル準拠。髪の左右と深度は未確定。','z-indexとtransform-originは組み合わせ未検証のためnull。'])
    write_new(ROOT/'metadata/parts.json',(json.dumps(report,ensure_ascii=False,indent=2)+'\n').encode())
    for source in sources:
        assert hashlib.sha256((ROOT/source['file']).read_bytes()).hexdigest()==source['sha256']
        original=ROOT/source['foundAt']
        if original.exists(): assert hashlib.sha256(original.read_bytes()).hexdigest()==source['sha256']

if __name__ == '__main__': main()
