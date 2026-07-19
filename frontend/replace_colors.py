import os
import glob

components_dir = r'd:\AGENTIUM\Agensi\frontend\src\components'
tsx_files = glob.glob(os.path.join(components_dir, '*.tsx'))

color_map = {
    '#f87171': 'var(--error)',
    '#ef4444': 'var(--error)',
    '#334155': 'var(--hairline-strong)',
    '#1e293b': 'var(--hairline)',
    '#064e3b': 'var(--success-soft)',
    '#34d399': 'var(--success)',
    '#78350f': 'var(--warning-soft)',
    '#fbbf24': 'var(--warning)',
    '#94a3b8': 'var(--mute)'
}

for filepath in tsx_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    for hex_code, css_var in color_map.items():
        if hex_code in content:
            content = content.replace(hex_code, css_var)
            modified = True
            
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {os.path.basename(filepath)}')

print('Done color replace.')
