import os, glob, re

components_dir = r'd:\AGENTIUM\Agensi\frontend\src\components'
tsx_files = glob.glob(os.path.join(components_dir, '*.tsx'))

for filepath in tsx_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content

    # Fix 1: fetch with options (no closing quote before comma)
    content = re.sub(r"fetch\('http://localhost:8000([^,']+),\s*\{", r"fetch('http://localhost:8000\1', {", content)
    
    # Fix 2: fetch without options (no closing quote before parenthesis)
    content = re.sub(r"fetch\('http://localhost:8000([^'\)]+)\);", r"fetch('http://localhost:8000\1');", content)

    # Fix 3: URLs that have template variables but start with ' and end with `
    content = re.sub(r"'http://localhost:8000([^']*?\$\{[^\}]+\}[^'`]*)\`", r"`http://localhost:8000\1`", content)
    
    # Fix 4: Authorization header starting with ' and ending with `
    content = re.sub(r"'Authorization': 'Bearer (\$\{[^\}]+\})\`", r"'Authorization': `Bearer \1`", content)
    
    # Fix 5: CheckoutIsland button text
    content = content.replace(r"'Proceed to Checkout (₹${(basePrice || 0).toFixed(2)})'", r"`Proceed to Checkout (₹${(basePrice || 0).toFixed(2)})`")
    
    # Fix 6: Leftover API_BASE that had single quotes initially
    content = content.replace(r"fetch('${API_BASE}", r"fetch('http://localhost:8000")
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {os.path.basename(filepath)}")

print("Done syntax fixes.")
