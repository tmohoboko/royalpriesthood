"""Restore approved originals from existing hosting, verifying decoded RGBA pixels."""
from pathlib import Path
import json,subprocess,hashlib,urllib.parse
for row in json.loads(Path('qa/catalogue-recovery-manifest.json').read_text()):
 p=Path(row['path']);p.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(['curl','--fail','--silent','--show-error','--retry','3','--max-time','180',urllib.parse.quote(row['url'],safe=':/'),'--output',str(p)],check=True)
 pixels=subprocess.check_output(['convert',str(p),'-depth','8','RGBA:-'])
 assert hashlib.sha256(pixels).hexdigest()==row['pixels_sha256'], 'Approved image pixel mismatch: '+str(p)
 print('Verified original',p,flush=True)
