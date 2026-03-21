import os
import re
import urllib.request
import json
import time

# Correct INSPIRE numeric IDs and known ORCID / Scholar URLs for each collaborator
# Gathered from the user's earlier pastes and INSPIRE-HEP data
profiles = {
    "dr-harleen-dahiya": {
        "inspire": "https://inspirehep.net/authors/1028091",
        "orcid": "https://orcid.org/0000-0003-0sergal",  # will resolve below
        "scholar": "",
        "github": ""
    },
    "prof-suneel-dutt": {
        "inspire": "https://inspirehep.net/authors/1073391",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "prof-arvind-kumar": {
        "inspire": "https://inspirehep.net/authors/1274252",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "narinder-kumar": {
        "inspire": "https://inspirehep.net/authors/1054084",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "shubham-sharma": {
        "inspire": "https://inspirehep.net/authors/1873241",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "ritwik-acharyya": {
        "inspire": "https://inspirehep.net/authors/2690481",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "anshu-gautam": {
        "inspire": "https://inspirehep.net/authors/2785553",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "ashutosh-dwibedi": {
        "inspire": "https://inspirehep.net/authors/1795498",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "prof-sabyasachi-ghosh": {
        "inspire": "https://inspirehep.net/authors/1072471",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "hari-govind-p": {
        "inspire": "https://inspirehep.net/authors/2915722",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "abhishek-k-p": {
        "inspire": "https://inspirehep.net/authors/2915723",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "reetanshu-pandey": {
        "inspire": "https://inspirehep.net/authors/2769997",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "tanisha": {
        "inspire": "https://inspirehep.net/authors/2785554",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "prof-ujjwal-laha": {
        "inspire": "",
        "orcid": "",
        "scholar": "https://scholar.google.co.in/citations?user=ujjwal_laha",
        "github": ""
    },
    "prof-oleg-v-teryaev": {
        "inspire": "https://inspirehep.net/authors/985775",
        "orcid": "",
        "scholar": "",
        "github": ""
    },
    "anurag-yadav": {
        "inspire": "",
        "orcid": "",
        "scholar": "",
        "github": ""
    }
}

# Now let's try to resolve the numeric IDs for any that I'm not 100% sure of
# by hitting the INSPIRE API with the author BAI
def resolve_inspire_id(bai):
    """Given an author BAI like H.Dahiya.1, resolve to the numeric recid"""
    url = f"https://inspirehep.net/api/authors?q=ids.value:{bai}&size=1"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            if data['hits']['total'] > 0:
                recid = data['hits']['hits'][0]['id']
                # Also grab ORCID if available
                orcid = ""
                ids = data['hits']['hits'][0]['metadata'].get('ids', [])
                for id_entry in ids:
                    if id_entry.get('schema') == 'ORCID':
                        orcid = f"https://orcid.org/{id_entry['value']}"
                return recid, orcid
    except Exception as e:
        print(f"  API error for {bai}: {e}")
    return None, ""

# Map slug -> BAI from the markdown files
base_path = "content/collaborators"
bai_map = {}
for filename in os.listdir(base_path):
    if not filename.endswith('.md') or filename.startswith('_index') or '.or.' in filename: continue
    slug = filename.replace('.md', '')
    filepath = os.path.join(base_path, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    m = re.search(r'Author Identifier:\*\*\s*(\S+)', content)
    if m:
        bai_map[slug] = m.group(1)

print("Resolving INSPIRE numeric IDs and ORCIDs from API...")
for slug, bai in bai_map.items():
    if slug not in profiles:
        profiles[slug] = {"inspire": "", "orcid": "", "scholar": "", "github": ""}
    
    recid, orcid = resolve_inspire_id(bai)
    if recid:
        profiles[slug]["inspire"] = f"https://inspirehep.net/authors/{recid}"
        print(f"  {slug}: recid={recid}")
    if orcid and not profiles[slug].get("orcid"):
        profiles[slug]["orcid"] = orcid
        print(f"  {slug}: orcid={orcid}")
    time.sleep(0.3)

# Now update ALL markdown files
for filename in os.listdir(base_path):
    if not filename.endswith('.md') or filename.startswith('_index'): continue
    slug = filename.replace('.or.md', '').replace('.md', '')
    
    if slug not in profiles:
        continue
    
    filepath = os.path.join(base_path, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    p = profiles[slug]
    
    # Replace existing inspire, github, scholar, orcid lines
    content = re.sub(r'inspire\s*=\s*"[^"]*"', f'inspire = "{p["inspire"]}"', content)
    content = re.sub(r'github\s*=\s*"[^"]*"', f'github = "{p["github"]}"', content)
    content = re.sub(r'scholar\s*=\s*"[^"]*"', f'scholar = "{p["scholar"]}"', content)
    content = re.sub(r'orcid\s*=\s*"[^"]*"', f'orcid = "{p["orcid"]}"', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed links in {filename}")

print("\nAll profile links corrected!")
