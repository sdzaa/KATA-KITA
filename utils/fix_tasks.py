import re

with open('../pages/tasks.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (r'<h1>Tasks</h1>', r'<h1 data-i18n="tasks_title">Tasks</h1>'),
    (r'Total Stars Earned:', r'<span data-i18n="tasks_total_earned">Total Stars Earned:</span>'),
    (r'<h3>Read an Education Article \(from "Education"\): 10 Stars ?</h3>', r'<h3 data-i18n="tasks_t1_title">Read an Education Article (from "Education"): 10 Stars ?</h3>'),
    (r'<p class="task-subtitle">Completed: The Power of Community</p>', r'<p class="task-subtitle" data-i18n="tasks_t1_sub">Completed: The Power of Community</p>'),
    (r'<button class="task-btn">Go to Education</button>', r'<button class="task-btn" data-i18n="tasks_t1_btn">Go to Education</button>'),
    (r'<h3>Share a Gratitude Moment: 15 Stars ?</h3>', r'<h3 data-i18n="tasks_t2_title">Share a Gratitude Moment: 15 Stars ?</h3>'),
    (r'<button class="task-btn">Post to Wall</button>', r'<button class="task-btn" data-i18n="tasks_t2_btn">Post to Wall</button>'),
    (r'<h3>Listen to a Comfort Zone Track: 25 Stars ?</h3>', r'<h3 data-i18n="tasks_t3_title">Listen to a Comfort Zone Track: 25 Stars ?</h3>'),
    (r'<button class="task-btn">Go to Comfort Zone</button>', r'<button class="task-btn" data-i18n="tasks_t3_btn">Go to Comfort Zone</button>'),
    (r'<h3>Complete Kindness Challenge \(0/3\): 50 Stars ?</h3>', r'<h3 data-i18n="tasks_t4_title">Complete Kindness Challenge (0/3): 50 Stars ?</h3>'),
    (r'<button class="task-btn">Go to Kindness Feed</button>', r'<button class="task-btn" data-i18n="tasks_t4_btn">Go to Kindness Feed</button>'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('../pages/tasks.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated tasks.html')
