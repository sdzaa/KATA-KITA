import re

with open('../pages/tasks.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (r'<button class="task-btn" data-i18n="tasks_t1_btn">', r'<button class="task-btn" data-i18n="tasks_t1_btn" data-task="education">'),
    (r'<button class="task-btn" data-i18n="tasks_t2_btn">', r'<button class="task-btn" data-i18n="tasks_t2_btn" data-task="gratitude">'),
    (r'<button class="task-btn" data-i18n="tasks_t3_btn">', r'<button class="task-btn" data-i18n="tasks_t3_btn" data-task="comfort">'),
    (r'<button class="task-btn" data-i18n="tasks_t4_btn">', r'<button class="task-btn" data-i18n="tasks_t4_btn" data-task="kindness">'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('../pages/tasks.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated tasks.html with data-task attributes')
