import re

with open('../js/translations.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "'settings_btn_cancel': 'Batal',",
    "'settings_btn_cancel': 'Batal',\n        'settings_light_mode': '?? Mode Terang',\n        'settings_dark_mode': '?? Mode Gelap',"
)

content = content.replace(
    "'settings_btn_cancel': 'Cancel',",
    "'settings_btn_cancel': 'Cancel',\n        'settings_light_mode': '?? Light Mode',\n        'settings_dark_mode': '?? Dark Mode',"
)

with open('../js/translations.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated translations.js with light/dark mode')
