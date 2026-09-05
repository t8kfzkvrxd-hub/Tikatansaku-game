"""Read-only structural checks; Python is not needed to run the game."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent
BASE = '4f78979'

def original(path):
    return subprocess.check_output(['git', 'show', f'{BASE}:{path}'], cwd=ROOT, text=True)

def section(text, start, end):
    return text[text.index(start):text.index(end, text.index(start))]

old = original('index.html')
parts = {
    'js/core/state.js': [('    let state =', '    function saveState')],
    'js/core/save.js': [('    function saveState', '    function showResetSaveConfirmation'), ('    function resetGameSave', '    function initStarterItems')],
    'js/data/lore.js': [('    const LORE_RECORDS', '    const SYNERGIES')],
    'js/data/equipment.js': [('    const SYNERGIES', '    const AREAS')],
    'js/data/areas.js': [('    const AREAS', '    const SAVE_KEY')],
    'js/systems/dungeon.js': [('    function getCurrentArea', '    function startNormalBattle')],
    'js/systems/statusEffects.js': [('    function processPlayerStatuses', '    function playerCombatAction')],
    'js/ui/render.js': [('    function updateHeader', '    function getItemStatSummary(it)')],
    'js/ui/itemPresentation.js': [('    function getItemStatSummary(it)', '    function triggerShake')],
}
for path, spans in parts.items():
    current=(ROOT/path).read_text()
    if path=='js/ui/render.js':
        current=current.replace(' id="town-blacksmith"','').replace("      if(typeof syncLobbyScreen==='function')syncLobbyScreen();\n",'').replace("      if(typeof refreshLobbyFacility==='function')refreshLobbyFacility();\n",'')
    assert current.rstrip() == ''.join(section(old, a, b) for a, b in spans).rstrip(), path
    print('PASS: unchanged extracted source', path)
battle = section(old, '    function startNormalBattle', '    function showLayer1ClearModal')
battle = battle.replace(section(old, '    function processPlayerStatuses', '    function playerCombatAction'), '')
assert (ROOT/'js/systems/battle.js').read_text() == battle
assert (ROOT/'js/data/craftingCatalog.js').read_text() == section(original('crafting.js'), 'const MATERIALS', 'function discoverMaterial')
html = (ROOT/'index.html').read_text()
scripts = re.findall(r'<script src="([^"]+)"', html)
assert len(scripts) == len(set(scripts))
assert all((ROOT/path).is_file() for path in scripts)
for before, after in [('js/core/config.js','js/core/state.js'), ('js/data/areas.js','chapter-data.js'), ('chapter-data.js','js/data/craftingCatalog.js'), ('js/data/craftingCatalog.js','crafting.js'), ('crafting.js','equipment.js'), ('equipment.js','forge-ui.js')]:
    assert scripts.index(before) < scripts.index(after), (before, after)
assert 'type="module"' not in html and '<script defer' not in html
print('PASS: static script paths and dependency order (no build required)')
print('ALL TESTS PASSED')
