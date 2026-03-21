import os

body = """## Selected Papers

- **Does nuclear medium affect the transverse momentum-dependent parton distributions of valence quark of pions?**  
  *Navpreet Kaur, Satyajit Puhan, Reetanshu Pandey, Arvind Kumar, Suneel Dutt et al.* (Sep 9, 2024)  
  *Phys.Lett.B 859 (2024) 139114* | **11 Citations**

- **Valence quark properties of charged kaons in symmetric nuclear matter**  
  *Reetanshu Pandey, Satyajit Puhan, Navpreet Kaur, Arvind Kumar, Suneel Dutt et al.* (May 2, 2025)  
  *Eur.Phys.J.Plus 140 (2025) 10, 1040* | **1 Citation**

- **Extraction of f1(x,fkp2erp) quark TMDs of proton from E288 Drell-Yan data**  
  *Hari Govind P, Reetanshu Pandey, Satyajit Puhan, Suneel Dutt, Harleen Dahiya et al.* (2026)  
  *DAE Symp.Nucl.Phys. 69 (2026) 963-964*

- **Extraction of unpolarized quark TMDs of proton from FNAL-E-0605 data using iminuit**  
  *Abhishek K. P, Reetanshu Pandey, Satyajit Puhan, Suneel Dutt, Harleen Dahiya et al.* (2026)  
  *DAE Symp.Nucl.Phys. 69 (2026) 877-878*
"""

base_path = "content/collaborators"
name = "reetanshu-pandey"
for ext in [".md", ".or.md"]:
    filepath = os.path.join(base_path, f"{name}{ext}")
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    parts = content.split('+++\n')
    if len(parts) >= 3:
        new_content = parts[0] + '+++\n' + parts[1] + '+++\n\n' + body
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
print("Successfully batch-updated profiles.")
