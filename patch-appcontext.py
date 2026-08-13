import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

# 1. Remove seeding block
content = re.sub(
    r'const \[cSnap, dSnap, bSnap, catSnap, distSnap\] = await Promise\.all\(\[.*?\]\);.*?if \(distSnap\.empty\) \{.*?\}',
    '// Demo data seeding disabled',
    content,
    flags=re.DOTALL
)

# 2. Fix the fallbacks
content = content.replace(
    'const res = list.length > 0 ? list : DEFAULT_CLINICS;',
    'const res = list;'
)
content = content.replace(
    'const res = list.length > 0 ? list : DEFAULT_DOCTORS;',
    'const res = list;'
)
content = content.replace(
    'const res = list.length > 0 ? list : DEFAULT_BANNERS;',
    'const res = list;'
)
content = content.replace(
    'const res = list.length > 0 ? list : DEFAULT_CATEGORIES;',
    'const res = list;'
)

# 3. Fix Districts and Legal Policies (Keep defaults because they are actually useful configs, but wait, the user asked to remove demo data. Real districts are fine. I'll leave districts alone since they are J&K districts. Same for Legal Policies.)

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)
print("Patched successfully!")
