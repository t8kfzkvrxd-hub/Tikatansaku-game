"""Normalize the two supplied single portraits only; keep all other assets intact."""
from pathlib import Path
import hashlib
import json
from PIL import Image

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[1]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    protected = {p: digest(p) for p in OUT.glob('characters/*/*.png')
                 if p.relative_to(OUT).as_posix() not in ['characters/player/serious.png', 'characters/player/angry.png']}
    for expression in ['serious', 'angry']:
        source = ROOT / f'assets/player{expression}.png'
        before = digest(source)
        im = Image.open(source).convert('RGBA')
        # Keep original transparent halo, all artwork and aspect ratio. No segmentation.
        fitted = im.copy()
        fitted.thumbnail((652, 887), Image.Resampling.LANCZOS)
        offset = ((684 - fitted.width) // 2, 903 - fitted.height)
        canvas = Image.new('RGBA', (684, 919))
        canvas.paste(fitted, offset)
        relative = f'characters/player/{expression}.png'
        destination = OUT / relative
        canvas.save(destination)
        with Image.open(destination) as reopened:
            assert reopened.size == (684, 919)
            assert reopened.getchannel('A').getextrema()[0] == 0
        assert digest(source) == before
        manifest['sources'][source.name] = {'sha256': before, 'width': im.width, 'height': im.height,
            'format': 'PNG', 'mode': 'RGBA', 'alphaRange': list(im.getchannel('A').getextrema())}
        manifest['parts'] = [p for p in manifest['parts'] if p['file'] != relative]
        manifest['parts'].append({'file': relative, 'sourceFile': f'assets/{source.name}',
            'sourceRect': [0, 0, im.width, im.height], 'sourceType': 'single-portrait-fit',
            'width': 684, 'height': 919, 'contentSize': list(fitted.size), 'paddingOffset': list(offset),
            'pixelExact': False, 'resampling': 'LANCZOS (uniform fit only)', 'sha256': digest(destination)})
        manifest['rejected'] = [p for p in manifest['rejected'] if p != relative]
    assert all(digest(p) == old for p, old in protected.items())
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f'PASS: 2 single portraits normalized; {len(protected)} existing portraits unchanged')

if __name__ == '__main__':
    main()
