import re

with open('../js/comfort.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (r"You haven\\'t saved anything yet. Click the bookmark icon on any message or track to save it!", r"\\"),
    (r"Saved Messages", r"\\"),
    (r"Saved Tracks", r"\\"),
    (r"Already Saved", r"\\"),
    (r"This item is already in your saved list\.", r"\\"),
    (r"Saved Successfully", r"\\"),
    (r"has been added to your saved list\.", r"\\"),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('../js/comfort.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated comfort.js strings')
