import re
import os

os.makedirs('content/collaborators', exist_ok=True)

# Generate English first and record the slugs
with open('static/sections/collaborators/en.toml', 'r', encoding='utf-8') as f:
    en_content = f.read()

def parse_toml(content):
    collabs = []
    curr = {}
    for line in content.split('\n'):
        if line.startswith('[[collaborators]]'):
            if curr:
                collabs.append(curr)
            curr = {}
        elif '=' in line:
            k, v = line.split('=', 1)
            k = k.strip()
            v = v.strip().strip('"')
            if k in ['name', 'role', 'institution', 'image']:
                curr[k] = v
    if curr:
        collabs.append(curr)
    return collabs

en_collabs = parse_toml(en_content)
slugs = []

for i, c in enumerate(en_collabs):
    name = c.get('name', 'Unknown')
    slug = re.sub(r'[^a-zA-Z0-9]', '-', name.lower())
    slug = re.sub(r'-+', '-', slug).strip('-')
    slugs.append(slug)
    
    with open(f'content/collaborators/{slug}.md', 'w', encoding='utf-8') as f:
        f.write('+++\n')
        f.write(f'title = "{name}"\n')
        f.write(f'description = "{c.get("role", "")}"\n')
        f.write(f'weight = {i+1}\n\n')
        f.write('[extra]\n')
        f.write(f'institution = "{c.get("institution", "")}"\n')
        if 'image' in c:
            f.write(f'image = "{c.get("image")}"\n')
        else:
            f.write('image = ""\n')
        f.write('website = ""\n')
        f.write('+++\n\n')
        f.write('## Research Areas\n')
        f.write('Specific research areas and focus of work are listed here.\n\n')
        f.write('## Selected Papers\n')
        f.write('- [Title of Paper 1](#)\n')
        f.write('- [Title of Paper 2](#)\n')

# Now process Odia
try:
    with open('static/sections/collaborators/or.toml', 'r', encoding='utf-8') as f:
        or_content = f.read()
    or_collabs = parse_toml(or_content)
    
    for i, c in enumerate(or_collabs):
        if i >= len(slugs): break
        slug = slugs[i]
        name = c.get('name', 'Unknown')
        
        with open(f'content/collaborators/{slug}.or.md', 'w', encoding='utf-8') as f:
            f.write('+++\n')
            f.write(f'title = "{name}"\n')
            f.write(f'description = "{c.get("role", "")}"\n')
            f.write(f'weight = {i+1}\n\n')
            f.write('[extra]\n')
            f.write(f'institution = "{c.get("institution", "")}"\n')
            if 'image' in c:
                f.write(f'image = "{c.get("image")}"\n')
            else:
                f.write('image = ""\n')
            f.write('website = ""\n')
            f.write('+++\n\n')
            f.write('## Research Areas\n')
            f.write('Specific research areas and focus of work are listed here.\n\n')
            f.write('## Selected Papers\n')
            f.write('- [Title of Paper 1](#)\n')
            f.write('- [Title of Paper 2](#)\n')
except Exception as e:
    print("Error with or.toml", e)

print(f"Generated {len(slugs)} files perfectly synced.")
