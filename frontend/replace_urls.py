import os
import glob
import re

components_dir = r'd:\AGENTIUM\Agensi\frontend\src\components'
tsx_files = glob.glob(os.path.join(components_dir, '*.tsx'))

for filepath in tsx_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'http://localhost:8000' in content:
        # replace API calls
        content = content.replace("'http://localhost:8000/", "`${API_BASE}/")
        content = content.replace("'http://localhost:8000", "`${API_BASE}")
        content = content.replace('\"http://localhost:8000/', '`${API_BASE}/')
        content = content.replace('\"http://localhost:8000', '`${API_BASE}')
        
        # add import if not present
        if 'import { API_BASE } from' not in content:
            # find last import
            imports = re.findall(r'^import .*?;$', content, re.MULTILINE)
            if imports:
                last_import = imports[-1]
                content = content.replace(last_import, last_import + '\nimport { API_BASE } from \'../lib/config\';', 1)
            else:
                content = 'import { API_BASE } from \'../lib/config\';\n' + content
                
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {os.path.basename(filepath)}')
print('Done bulk replace.')
