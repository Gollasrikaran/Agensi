import os, glob, re

components_dir = r'd:\AGENTIUM\Agensi\frontend\src\components'
tsx_files = glob.glob(os.path.join(components_dir, '*.tsx'))

pattern1 = re.compile(r'`\$\{API_BASE\}([^`]*)`')
pattern2 = re.compile(r'import\s+\{\s*API_BASE\s*\}\s*from\s+[\'\"].*?config[\'\"];?[\r\n]*')

for filepath in tsx_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Replace the template string with a regular string
    content = pattern1.sub(r"'http://localhost:8000\g<1>'", content)
    
    # Remove the import statement
    content = pattern2.sub('', content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Reverted {os.path.basename(filepath)}')

print('Done reverting API_BASE to localhost:8000.')
