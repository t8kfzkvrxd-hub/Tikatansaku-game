import subprocess, tempfile, os, time, socket, json, struct, urllib.request, base64, argparse, re, sys
from pathlib import Path

parser=argparse.ArgumentParser(description="Run all HTML regressions in an isolated Chrome profile")
parser.add_argument('--url',default='http://127.0.0.1:8874')
parser.add_argument('--profiles',default='new,legacy,complete')
parser.add_argument('--files',default='')
parser.add_argument('--output',default='/private/tmp/v035-regression-matrix.json')
args=parser.parse_args()
profile=tempfile.mkdtemp(prefix='tikatansaku-regression-')
root=Path(__file__).resolve().parents[1]
results=[]
p=subprocess.Popen(['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','--headless','--autoplay-policy=no-user-gesture-required','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9357','--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for i in range(60):
  try:
   tabs=[t for t in json.load(urllib.request.urlopen('http://127.0.0.1:9357/json')) if t['type']=='page']
   if tabs:break
  except Exception:time.sleep(.1)
 url=tabs[0]['webSocketDebuggerUrl'].split('9357')[1]
 s=socket.create_connection(('127.0.0.1',9357));s.settimeout(180)
 s.sendall(('GET '+url+' HTTP/1.1\r\nHost: localhost:9357\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: '+base64.b64encode(os.urandom(16)).decode()+'\r\nSec-WebSocket-Version: 13\r\n\r\n').encode())
 data=b''
 while not data.endswith(b'\r\n\r\n'):data+=s.recv(1)
 def read(n):
  b=b''
  while len(b)<n:
   chunk=s.recv(n-len(b))
   if not chunk:raise RuntimeError('Browser connection closed')
   b+=chunk
  return b
 serial=0
 def call(method,params={}):
  global serial
  serial+=1;payload=json.dumps({'id':serial,'method':method,'params':params}).encode();mask=os.urandom(4);n=len(payload)
  header=bytes([129,128+n]) if n<126 else bytes([129,254])+struct.pack('!H',n) if n<65536 else bytes([129,255])+struct.pack('!Q',n)
  s.sendall(header+mask+bytes(b^mask[i%4] for i,b in enumerate(payload)))
  while True:
   a,b=read(2);size=b&127
   if size==126:size=struct.unpack('!H',read(2))[0]
   elif size==127:size=struct.unpack('!Q',read(8))[0]
   packet=json.loads(read(size))
   if packet.get('id')==serial:return packet
 def js(expr):
  result=call('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True})
  if 'exceptionDetails' in result.get('result',{}):raise RuntimeError(str(result))
  return result['result']['result'].get('value')
 call('Page.enable')
 for save_profile in args.profiles.split(','):
  for file in sorted(root.glob('test*.html')):
   if args.files and file.name not in args.files.split(','):continue
   # Let the previous test restore its backup before clearing this isolated origin.
   call('Page.navigate',{'url':args.url+'/index.html'})
   time.sleep(.15)
   js('localStorage.clear()')
   call('Page.navigate',{'url':args.url+'/'+file.name+'?saveProfile='+save_profile})
   text='';terminal=False
   for tick in range(480):
    time.sleep(.25)
    text=js("document.getElementById('results')?.textContent||document.getElementById('result')?.textContent||''") or ''
    failed=bool(re.search(r'(?m)^FAIL|^ERROR|"pass":\s*false',text))
    terminal=failed or 'ALL TESTS PASSED' in text
    payload=text.removeprefix('PASS\n').strip()
    if not terminal and payload.startswith(('[','{')):
     try:
      parsed=json.loads(payload)
      terminal=bool(parsed)
     except ValueError:pass
    if terminal:break
   fixtures=js('window.fixtureResults||[]')
   fixture_ok=bool(fixtures) and all(r.get('pass') and r.get('mode')==save_profile for r in fixtures)
   row={'file':file.name,'profile':save_profile,'pass':terminal and not failed and fixture_ok,
        'timeout':not terminal,'fixture':fixtures,'text':text}
   results.append(row)
   Path(args.output).write_text(json.dumps(results,ensure_ascii=False,indent=2))
   print(save_profile,file.name,'PASS' if row['pass'] else 'FAIL',text[-130:].replace('\n',' '),flush=True)
 print('SUMMARY',len(results),'PASS',sum(r['pass'] for r in results),'FAIL',sum(not r['pass'] for r in results),flush=True)
finally:
 p.terminate();p.wait(timeout=10)
sys.exit(0 if results and all(r['pass'] for r in results) else 1)
