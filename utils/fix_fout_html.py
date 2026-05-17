import re
import glob

html_files = glob.glob('../pages/*.html')
html_files.append('../index.html')

search_str = r"const theme = localStorage.getItem\('katakita_theme'\) \|\| 'light';\s*document.documentElement.setAttribute\('data-theme', theme\);"
replace_str = "const theme = localStorage.getItem('katakita_theme') || 'light';\n        document.documentElement.setAttribute('data-theme', theme);\n        const lang = localStorage.getItem('katakita_language') || 'id';\n        if (lang !== 'en') { document.write('<style id=\"lang-hide\">body { visibility: hidden; }</style>'); }"

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(search_str, replace_str, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Updated theme script to include lang-hide in all HTML files')
