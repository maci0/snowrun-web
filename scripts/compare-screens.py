#!/usr/bin/env python3
"""Compare captured Android content with browser captures, without masking differences."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import subprocess
import numpy as np
from PIL import Image, ImageDraw

CROP = (0, 136, 1080, 2337)
SIZE = (411, 838)
NAMES = ['onboarding-skill','onboarding-demo','onboarding-route','onboarding-account','onboarding-done','home','home-tooltip','yuki-menu-journal-tip','yuki-menu-friends-tip','yuki-menu-rewards-tip','login','sign_up','navigate','navigate-mode','resort-search','route-preview','forgot_password']

def metrics(a, b):
    assert a.shape == b.shape and a.ndim == 3 and a.shape[2] == 3
    delta = np.abs(a.astype(np.int16) - b.astype(np.int16))
    maximum = delta.max(axis=2)
    return {'exact_mismatch_percent': float(np.mean(maximum > 0)*100),
            'over_16_mismatch_percent': float(np.mean(maximum > 16)*100),
            'mean_absolute_channel_error': float(delta.mean()),
            'max_channel_error': int(delta.max()),
            'exact_pass': bool(not np.any(delta))}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--native',type=Path,default=Path('../analysis/screens'))
    p.add_argument('--web',type=Path,default=Path('../analysis/web-screens'))
    p.add_argument('--out',type=Path,default=Path('../analysis/pixel-proof'))
    args=p.parse_args(); args.out.mkdir(parents=True,exist_ok=True)
    # Self-check the score's identity and threshold boundaries.
    zero=np.zeros((1,1,3),dtype=np.uint8)
    assert metrics(zero,zero)['exact_pass']
    assert metrics(zero,np.full_like(zero,16))['over_16_mismatch_percent']==0
    assert metrics(zero,np.full_like(zero,17))['over_16_mismatch_percent']==100
    rows=[]
    for name in NAMES:
        native_path=args.native/(name+'.png');web_path=args.web/(name+'.png')
        with Image.open(native_path) as original:
            assert original.size==(1080,2400), (native_path,original.size)
            crop=(0,0,1080,2201) if name=='forgot_password' else CROP
            native=original.convert('RGB').crop(crop).resize(SIZE,Image.Resampling.LANCZOS)
        with Image.open(web_path) as original:
            assert original.size==SIZE,(web_path,original.size)
            web=original.convert('RGB')
        a=np.asarray(native);b=np.asarray(web);score=metrics(a,b)
        difference=Image.fromarray(np.clip(np.abs(a.astype(np.int16)-b.astype(np.int16))*4,0,255).astype(np.uint8))
        overlay=Image.blend(native,web,.5)
        sheet=Image.new('RGB',(SIZE[0]*4,SIZE[1]+28),'#eeeeee');draw=ImageDraw.Draw(sheet)
        for i,(label,im) in enumerate([('Android (normalized)',native),('Browser',web),('50% overlay',overlay),('Absolute difference x4',difference)]):
            draw.text((i*SIZE[0]+8,8),label,fill='black');sheet.paste(im,(i*SIZE[0],28))
        sheet.save(args.out/(name+'.png'))
        rows.append({'screen':name,**score,'native_crop':crop,'native_sha256':digest(native_path),'web_sha256':digest(web_path)})
    commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
    report={'commit':commit,'native_crop':CROP,'normalized_size':SIZE,'resampling':'Pillow LANCZOS; Android only','masks':[],'exact_pass_count':sum(r['exact_pass'] for r in rows),'pair_count':len(rows),'limitations':['Existing captures, not simultaneous deterministic rendering. Animations, map camera/tiles, selected state, keyboard and tooltip timing can differ.','Android content crop removes system bars. Resampling changes Android pixels; these are normalized comparisons, not raw-device pixel proofs.','Password reset is edge-to-edge and uses crop(0,0,1080,2201); its top statusbar overlays app content and remains visible in the difference. Other screens use the common inset crop.','No native runtime references for gated screens. Report hazard gate is not paired with the different browser issue-grid screen.','Exact pass requires zero RGB difference. The >16 threshold is diagnostic only and never counts as a pass.'],'screens':rows}
    (args.out/'results.json').write_text(json.dumps(report,indent=2)+'\n')
    content=''.join(f'<section><h2>{html.escape(r["screen"])}</h2><p>Exact mismatch: {r["exact_mismatch_percent"]:.2f}% · Difference &gt;16: {r["over_16_mismatch_percent"]:.2f}% · MAE: {r["mean_absolute_channel_error"]:.2f}/255 · {"PASS" if r["exact_pass"] else "FAIL"}</p><a href="{r["screen"]}.png"><img loading="lazy" src="{r["screen"]}.png" alt="Android, browser, overlay and difference for {r["screen"]}"></a></section>' for r in rows)
    (args.out/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>SnowRun pixel comparison</title><style>body{font:16px system-ui;margin:24px;max-width:1700px}img{width:100%;height:auto}section{margin:40px 0}p,li{line-height:1.6}</style><h1>Pixel comparison</h1><p>'+f'{report["exact_pass_count"]}/{len(rows)} normalized screenshot pairs have zero differing pixels. Build: <code>{commit}</code>.</p><p>No masking, per-screen alignment or color correction. Password reset uses its separate edge-to-edge origin. Other native crop (0,136,1080,2337), resized to411×838; browser captures411×838. Black in the difference means equal; brighter pixels show disagreement.</p><ul>'+''.join('<li>'+html.escape(v)+'</li>' for v in report['limitations'])+'</ul>'+content+'</html>')
    print(json.dumps({'exact_pass':report['exact_pass_count'],'pairs':len(rows),'report':str(args.out/'index.html'),'screens':[{k:r[k] for k in ['screen','exact_mismatch_percent','over_16_mismatch_percent','mean_absolute_channel_error']} for r in rows]},indent=2))

if __name__=='__main__':main()
