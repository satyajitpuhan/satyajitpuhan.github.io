import os

pubs = [
    {
        "id": "t-even-tmds-spin-0",
        "title": "T-even TMDs for the spin-0 pseudo-scalar mesons upto twist-4 using light-front formalism",
        "date": "2024-02-15",
        "journal": "JHEP 075 (2024)",
        "authors": "S. Puhan, S. Sharma, N. Kaur, N. Kumar and H. Dahiya",
        "description": "Journal of High Energy Physics article on TMDs for spin-0 pseudo-scalar mesons.",
        "link_label": "Read Paper",
        "link_url": "https://link.springer.com/article/10.1007/JHEP02(2024)075"
    },
    {
        "id": "t-even-tmds-spin-1",
        "title": "Leading twist T-even TMDs for the spin-1 heavy vector mesons",
        "date": "2024-03-01",
        "journal": "Phys. Rev. D 109 (2024)",
        "authors": "S. Puhan and H. Dahiya",
        "description": "Physical Review D article on leading twist T-even TMDs for heavy vector mesons.",
        "link_label": "Read on PRD",
        "link_url": "https://journals.aps.org/prd/abstract/10.1103/PhysRevD.109.034005"
    },
    {
        "id": "spin-orbit-correlations",
        "title": "Quark spin-orbit correlations in spin-0 and spin-1 mesons using the light-front quark model",
        "date": "2024-05-15",
        "journal": "Phys. Rev. D 110 (2024)",
        "authors": "R. Acharyya, S. Puhan and H. Dahiya",
        "description": "Investigation of quark spin-orbit correlations.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2782544"
    },
    {
        "id": "photon-leading-twist",
        "title": "Photon Leading Twist Transverse Momentum Dependent Parton Distributions",
        "date": "2025-01-01",
        "journal": "Eur. Phys. J. A 61 (2025)",
        "authors": "S. Puhan, N. Kumar and H. Dahiya",
        "description": "Published in EPJA special edition on Topical Spin-1 observables.",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2408.07714"
    },
    {
        "id": "spectroscopy-radially-excited",
        "title": "Spectroscopy of radially excited charmonia and bottomonia in light-front quark model",
        "date": "2025-02-01",
        "journal": "Chin. Phys. C 49 (2025)",
        "authors": "R. Acharyya, S. Puhan, N. Kumar and H. Dahiya",
        "description": "Published in CPC.",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2408.07715"
    },
    {
        "id": "tmd-relations",
        "title": "TMD Relations: Insights from a Light-Front Quark-Diquark Model",
        "date": "2024-10-01",
        "journal": "PTEP ptae150 (2024)",
        "authors": "S. Sharma, S. Puhan, N. Kumar and H. Dahiya",
        "description": "Published in PTEP.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2789229"
    },
    {
        "id": "pion-valence-asymm",
        "title": "Pions valence quark distributions in asymmetric nuclear matter at finite temperature",
        "date": "2024-09-01",
        "journal": "Phys. Rev. D 110 (2024)",
        "authors": "S. Puhan, N. Kaur, A. Kumar, S. Dutt, and H. Dahiya",
        "description": "Published in PRD.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2818000"
    },
    {
        "id": "pion-nuclear-medium",
        "title": "Does nuclear medium affect the transverse momentum-dependent parton distributions of valence quark of pions?",
        "date": "2024-11-01",
        "journal": "Phys. Lett. B 859 (2024)",
        "authors": "N. Kaur, S. Puhan, A. Kumar, S. Dutt, and H. Dahiya",
        "description": "Published in PLB.",
        "link_label": "Read on ScienceDirect",
        "link_url": "https://doi.org/10.1016/j.physletb.2024.139114"
    },
    {
        "id": "transverse-spatial-light-heavy",
        "title": "Transverse and spatial structure of light to heavy mesons in light-front dynamics",
        "date": "2025-01-05",
        "journal": "Phys. Rev. D 111 (2025)",
        "authors": "S. Puhan, N. Kaur and H. Dahiya",
        "description": "Published in PRD.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2839021"
    },
    {
        "id": "asymmetric-nuclear-kaons",
        "title": "Effect of Asymmetric Nuclear Medium on the Valence Quark Structure of the Kaons",
        "date": "2025-03-01",
        "journal": "Phys. Rev. D 111 (2025)",
        "authors": "D. Singh, S. Puhan, N. Kaur, M. Kaur, S. Dutt, A. Kumar, and H. Dahiya",
        "description": "Published in PRD.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2843133"
    },
    {
        "id": "nuclear-medium-spatial",
        "title": "Effect of nuclear medium on the spatial distribution of pions",
        "date": "2025-01-20",
        "journal": "Nucl. Phys. B 1017 (2025)",
        "authors": "S. Puhan, N. Kaur, A. Kumar, S. Dutt, and H. Dahiya",
        "description": "Published in NPB.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2873357"
    },
    {
        "id": "valence-quark-pion-gtmd",
        "title": "Understanding the Valence Quark Structure of the Pion through GTMDs",
        "date": "2025-04-01",
        "journal": "PTEP ptaf100 (2025)",
        "authors": "S. Puhan, S. Sharma, N. Kumar and H. Dahiya",
        "description": "Published in PTEP.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2914151"
    },
    {
        "id": "isospin-asymm-b-mesons",
        "title": "Impact of isospin asymmetric nuclear medium on pseudoscalar and vector B-mesons",
        "date": "2026-01-01",
        "journal": "Nucl. Phys. A 1068 (2026)",
        "authors": "Tanisha, S. Puhan, N. Kaur, A. Kumar and H. Dahiya",
        "description": "Published in NPA.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2916907"
    },
    {
        "id": "radiative-transitions-charmonia",
        "title": "Radiative Transitions for the Ground and Excited Charmonia States",
        "date": "2025-04-10",
        "journal": "Submitted to PRD",
        "authors": "A. Yadav, S. Puhan, and H. Dahiya",
        "description": "Submitted to PRD.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2914109"
    },
    {
        "id": "valence-quark-kaons-symm",
        "title": "Valence quark properties of charged kaons in symmetric nuclear matter",
        "date": "2025-05-01",
        "journal": "Eur. Phys. J. Plus 140 (2025)",
        "authors": "R. Pandey, S. Puhan, N. Kaur, A. Kumar, S. Dutt, and H. Dahiya",
        "description": "Published in EPJP.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2917873"
    },
    {
        "id": "emffs-pion-kaon",
        "title": "Scalar, vector and tensor electromagnetic form factors of pion and kaon",
        "date": "2025-05-15",
        "journal": "Phys. Rev. D 111 (2025)",
        "authors": "S. Puhan and H. Dahiya",
        "description": "Published in PRD.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2918260"
    },
    {
        "id": "valence-quark-rho-jpsi",
        "title": "Valence quark distribution of light rho and heavy J/psi vector mesons in light-cone quark model",
        "date": "2025-06-01",
        "journal": "Phys. Rev. D 112 (2025)",
        "authors": "Tanisha, S. Puhan, A. Yadav, and H. Dahiya",
        "description": "Published in PRD.",
        "link_label": "Read on PRD",
        "link_url": "https://journals.aps.org/prd/abstract/10.1103/cmbw-vcds"
    },
    {
        "id": "d-mesons-isospin-asymm",
        "title": "D and D* mesons in isospin asymmetric nuclear medium",
        "date": "2025-06-15",
        "journal": "PTEP ptaf135 (2025)",
        "authors": "A. Gautam, D. Singh, N. Kaur, S. Puhan, S. Dutt, H. Dahiya, and A. Kumar",
        "description": "Published in PTEP.",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2932525"
    },
    {
        "id": "valence-quark-rho-lfqm",
        "title": "Valence quark structure of rho meson using light-front quark model",
        "date": "2025-11-01",
        "journal": "Accepted in PRD",
        "authors": "S. Puhan, S. Sharma, N. Kumar, and H. Dahiya",
        "description": "Accepted in PRD.",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2511.10981"
    },
    {
        "id": "njl-model-baryon-density",
        "title": "Valence quark distribution of the pion inside a medium with finite baryon density: A Nambu–Jona-Lasinio model approach",
        "date": "2025-12-01",
        "journal": "Communicated in PRD",
        "authors": "A. Dwivedi, S. Puhan, S. Ghosh, and H. Dahiya",
        "description": "Communicated in PRD.",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2512.24921"
    },
    {
        "id": "spectroscopy-rho-symmetric",
        "title": "Spectroscopy of rho-meson in symmetric nuclear medium",
        "date": "2026-01-05",
        "journal": "Communicated in PRD",
        "authors": "Anshu Gautam, Tanisha, S. Puhan, A. Kumar, and H. Dahiya",
        "description": "Communicated in PRD.",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2601.11082"
    },
    {
        "id": "radially-excited-pion-lfqm",
        "title": "Distribution Functions of Radially Excited Pion using the Light-Front Quark Model",
        "date": "2026-01-10",
        "journal": "Communicated in PLB",
        "authors": "A. Dwivedi, S. Puhan, and S. Ghosh",
        "description": "Communicated in PLB.",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2601.06628"
    }
]

file_template = """+++
title = "{title}"
date = {date}

[extra]
thumbnail = "images/portfolio/portfolio-1.png"
service = "{journal}"
client = "{authors}"
short_description = "{description}"
challenge = "{title}"
solution = "Research article published in {journal}."
+++

**Authors:** {authors}  
**Published in:** {journal}

[{link_label} →]({link_url})
"""

# Also proceedings
confs = [
    {
        "id": "hql2023-b-d-mesons",
        "title": "Spatial and Transverse structure of Heavy B-and D-mesons",
        "date": "2023-11-28",
        "journal": "PoS HQL2023",
        "authors": "S. Puhan and H. Dahiya",
        "description": "Proceeding of Science conference series",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2408.07717"
    },
    {
        "id": "dae2024-radiative-psi",
        "title": "Radiative transition of ψ(2S) → χc0(1P) + γ in LFQM",
        "date": "2024-12-07",
        "journal": "DAE Nuclear 2024",
        "authors": "A. Yadav, S. Puhan, and H. Dahiya",
        "description": "DAE Nuclear 2024 Symposium",
        "link_label": "Read on ResearchGate",
        "link_url": "https://www.researchgate.net/publication/383878508"
    },
    {
        "id": "dae2024-unpolarized-gpds",
        "title": "Spin-1 unpolarized GPDs in light front dynamics",
        "date": "2024-12-08",
        "journal": "DAE Nuclear 2024",
        "authors": "S. Puhan, Narinder Kumar, and H. Dahiya",
        "description": "DAE Nuclear 2024 Symposium",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "dae2024-spectroscopy-excited-d",
        "title": "Spectroscopy of excited states of D+ and D+S meson in the light-front quark model",
        "date": "2024-12-09",
        "journal": "DAE Nuclear 2024",
        "authors": "R. Acharyya, S. Puhan, Narinder Kumar, and H. Dahiya",
        "description": "DAE Nuclear 2024 Symposium",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "dae2024-in-medium-pseudoscalar",
        "title": "In-medium properties of pseudoscalar mesons in symmetric nuclear matter",
        "date": "2024-12-10",
        "journal": "DAE Nuclear 2024",
        "authors": "A. Gautam, D. Singh, S. Puhan, N. Kaur, A. Kumar, H. Dahiya, and S. Dutt",
        "description": "DAE Nuclear 2024 Symposium",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "daehep2024-pion-lf-dynamics",
        "title": "Valence quark structure of pion using light front dynamics",
        "date": "2024-12-15",
        "journal": "DAE HEP 2024",
        "authors": "S. Puhan and H. Dahiya",
        "description": "Submitted to DAE HEP 2024 Symposium",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "daehep2024-pion-asymm-nuclear",
        "title": "Behavior of pion in asymmetric nuclear medium",
        "date": "2024-12-16",
        "journal": "DAE HEP 2024",
        "authors": "A. Gautam, D. Singh, S. Puhan, N. Kaur, A. Kumar, H. Dahiya, and S. Dutt",
        "description": "Submitted to DAE HEP 2024 Symposium",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "daehep2024-kaons-dense",
        "title": "Kaons structure in dense nuclear medium",
        "date": "2024-12-17",
        "journal": "DAE HEP 2024",
        "authors": "A. Kumar, D. Singh, S. Puhan, N. Kaur, M. Kaur, H. Dahiya, and S. Dutt",
        "description": "Submitted to DAE HEP 2024 Symposium",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "hp2024-photon-tmds",
        "title": "Understanding photon TMDs with light-front wave function",
        "date": "2024-11-20",
        "journal": "HP 2024",
        "authors": "S. Puhan, N. Kaur, and H. Dahiya",
        "description": "Submitted to HP 2024 Proceeding",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "athics2025-pion-kaon",
        "title": "Leading-twist TMDs for pion and kaon using power law wave functions",
        "date": "2025-01-10",
        "journal": "ATHICS 2025",
        "authors": "S. Puhan, and H. Dahiya",
        "description": "Submitted to ATHICS 2025 Proceeding",
        "link_label": "View Details",
        "link_url": "#"
    }
]

from glob import glob
for f in glob('content/portfolio/*.md'):
    if not 'index.md' in f:
        os.remove(f)

for p in pubs + confs:
    path = f"content/portfolio/{p['id']}.en.md"
    content = file_template.format(**p)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Created 32 publication files in portfolio.")
