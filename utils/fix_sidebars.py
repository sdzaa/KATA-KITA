import re
import glob

html_files = glob.glob('../pages/*.html')

replacements = [
    (r'<span>My Space</span>', r'<span data-i18n="nav_myspace">My Space</span>'),
    (r'<span>Education</span>', r'<span data-i18n="nav_library">Education</span>'),
    (r'<span>Gratitude Wall</span>', r'<span data-i18n="nav_gratitude">Gratitude Wall</span>'),
    (r'<span>Comfort Zone</span>', r'<span data-i18n="nav_comfort">Comfort Zone</span>'),
    (r'<span>Kindness Feed</span>', r'<span data-i18n="nav_home">Kindness Feed</span>'),
    (r'<span>Settings</span>', r'<span data-i18n="nav_settings">Settings</span>'),
    (r'<span>Rules</span>', r'<span data-i18n="nav_rules">Rules</span>'),
    (r'<span>Tasks</span>', r'<span data-i18n="nav_tasks">Tasks</span>'),
    (r'<span>Logout</span>', r'<span data-i18n="nav_logout">Logout</span>'),
]

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = re.sub(old, new, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Updated sidebars in all HTML files')
