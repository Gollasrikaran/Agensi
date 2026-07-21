import os
import re

frontend_dir = r"c:\Users\srika\company\agensi\frontend\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # If it doesn't have localhost:8000, skip
    if "http://localhost:8000" not in content:
        return

    # Replace straight string quotes: 'http://localhost:8000/...' -> `${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/...`
    # We replace 'http://localhost:8000' and "http://localhost:8000" with `${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}`
    # but we have to change the outer quotes to backticks if they were straight quotes.
    
    # Actually, the simplest reliable regex approach for JS/TS:
    # Replace http://localhost:8000 with ${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}
    # inside template literals (backticks).
    
    # First, let's just replace all instances of 'http://localhost:8000/ with `${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/`
    # and change the wrapping quotes to backticks.
    
    # Handle single quotes: 'http://localhost:8000/path' -> `${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/path`
    content = re.sub(r"'http://localhost:8000([^']*)'", r"`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}\1`", content)
    
    # Handle double quotes: "http://localhost:8000/path" -> `${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/path`
    content = re.sub(r'"http://localhost:8000([^"]*)"', r"`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}\1`", content)
    
    # Handle existing backticks: `http://localhost:8000/path` -> `${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/path`
    content = re.sub(r'`http://localhost:8000([^`]*)`', r"`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}\1`", content)
    
    # Handle bare string without quotes (already inside backticks, e.g. `http://localhost:8000/api/admin/users/${userId}/unblock`)
    # Wait, the previous backtick regex will catch this IF it's exactly surrounded by backticks.
    # If it's already inside a larger backtick string, like `http://localhost:8000/api/users/${id}`
    # The backtick regex r'`http://localhost:8000([^`]*)`' handles it because it captures up to the closing backtick!
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.astro', '.js', '.jsx')):
            process_file(os.path.join(root, file))

print("Done.")
