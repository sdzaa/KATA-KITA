import glob
import os
import re

html_files = glob.glob('../pages/*.html') + ['../index.html']

theme_script = '''
    <script>
        const theme = localStorage.getItem('katakita_theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    </script>
</head>'''

for filepath in html_files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already added
        if 'localStorage.getItem(\'katakita_theme\')' not in content:
            # Replace </head> with the script + </head>
            content = re.sub(r'</head>', theme_script, content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print('Added theme script to HTML files.')
