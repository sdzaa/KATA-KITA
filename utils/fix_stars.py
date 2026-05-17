import re
import glob

html_files = glob.glob('../pages/*.html')

replacements = [
    (r'<span id="userPoints">0</span> Stars', r'<span id="userPoints">0</span> <span data-i18n="header_stars">Stars</span>'),
]

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = re.sub(old, new, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Updated Stars in all HTML files')
