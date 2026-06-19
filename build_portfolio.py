import os
from glob import glob

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ────────────────────────────────────────────────────────────
# Creative, engaging descriptions for each publication
# ────────────────────────────────────────────────────────────

DESCRIPTIONS = {
    "t-even-tmds-spin-0": (
        "A comprehensive journey into the 3D partonic structure of pion and kaon, "
        "unveiling higher-twist transverse-momentum distributions for the first time in light-front dynamics."
    ),
    "t-even-tmds-spin-1": (
        "Pioneering the leading-twist TMD landscape for heavy spin-1 mesons, "
        "bridging light-front holographic and quark models with Bethe-Salpeter predictions."
    ),
    "spin-orbit-correlations": (
        "First-ever exploration of quark spin-orbit correlations inside light and heavy spin-1 mesons, "
        "revealing how angular momentum is shared between quarks and the hadron skeleton."
    ),
    "photon-leading-twist": (
        "Unlocking the photon’s inner life as a quark-antiquark Fock state — "
        "calculating all leading-twist T-even TMDs for real and virtual photons."
    ),
    "spectroscopy-radially-excited": (
        "First light-front quark model study of 3S and 1P excited states of charmonia and bottomonia, "
        "complete with 3D wave function visualizations and nodal structure analysis."
    ),
    "tmd-relations": (
        "Establishing a systematic atlas of T-even proton TMD relations up to twist-4, "
        "introducing a novel helicity-based parameterization table for the community."
    ),
    "pion-valence-asymm": (
        "Probing how isospin asymmetry and temperature reshape the pion’s valence quark distributions "
        "inside nuclear matter, with predictions evolved to high Q² scales."
    ),
    "pion-nuclear-medium": (
        "Investigating whether nuclear matter distorts the pion’s transverse momentum landscape, "
        "using chiral SU(3) mean-field inputs to light-cone quark dynamics."
    ),
    "transverse-spatial-light-heavy": (
        "A unified portrait of light and heavy pseudoscalar mesons — from transverse momentum maps "
        "to gravitational form factors — painted with light-cone quark model brushes."
    ),
    "asymmetric-nuclear-kaons": (
        "Decoding how baryon density, isospin asymmetry, and temperature rewrite the kaon’s "
        "valence quark story inside the nuclear medium."
    ),
    "nuclear-medium-spatial": (
        "Mapping the spatial distribution of pions inside asymmetric nuclear matter through generalized "
        "parton distributions and electromagnetic form factors."
    ),
    "valence-quark-pion-gtmd": (
        "A deep dive into the pion’s generalized transverse-momentum structure, extracting 12 nonzero GTMDs "
        "and predicting a charge radius of 0.558 fm in light-cone dynamics."
    ),
    "isospin-asymm-b-mesons": (
        "Revealing how isospin asymmetric nuclear matter transforms the masses, decay constants, and "
        "distribution amplitudes of B and B* mesons at finite temperature."
    ),
    "radiative-transitions-charmonia": (
        "Calculating radiative transition form factors and decay widths for ground and excited charmonia, "
        "with predictions benchmarked against experiment and lattice QCD."
    ),
    "valence-quark-kaons-symm": (
        "Charting the leading-twist TMDs and GPDs of charged kaons in symmetric nuclear matter, "
        "from vacuum to high baryonic density."
    ),
    "emffs-pion-kaon": (
        "Extracting scalar, vector, and tensor electromagnetic form factors of pion and kaon from twist-2 "
        "and twist-3 GPDs, matching lattice and experimental benchmarks."
    ),
    "valence-quark-rho-jpsi": (
        "Unraveling the unpolarized quark GPDs of rho and J/ψ mesons, deriving charge, magnetic, and "
        "quadrupole form factors with NNLO-evolved PDFs."
    ),
    "d-mesons-isospin-asymm": (
        "Tracking how isospin asymmetric nuclear matter reshapes the properties of D and D* mesons, "
        "highlighting the role of up/down vs. strange quark content."
    ),
    "valence-quark-rho-lfqm": (
        "A comprehensive partonic portrait of the rho meson in light-front quark model, featuring all nine "
        "leading-twist TMDs — including tensor polarizations unique to spin-1."
    ),
    "njl-model-baryon-density": (
        "Using the Nambu–Jona-Lasinio model to feed finite baryon density into light-cone quark dynamics, "
        "revealing how the pion’s PDFs and form factors evolve with density."
    ),
    "spectroscopy-rho-symmetric": (
        "Studying the rho meson’s spectroscopy in symmetric nuclear matter: mass shifts, decay constants, "
        "distribution amplitudes, and electromagnetic form factors."
    ),
    "radially-excited-pion-lfqm": (
        "Exploring the radially excited 1S, 2S, and 3S pion states with mixed harmonic-oscillator wave functions, "
        "showing how state mixing shapes distribution amplitudes and PDFs."
    ),
    "gluon-helicity-jpsi-production": (
        "A feasibility study mapping the gluon helicity distribution at moderate-to-large x via J/ψ production "
        "at the NICA Spin Physics Detector, reaching |A_LL| ~ 0.09."
    ),
    "pseudoscalar-charmonium-bottomonium-light-front": (
        "Visualizing the energy-momentum tensor and mechanical distributions of η_c and η_b, "
        "where pressure flips from repulsive to attractive across a transverse node."
    ),
    # Conferences
    "hql2023-b-d-mesons": (
        "Conference proceeding on the spatial and transverse structure of heavy B and D mesons, "
        "connecting GPDs and PDFs through TMDs in light-front dynamics."
    ),
    "dae2024-radiative-psi": (
        "Symposium contribution on the radiative transition ψ(2S) → χ_c0(1P) + γ in LFQM, "
        "with transition form factors and decay width analysis."
    ),
    "dae2024-unpolarized-gpds": (
        "Conference presentation on spin-1 unpolarized GPDs in light-front formalism, "
        "deriving electromagnetic form factors for vector mesons."
    ),
    "dae2024-spectroscopy-excited-d": (
        "Symposium contribution on the spectroscopy of excited D⁺ and D⁺_s meson states, "
        "including 3D wave function visualizations and decay properties."
    ),
    "dae2024-in-medium-pseudoscalar": (
        "Conference proceeding on in-medium pseudoscalar meson properties in symmetric nuclear matter, "
        "using chiral SU(3) CQMF inputs to light-front quark model."
    ),
    "daehep2024-pion-lf-dynamics": (
        "DAE HEP 2024 contribution on pion valence quark structure using light-front dynamics, "
        "highlighting S-wave dominance and Mellin moment predictions."
    ),
    "daehep2024-pion-asymm-nuclear": (
        "DAE HEP 2024 contribution on pion behavior in asymmetric nuclear medium, "
        "exploring decay constants and transition form factors in-medium."
    ),
    "daehep2024-kaons-dense": (
        "DAE HEP 2024 contribution on kaon structure in dense nuclear matter, "
        "analyzing the impact of isospin asymmetry and temperature."
    ),
    "hp2024-photon-tmds": (
        "HP 2024 proceeding on photon TMDs using light-front wave functions, "
        "contrasting real vs. virtual photon transverse structure."
    ),
    "athics2025-pion-kaon": (
        "ATHICS 2025 proceeding on leading-twist TMDs for pion and kaon with power-law wave functions, "
        "with predictions for AMBER, JLab, and EIC experiments."
    ),
}

# ────────────────────────────────────────────────────────────
# Research-challenge placeholder (used as Abstract in template)
# ────────────────────────────────────────────────────────────

CHALLENGES = {
    "t-even-tmds-spin-0": (
        "How do transverse momentum-dependent parton distributions behave for pseudo-scalar mesons "
        "beyond leading twist, and can we predict higher-twist kaon properties for the first time?"
    ),
    "t-even-tmds-spin-1": (
        "What are the leading-twist TMDs for heavy spin-1 vector mesons, and how do light-front models "
        "compare with Bethe-Salpeter predictions?"
    ),
    "spin-orbit-correlations": (
        "How is the quark’s spin correlated with its orbital angular momentum inside spin-1 mesons, "
        "and can we extend spin-0 results to light and heavy vector mesons?"
    ),
    "photon-leading-twist": (
        "Can we treat the photon as a quark-antiquark Fock state and calculate all leading-twist T-even TMDs "
        "for both real and virtual photons?"
    ),
    "spectroscopy-radially-excited": (
        "What are the electromagnetic and partonic properties of the 3S and 1P excited states of charmonia and bottomonia?"
    ),
    "tmd-relations": (
        "Can we establish systematic relations between all T-even proton TMDs up to twist-4 using a light-front quark-diquark model?"
    ),
    "pion-valence-asymm": (
        "How do isospin asymmetry and temperature modify the valence quark distributions of pions in nuclear matter?"
    ),
    "pion-nuclear-medium": (
        "Does nuclear matter affect the transverse momentum-dependent parton distributions of pion valence quarks?"
    ),
    "transverse-spatial-light-heavy": (
        "Can we unify the transverse and spatial structure description of light and heavy pseudoscalar mesons?"
    ),
    "asymmetric-nuclear-kaons": (
        "How does asymmetric nuclear matter modify the valence quark structure of kaons and antikaons?"
    ),
    "nuclear-medium-spatial": (
        "How does nuclear matter affect the spatial distribution of pions as seen through generalized parton distributions?"
    ),
    "valence-quark-pion-gtmd": (
        "Can generalized transverse momentum-dependent distributions reveal the full 3D structure of the pion up to twist-4?"
    ),
    "isospin-asymm-b-mesons": (
        "How does isospin asymmetric nuclear medium modify the properties of pseudoscalar and vector B-mesons at finite temperature?"
    ),
    "radiative-transitions-charmonia": (
        "What are the radiative transition form factors, decay widths, and branching ratios for ground and excited charmonia states?"
    ),
    "valence-quark-kaons-symm": (
        "How do symmetric nuclear matter and finite baryon density reshape the valence quark properties of charged kaons?"
    ),
    "emffs-pion-kaon": (
        "Can we calculate scalar, vector, and tensor electromagnetic form factors of pion and kaon from generalized parton distributions?"
    ),
    "valence-quark-rho-jpsi": (
        "What is the valence quark distribution structure of light rho and heavy J/psi vector mesons in the light-cone framework?"
    ),
    "d-mesons-isospin-asymm": (
        "How do isospin asymmetry and baryon density modify D and D* meson properties in nuclear medium?"
    ),
    "valence-quark-rho-lfqm": (
        "What is the complete set of leading-twist TMDs for the rho meson, including tensor polarizations unique to spin-1?"
    ),
    "njl-model-baryon-density": (
        "Can the Nambu–Jona-Lasinio model provide realistic in-medium quark masses to study pion PDFs at finite baryon density?"
    ),
    "spectroscopy-rho-symmetric": (
        "How does symmetric nuclear matter modify the spectroscopic properties of the rho meson?"
    ),
    "radially-excited-pion-lfqm": (
        "What is the partonic structure of radially excited pion states, and how sensitive are observables to state mixing?"
    ),
    "gluon-helicity-jpsi-production": (
        "Can inclusive J/psi production at NICA SPD provide a sensitive probe of the gluon helicity distribution at moderate-to-large x?"
    ),
    "pseudoscalar-charmonium-bottomonium-light-front": (
        "What are the mechanical distributions and gravitational form factors of pseudoscalar charmonium and bottomonium?"
    ),
    # Conferences
    "hql2023-b-d-mesons": (
        "How can generalized parton distributions describe the spatial and transverse structure of heavy B and D mesons?"
    ),
    "dae2024-radiative-psi": (
        "What are the radiative transition properties of ψ(2S) → χ_c0(1P) + γ in the light-front quark model?"
    ),
    "dae2024-unpolarized-gpds": (
        "How do spin-1 unpolarized GPDs behave in light-front dynamics, and what form factors do they predict?"
    ),
    "dae2024-spectroscopy-excited-d": (
        "What are the spectroscopic and partonic properties of excited D meson states in the light-front quark model?"
    ),
    "dae2024-in-medium-pseudoscalar": (
        "How do pseudoscalar meson properties change in symmetric nuclear matter at finite density and temperature?"
    ),
    "daehep2024-pion-lf-dynamics": (
        "What is the valence quark structure of the pion using light-front dynamics and S/P-wave decompositions?"
    ),
    "daehep2024-pion-asymm-nuclear": (
        "How does the pion behave in asymmetric nuclear medium, and what are the in-medium transition form factors?"
    ),
    "daehep2024-kaons-dense": (
        "How does dense nuclear matter affect the structure of kaons and antikaons?"
    ),
    "hp2024-photon-tmds": (
        "How can light-front wave functions illuminate the transverse structure of photon TMDs?"
    ),
    "athics2025-pion-kaon": (
        "What are the leading-twist TMDs for pion and kaon using power-law wave functions, and how do they compare with upcoming experiments?"
    ),
}

# ────────────────────────────────────────────────────────────
# Key-contribution placeholder (used as Summary in template)
# ────────────────────────────────────────────────────────────

SOLUTIONS = {
    "t-even-tmds-spin-0": (
        "All T-even TMDs for pion and kaon are calculated up to twist-4 in LFHM and LFQM, "
        "with higher-twist kaon properties predicted for the first time and sum rules verified."
    ),
    "t-even-tmds-spin-1": (
        "Leading-twist TMDs for J/ψ and Υ are derived in LFHM and LFQM, showing excellent agreement "
        "with Bethe-Salpeter model predictions and providing k⟂ moment analysis."
    ),
    "spin-orbit-correlations": (
        "First calculation of spin-orbit correlations for spin-1 rho, J/ψ, and Υ mesons using GTMDs and GPDs, "
        "extending the theoretical landscape beyond pions and kaons."
    ),
    "photon-leading-twist": (
        "All leading-twist T-even photon TMDs are computed for real and virtual photons, revealing that "
        "only 3 TMDs are nonzero for real photons versus 8 for virtual photons."
    ),
    "spectroscopy-radially-excited": (
        "First LFQM study of 3S and 1P quarkonia states, presenting EMFFs, charge radii, decay constants, PDFs, "
        "DAs, and 3D wave function visualizations with nodal structures."
    ),
    "tmd-relations": (
        "A complete helicity-based parameterization table is introduced, enabling systematic derivation of proton TMD relations "
        "at intra-twist and inter-twist levels up to twist-4."
    ),
    "pion-valence-asymm": (
        "Baryon density dominates over temperature and isospin asymmetry in modifying pion DAs and PDFs, "
        "with results evolved to Q² = 10 and 16 GeV²."
    ),
    "pion-nuclear-medium": (
        "The pion TMDs are significantly modified by nuclear medium, with spin densities showing strong dependence "
        "on baryonic density at different momentum fractions."
    ),
    "transverse-spatial-light-heavy": (
        "A unified description of light and heavy pseudoscalar meson TMDs, GPDs, EMFFs, and GFFs is achieved, "
        "with EMFFs compatible with lattice QCD and PDF sum rules verified."
    ),
    "asymmetric-nuclear-kaons": (
        "Baryon density produces the most significant changes to kaon DAs and PDFs, while isospin asymmetry and temperature "
        "play secondary roles; results evolved to Q² = 16 GeV²."
    ),
    "nuclear-medium-spatial": (
        "In-medium pion GPDs, EMFFs, and charge radii are calculated using LCQM with chiral SU(3) CQMF inputs, "
        "showing agreement with experimental data."
    ),
    "valence-quark-pion-gtmd": (
        "12 of 16 possible GTMDs are found nonzero, and the pion charge radius is predicted to be 0.558 fm, "
        "with TMDs, GPDs, FFs, and PDFs extracted consistently."
    ),
    "isospin-asymm-b-mesons": (
        "Effective masses, weak decay constants, and DAs of B and B* mesons are evaluated in isospin-asymmetric nuclear matter, "
        "with vacuum predictions agreeing with experimental data."
    ),
    "radiative-transitions-charmonia": (
        "Decay constants, transition form factors, decay widths, and branching ratios for ground and excited charmonia "
        "are calculated and found to agree with experimental and lattice data."
    ),
    "valence-quark-kaons-symm": (
        "Leading-twist TMDs and GPDs of charged kaons are computed in symmetric nuclear matter, with in-medium EMFFs, "
        "charge radii, and average momenta in good agreement with data."
    ),
    "emffs-pion-kaon": (
        "Scalar, vector, and tensor form factors are calculated from twist-2 and twist-3 GPDs, predicting scalar radii of "
        "0.528 fm (pion) and 0.409 fm (kaon), consistent with experiment and lattice."
    ),
    "valence-quark-rho-jpsi": (
        "Charge, magnetic, and quadrupole form factors are derived for rho and J/ψ, with PDFs evolved to 5 GeV² via NNLO DGLAP, "
        "showing agreement with NJL and lattice predictions."
    ),
    "d-mesons-isospin-asymm": (
        "Significant medium-induced changes are found for D and D* mesons containing u/d quarks, while strange-quark mesons "
        "show reduced sensitivity; baryon density dominates over temperature and isospin effects."
    ),
    "valence-quark-rho-lfqm": (
        "All nine leading-twist TMDs are computed for the rho meson, including three tensor TMDs unique to spin-1, "
        "with PDFs evolved via NLO DGLAP and positivity constraints examined."
    ),
    "njl-model-baryon-density": (
        "In-medium pion EMFFs, DAs, and PDFs are calculated using NJL-derived quark masses, with PDFs evolved via NLO DGLAP "
        "and Mellin moments compared with existing extractions."
    ),
    "spectroscopy-rho-symmetric": (
        "Significant medium effects are found on the rho meson mass, decay constant, and DAs, while charge radii and moments "
        "show weaker sensitivity to baryonic density changes."
    ),
    "radially-excited-pion-lfqm": (
        "3S observables exhibit pronounced sensitivity to state mixing, while ground-state PDFs and DAs match experimental data "
        "after QCD evolution; decay constants decrease sequentially with radial excitation."
    ),
    "gluon-helicity-jpsi-production": (
        "Inclusive J/ψ measurements at NICA SPD are shown to provide sensitive probes of gluon polarization at moderate-to-large x, "
        "with asymmetries reaching |A_LL| ~ 0.09 at p_T = 3 GeV."
    ),
    "pseudoscalar-charmonium-bottomonium-light-front": (
        "Gravitational form factors and spatial mechanical distributions are evaluated for η_c and η_b, revealing a pressure node "
        "where repulsion transitions to attraction in the transverse plane."
    ),
    # Conferences
    "hql2023-b-d-mesons": (
        "Unpolarized GPDs and PDFs for heavy B and D mesons are presented in LFQM, with EMFFs and GFFs extracted from zero-skewness moments."
    ),
    "dae2024-radiative-psi": (
        "Transition form factors and decay widths for ψ(2S) → χ_c0(1P) + γ are calculated in LFQM and compared with experimental data."
    ),
    "dae2024-unpolarized-gpds": (
        "Chiral-even vector quark GPDs for spin-1 mesons are derived, yielding charge, magnetic, and quadrupole form factors."
    ),
    "dae2024-spectroscopy-excited-d": (
        "Excited D meson spectroscopy is analyzed in LFQM, including EMFFs, charge radii, decay constants, PDFs, DAs, and 3D wave functions."
    ),
    "dae2024-in-medium-pseudoscalar": (
        "In-medium pseudoscalar meson properties are analyzed using LFQM + CQMF, showing density and temperature dependence of masses and decay constants."
    ),
    "daehep2024-pion-lf-dynamics": (
        "S-wave dominance (94%) in pion TMDs and PDFs is demonstrated, with Mellin and inverse moments computed for the valence quark."
    ),
    "daehep2024-pion-asymm-nuclear": (
        "In-medium pion decay constant, DA, and transition form factor are calculated in asymmetric nuclear matter, with qualitative agreement with experiment."
    ),
    "daehep2024-kaons-dense": (
        "Medium-modified kaon and antikaon properties are investigated in dense nuclear matter using CQMF + LCQM, with isospin and temperature effects explored."
    ),
    "hp2024-photon-tmds": (
        "All 9 T-even photon TMDs are presented using light-front wave functions, with real vs. virtual photon differences highlighted."
    ),
    "athics2025-pion-kaon": (
        "Leading-twist TMDs for pion and kaon are computed with power-law wave functions, providing predictions for AMBER, JLab, and EIC experiments."
    ),
}

# ────────────────────────────────────────────────────────────
# Thumbnail mapping (specific paper images where available)
# ────────────────────────────────────────────────────────────

THUMBNAILS = {
    "t-even-tmds-spin-0": "images/portfolio/papers/teven-tmds-pseudoscalar-mesons.png",
    "t-even-tmds-spin-1": "images/portfolio/papers/heavy-vector-mesons-tmds.png",
    "spin-orbit-correlations": "images/portfolio/papers/spin-orbit-correlations-mesons.png",
    "photon-leading-twist": "images/portfolio/papers/photon-tmds.png",
    "spectroscopy-radially-excited": "images/portfolio/papers/quarkonium-spectroscopy-lfqm.png",
    "tmd-relations": "images/portfolio/papers/tmd-relations-lfqdm.png",
    "pion-valence-asymm": "images/portfolio/papers/pion-distributions-finite-temperature.png",
    "pion-nuclear-medium": "images/portfolio/papers/pion-tmds-nuclear-medium.png",
    "transverse-spatial-light-heavy": "images/portfolio/papers/pseudoscalar-mesons-structure.png",
    "asymmetric-nuclear-kaons": "images/portfolio/papers/kaons-asymmetric-nuclear-medium.png",
    "nuclear-medium-spatial": "images/portfolio/papers/pion-gpds-nuclear-medium.png",
    "valence-quark-pion-gtmd": "images/portfolio/papers/pion-generalized-tmds.png",
    "isospin-asymm-b-mesons": "images/portfolio/papers/b-mesons-isospin-asymmetric.png",
    "radiative-transitions-charmonia": "images/portfolio/papers/charmonia-radiative-transitions.png",
    "valence-quark-kaons-symm": "images/portfolio/papers/kaons-symmetric-nuclear-matter.png",
    "emffs-pion-kaon": "images/portfolio/papers/form-factors-pion-kaon.png",
    "valence-quark-rho-jpsi": "images/portfolio/papers/rho-jpsi-vector-mesons-gpds.png",
    "d-mesons-isospin-asymm": "images/portfolio/papers/d-mesons-nuclear-medium.png",
    "valence-quark-rho-lfqm": "images/portfolio/papers/rho-meson-valence-quark.png",
    "njl-model-baryon-density": "images/portfolio/papers/pion-medium-njl-model.png",
    "spectroscopy-rho-symmetric": "images/portfolio/papers/rho-meson-nuclear-medium.png",
    "radially-excited-pion-lfqm": "images/portfolio/papers/radially-excited-pion-lfqm.png",
    "gluon-helicity-jpsi-production": "images/portfolio/papers/gluon-helicity-title.png",
    "pseudoscalar-charmonium-bottomonium-light-front": "images/portfolio/papers/pseudoscalar-charmonium-bottomonium-title.png",
    # Conferences use generic portfolio images
    "hql2023-b-d-mesons": "images/portfolio/portfolio-2.png",
    "dae2024-radiative-psi": "images/portfolio/portfolio-3.png",
    "dae2024-unpolarized-gpds": "images/portfolio/portfolio-4.png",
    "dae2024-spectroscopy-excited-d": "images/portfolio/portfolio-1.png",
    "dae2024-in-medium-pseudoscalar": "images/portfolio/portfolio-2.png",
    "daehep2024-pion-lf-dynamics": "images/portfolio/portfolio-3.png",
    "daehep2024-pion-asymm-nuclear": "images/portfolio/portfolio-4.png",
    "daehep2024-kaons-dense": "images/portfolio/portfolio-1.png",
    "hp2024-photon-tmds": "images/portfolio/portfolio-2.png",
    "athics2025-pion-kaon": "images/portfolio/portfolio-3.png",
}

# ────────────────────────────────────────────────────────────
# DOI mapping (only where confidently known)
# ────────────────────────────────────────────────────────────

DOIS = {
    "t-even-tmds-spin-0": "10.1007/JHEP02(2024)075",
    "t-even-tmds-spin-1": "10.1103/PhysRevD.109.034005",
    "pion-nuclear-medium": "10.1016/j.physletb.2024.139114",
    "valence-quark-rho-jpsi": "10.1103/PhysRevD.112.054035",
}

# ────────────────────────────────────────────────────────────
# Tags for each publication
# ────────────────────────────────────────────────────────────

TAGS = {
    "t-even-tmds-spin-0": ["TMDs", "PDFs", "Pion", "Kaon", "Light-Front Dynamics", "Higher Twist"],
    "t-even-tmds-spin-1": ["TMDs", "Heavy Mesons", "J/psi", "Upsilon", "Light-Front Dynamics"],
    "spin-orbit-correlations": ["GTMDs", "GPDs", "Spin-Orbit", "Vector Mesons", "Light-Front Dynamics"],
    "photon-leading-twist": ["TMDs", "Photon", "Light-Front Dynamics", "QCD"],
    "spectroscopy-radially-excited": ["Spectroscopy", "Charmonia", "Bottomonia", "Light-Front Dynamics", "PDFs", "DAs"],
    "tmd-relations": ["TMDs", "Proton Structure", "Light-Front Dynamics", "Quark-Diquark Model"],
    "pion-valence-asymm": ["PDFs", "DAs", "Pion", "Nuclear Medium", "Isospin Asymmetry", "Finite Temperature"],
    "pion-nuclear-medium": ["TMDs", "Pion", "Nuclear Medium", "Isospin Asymmetry"],
    "transverse-spatial-light-heavy": ["TMDs", "GPDs", "EMFFs", "GFFs", "Pion", "Kaon", "B Meson", "D Meson", "Light-Front Dynamics"],
    "asymmetric-nuclear-kaons": ["PDFs", "DAs", "Kaon", "Nuclear Medium", "Isospin Asymmetry", "Finite Temperature"],
    "nuclear-medium-spatial": ["GPDs", "EMFFs", "Pion", "Nuclear Medium", "Isospin Asymmetry"],
    "valence-quark-pion-gtmd": ["GTMDs", "TMDs", "GPDs", "PDFs", "Pion", "Light-Front Dynamics"],
    "isospin-asymm-b-mesons": ["B Meson", "Nuclear Medium", "Isospin Asymmetry", "Finite Temperature", "Light-Front Dynamics"],
    "radiative-transitions-charmonia": ["Charmonia", "Spectroscopy", "Radiative Transitions", "Decay Widths", "Light-Front Dynamics"],
    "valence-quark-kaons-symm": ["TMDs", "GPDs", "EMFFs", "Kaon", "Nuclear Medium", "Symmetric Matter"],
    "emffs-pion-kaon": ["Form Factors", "GPDs", "Pion", "Kaon", "Light-Front Dynamics"],
    "valence-quark-rho-jpsi": ["GPDs", "PDFs", "Rho Meson", "J/psi", "Light-Front Dynamics"],
    "d-mesons-isospin-asymm": ["D Meson", "Nuclear Medium", "Isospin Asymmetry", "Finite Temperature", "Light-Front Dynamics"],
    "valence-quark-rho-lfqm": ["TMDs", "PDFs", "Rho Meson", "Tensor Polarization", "Light-Front Dynamics"],
    "njl-model-baryon-density": ["PDFs", "DAs", "EMFFs", "Pion", "NJL Model", "Nuclear Medium", "Finite Baryon Density"],
    "spectroscopy-rho-symmetric": ["Spectroscopy", "Rho Meson", "Nuclear Medium", "Symmetric Matter", "Light-Front Dynamics"],
    "radially-excited-pion-lfqm": ["PDFs", "DAs", "EMFFs", "Pion", "Radial Excitations", "Light-Front Dynamics"],
    "gluon-helicity-jpsi-production": ["Gluon Helicity", "J/psi", "NICA", "Spin Physics", "QCD", "Preprint"],
    "pseudoscalar-charmonium-bottomonium-light-front": ["GFFs", "Charmonia", "Bottomonia", "Pressure Distribution", "Light-Front Dynamics", "Preprint"],
    "hql2023-b-d-mesons": ["GPDs", "PDFs", "B Meson", "D Meson", "Heavy Mesons", "Conference"],
    "dae2024-radiative-psi": ["Charmonia", "Radiative Transitions", "Spectroscopy", "Conference"],
    "dae2024-unpolarized-gpds": ["GPDs", "Spin-1", "Vector Mesons", "Conference"],
    "dae2024-spectroscopy-excited-d": ["Spectroscopy", "D Meson", "Excited States", "Conference"],
    "dae2024-in-medium-pseudoscalar": ["Pseudoscalar Mesons", "Nuclear Medium", "Symmetric Matter", "Conference"],
    "daehep2024-pion-lf-dynamics": ["Pion", "TMDs", "PDFs", "Light-Front Dynamics", "Conference"],
    "daehep2024-pion-asymm-nuclear": ["Pion", "Nuclear Medium", "Asymmetric Matter", "Conference"],
    "daehep2024-kaons-dense": ["Kaon", "Nuclear Medium", "Dense Matter", "Conference"],
    "hp2024-photon-tmds": ["Photon", "TMDs", "Light-Front Dynamics", "Conference"],
    "athics2025-pion-kaon": ["Pion", "Kaon", "TMDs", "Power-Law Wave Functions", "Conference"],
}

# ────────────────────────────────────────────────────────────
# Categories
# ────────────────────────────────────────────────────────────

CATEGORIES = {
    "hql2023-b-d-mesons": ["Conference Proceeding"],
    "dae2024-radiative-psi": ["Conference Proceeding"],
    "dae2024-unpolarized-gpds": ["Conference Proceeding"],
    "dae2024-spectroscopy-excited-d": ["Conference Proceeding"],
    "dae2024-in-medium-pseudoscalar": ["Conference Proceeding"],
    "daehep2024-pion-lf-dynamics": ["Conference Proceeding"],
    "daehep2024-pion-asymm-nuclear": ["Conference Proceeding"],
    "daehep2024-kaons-dense": ["Conference Proceeding"],
    "hp2024-photon-tmds": ["Conference Proceeding"],
    "athics2025-pion-kaon": ["Conference Proceeding"],
    "gluon-helicity-jpsi-production": ["Preprint"],
    "pseudoscalar-charmonium-bottomonium-light-front": ["Preprint"],
    "radiative-transitions-charmonia": ["Preprint"],
    "valence-quark-rho-lfqm": ["Preprint"],
    "njl-model-baryon-density": ["Preprint"],
    "spectroscopy-rho-symmetric": ["Preprint"],
    "radially-excited-pion-lfqm": ["Preprint"],
    "isospin-asymm-b-mesons": ["Journal Article"],
    "d-mesons-isospin-asymm": ["Journal Article"],
}

# ────────────────────────────────────────────────────────────
# Publication data
# ────────────────────────────────────────────────────────────

pubs = [
    {
        "id": "t-even-tmds-spin-0",
        "title": "T-even TMDs for the spin-0 pseudo-scalar mesons upto twist-4 using light-front formalism",
        "date": "2024-02-15",
        "journal": "JHEP 075 (2024)",
        "authors": "S. Puhan, S. Sharma, N. Kaur, N. Kumar and H. Dahiya",
        "link_label": "Read Paper",
        "link_url": "https://link.springer.com/article/10.1007/JHEP02(2024)075"
    },
    {
        "id": "t-even-tmds-spin-1",
        "title": "Leading twist T-even TMDs for the spin-1 heavy vector mesons",
        "date": "2024-03-01",
        "journal": "Phys. Rev. D 109 (2024)",
        "authors": "S. Puhan and H. Dahiya",
        "link_label": "Read on PRD",
        "link_url": "https://journals.aps.org/prd/abstract/10.1103/PhysRevD.109.034005"
    },
    {
        "id": "spin-orbit-correlations",
        "title": "Quark spin-orbit correlations in spin-0 and spin-1 mesons using the light-front quark model",
        "date": "2024-05-15",
        "journal": "Phys. Rev. D 110 (2024)",
        "authors": "R. Acharyya, S. Puhan and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2782544"
    },
    {
        "id": "photon-leading-twist",
        "title": "Photon Leading Twist Transverse Momentum Dependent Parton Distributions",
        "date": "2025-01-01",
        "journal": "Eur. Phys. J. A 61 (2025)",
        "authors": "S. Puhan, N. Kumar and H. Dahiya",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2408.07714"
    },
    {
        "id": "spectroscopy-radially-excited",
        "title": "Spectroscopy of radially excited charmonia and bottomonia in light-front quark model",
        "date": "2025-02-01",
        "journal": "Chin. Phys. C 49 (2025)",
        "authors": "R. Acharyya, S. Puhan, N. Kumar and H. Dahiya",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2408.07715"
    },
    {
        "id": "tmd-relations",
        "title": "TMD Relations: Insights from a Light-Front Quark-Diquark Model",
        "date": "2024-10-01",
        "journal": "PTEP ptae150 (2024)",
        "authors": "S. Sharma, S. Puhan, N. Kumar and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2789229"
    },
    {
        "id": "pion-valence-asymm",
        "title": "Pions valence quark distributions in asymmetric nuclear matter at finite temperature",
        "date": "2024-09-01",
        "journal": "Phys. Rev. D 110 (2024)",
        "authors": "S. Puhan, N. Kaur, A. Kumar, S. Dutt, and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2818000"
    },
    {
        "id": "pion-nuclear-medium",
        "title": "Does nuclear medium affect the transverse momentum-dependent parton distributions of valence quark of pions?",
        "date": "2024-11-01",
        "journal": "Phys. Lett. B 859 (2024)",
        "authors": "N. Kaur, S. Puhan, A. Kumar, S. Dutt, and H. Dahiya",
        "link_label": "Read on ScienceDirect",
        "link_url": "https://doi.org/10.1016/j.physletb.2024.139114"
    },
    {
        "id": "transverse-spatial-light-heavy",
        "title": "Transverse and spatial structure of light to heavy mesons in light-front dynamics",
        "date": "2025-01-05",
        "journal": "Phys. Rev. D 111 (2025)",
        "authors": "S. Puhan, N. Kaur and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2839021"
    },
    {
        "id": "asymmetric-nuclear-kaons",
        "title": "Effect of Asymmetric Nuclear Medium on the Valence Quark Structure of the Kaons",
        "date": "2025-03-01",
        "journal": "Phys. Rev. D 111 (2025)",
        "authors": "D. Singh, S. Puhan, N. Kaur, M. Kaur, S. Dutt, A. Kumar, and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2843133"
    },
    {
        "id": "nuclear-medium-spatial",
        "title": "Effect of nuclear medium on the spatial distribution of pions",
        "date": "2025-01-20",
        "journal": "Nucl. Phys. B 1017 (2025)",
        "authors": "S. Puhan, N. Kaur, A. Kumar, S. Dutt, and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2873357"
    },
    {
        "id": "valence-quark-pion-gtmd",
        "title": "Understanding the Valence Quark Structure of the Pion through GTMDs",
        "date": "2025-04-01",
        "journal": "PTEP ptaf100 (2025)",
        "authors": "S. Puhan, S. Sharma, N. Kumar and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2914151"
    },
    {
        "id": "isospin-asymm-b-mesons",
        "title": "Impact of isospin asymmetric nuclear medium on pseudoscalar and vector B-mesons",
        "date": "2026-01-01",
        "journal": "Nucl. Phys. A 1068 (2026)",
        "authors": "Tanisha, S. Puhan, N. Kaur, A. Kumar and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2916907"
    },
    {
        "id": "radiative-transitions-charmonia",
        "title": "Radiative Transitions for the Ground and Excited Charmonia States",
        "date": "2025-04-10",
        "journal": "Submitted to PRD",
        "authors": "A. Yadav, S. Puhan, and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2914109"
    },
    {
        "id": "valence-quark-kaons-symm",
        "title": "Valence quark properties of charged kaons in symmetric nuclear matter",
        "date": "2025-05-01",
        "journal": "Eur. Phys. J. Plus 140 (2025)",
        "authors": "R. Pandey, S. Puhan, N. Kaur, A. Kumar, S. Dutt, and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2917873"
    },
    {
        "id": "emffs-pion-kaon",
        "title": "Scalar, vector and tensor electromagnetic form factors of pion and kaon",
        "date": "2025-05-15",
        "journal": "Phys. Rev. D 111 (2025)",
        "authors": "S. Puhan and H. Dahiya",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2918260"
    },
    {
        "id": "valence-quark-rho-jpsi",
        "title": "Valence quark distribution of light rho and heavy J/psi vector mesons in light-cone quark model",
        "date": "2025-06-01",
        "journal": "Phys. Rev. D 112 (2025)",
        "authors": "Tanisha, S. Puhan, A. Yadav, and H. Dahiya",
        "link_label": "Read on PRD",
        "link_url": "https://doi.org/10.1103/PhysRevD.112.054035"
    },
    {
        "id": "d-mesons-isospin-asymm",
        "title": "D and D* mesons in isospin asymmetric nuclear medium",
        "date": "2025-06-15",
        "journal": "PTEP ptaf135 (2025)",
        "authors": "A. Gautam, D. Singh, N. Kaur, S. Puhan, S. Dutt, H. Dahiya, and A. Kumar",
        "link_label": "Read on INSPIRE",
        "link_url": "https://inspirehep.net/literature/2932525"
    },
    {
        "id": "valence-quark-rho-lfqm",
        "title": "Valence quark structure of rho meson using light-front quark model",
        "date": "2025-11-01",
        "journal": "Accepted in PRD",
        "authors": "S. Puhan, S. Sharma, N. Kumar, and H. Dahiya",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2511.10981"
    },
    {
        "id": "njl-model-baryon-density",
        "title": "Valence quark distribution of the pion inside a medium with finite baryon density: A Nambu–Jona-Lasinio model approach",
        "date": "2025-12-01",
        "journal": "Accepted in PTEP",
        "authors": "A. Dwivedi, S. Puhan, S. Ghosh, and H. Dahiya",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2512.24921"
    },
    {
        "id": "spectroscopy-rho-symmetric",
        "title": "Spectroscopy of rho-meson in symmetric nuclear medium",
        "date": "2026-01-05",
        "journal": "Accepted in Physical Review D",
        "authors": "Anshu Gautam, Tanisha, S. Puhan, A. Kumar, and H. Dahiya",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2601.11082"
    },
    {
        "id": "radially-excited-pion-lfqm",
        "title": "Distribution Functions of Radially Excited Pion using the Light-Front Quark Model",
        "date": "2026-01-10",
        "journal": "Communicated in PLB",
        "authors": "A. Dwivedi, S. Puhan, and S. Ghosh",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2601.06628"
    },
    {
        "id": "gluon-helicity-jpsi-production",
        "title": "Moderate-to-Large-x Gluon Helicity from J/psi Production at sqrt(s) = 27 GeV",
        "date": "2026-05-29",
        "journal": "e-Print: 2605.30945 [hep-ph]",
        "authors": "S. Sharma, A. Aparin, S. Puhan, N. Kumar, and H. Dahiya",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2605.30945",
        "extra_markdown": """

### Kinematics and Rapidity Coverage

The partonic momentum fractions $x_{1,2}$ probed in NICA SPD kinematics ($\\sqrt{s} = 27$ GeV) as a function of rapidity $y$ for different transverse momentum $p_T$ values:

<div style="text-align: center; margin: 30px 0;">
  <img src="/images/portfolio/papers/gluon-helicity-plots.png" alt="Partonic momentum fractions x_1,2 and A_LL vs y" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p style="font-size: 0.9rem; color: #a0aec0; margin-top: 10px;">
    <strong>Figure 1:</strong> (Left) Partonic momentum fractions $x_{1,2}$ as a function of rapidity for various $p_T$. (Right-a) Longitudinal double-spin asymmetry $A_{LL}^{J/\\psi}$ vs $y$ for $p_T = 1.5, 3.0, 5.0$ GeV. (Right-b) Theoretical uncertainties for $p_T = 3.0$ GeV.
  </p>
</div>

### Uncertainty Analysis

The relative fractional uncertainties at ($\\sqrt{s} = 27$ GeV) and $p_T = 3$ GeV, highlighting the PDF, scale, and total uncertainties:

<div style="text-align: center; margin: 30px 0;">
  <img src="/images/portfolio/papers/gluon-helicity-uncertainties.png" alt="Relative uncertainties vs rapidity" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p style="font-size: 0.9rem; color: #a0aec0; margin-top: 10px;">
    <strong>Figure 2:</strong> Relative uncertainties of $A_{LL}^{J/\\psi}$ as a function of rapidity $y$ at $p_T = 3$ GeV, separating PDF uncertainty, scale uncertainty, and total uncertainty.
  </p>
</div>
"""
    },
    {
        "id": "pseudoscalar-charmonium-bottomonium-light-front",
        "title": "Mechanical distribution of the pseudoscalar charmonium and bottomonium on the light-front",
        "date": "2026-06-05",
        "journal": "e-Print: 2606.07073 [hep-ph]",
        "authors": "A. Dwivedi, S. Puhan, and S. Ghosh",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2606.07073",
        "extra_markdown": """

### Pressure Distribution in Pseudoscalar Mesons

The pressure distribution $P(z_\\perp)$ in the transverse plane for the mesons $\\eta_c$ (left) and $\\eta_b$ (right) shows a node where it changes sign from positive (repulsive) to negative (attractive) with increasing transverse distance $z_\\perp$:

<div style="text-align: center; margin: 30px 0;">
  <img src="/images/portfolio/papers/pseudoscalar-charmonium-bottomonium-plots.png" alt="Pressure distribution of eta_c and eta_b mesons" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p style="font-size: 0.9rem; color: #a0aec0; margin-top: 10px;">
    <strong>Figure 1:</strong> The pressure distribution in the transverse plane for the mesons $\\eta_c$ (left) and $\\eta_b$ (right). Also shown are the pressure range of the quark-gluon plasma (QGP) from lattice QCD simulations, the peak pressure in the proton, and the range of peak pressure values in the pion.
  </p>
</div>
"""
    },
]

confs = [
    {
        "id": "hql2023-b-d-mesons",
        "title": "Spatial and Transverse structure of Heavy B-and D-mesons",
        "date": "2023-11-28",
        "journal": "PoS HQL2023",
        "authors": "S. Puhan and H. Dahiya",
        "link_label": "Read on arXiv",
        "link_url": "https://arxiv.org/abs/2408.07717"
    },
    {
        "id": "dae2024-radiative-psi",
        "title": "Radiative transition of ψ(2S) → χc0(1P) + γ in LFQM",
        "date": "2024-12-07",
        "journal": "DAE Nuclear 2024",
        "authors": "A. Yadav, S. Puhan, and H. Dahiya",
        "link_label": "Read on ResearchGate",
        "link_url": "https://www.researchgate.net/publication/383878508"
    },
    {
        "id": "dae2024-unpolarized-gpds",
        "title": "Spin-1 unpolarized GPDs in light front dynamics",
        "date": "2024-12-08",
        "journal": "DAE Nuclear 2024",
        "authors": "S. Puhan, Narinder Kumar, and H. Dahiya",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "dae2024-spectroscopy-excited-d",
        "title": "Spectroscopy of excited states of D+ and D+S meson in the light-front quark model",
        "date": "2024-12-09",
        "journal": "DAE Nuclear 2024",
        "authors": "R. Acharyya, S. Puhan, Narinder Kumar, and H. Dahiya",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "dae2024-in-medium-pseudoscalar",
        "title": "In-medium properties of pseudoscalar mesons in symmetric nuclear matter",
        "date": "2024-12-10",
        "journal": "DAE Nuclear 2024",
        "authors": "A. Gautam, D. Singh, S. Puhan, N. Kaur, A. Kumar, H. Dahiya, and S. Dutt",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "daehep2024-pion-lf-dynamics",
        "title": "Valence quark structure of pion using light front dynamics",
        "date": "2024-12-15",
        "journal": "DAE HEP 2024",
        "authors": "S. Puhan and H. Dahiya",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "daehep2024-pion-asymm-nuclear",
        "title": "Behavior of pion in asymmetric nuclear medium",
        "date": "2024-12-16",
        "journal": "DAE HEP 2024",
        "authors": "A. Gautam, D. Singh, S. Puhan, N. Kaur, A. Kumar, H. Dahiya, and S. Dutt",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "daehep2024-kaons-dense",
        "title": "Kaons structure in dense nuclear medium",
        "date": "2024-12-17",
        "journal": "DAE HEP 2024",
        "authors": "A. Kumar, D. Singh, S. Puhan, N. Kaur, M. Kaur, H. Dahiya, and S. Dutt",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "hp2024-photon-tmds",
        "title": "Understanding photon TMDs with light-front wave function",
        "date": "2024-11-20",
        "journal": "HP 2024",
        "authors": "S. Puhan, N. Kaur, and H. Dahiya",
        "link_label": "View Details",
        "link_url": "#"
    },
    {
        "id": "athics2025-pion-kaon",
        "title": "Leading-twist TMDs for pion and kaon using power law wave functions",
        "date": "2025-01-10",
        "journal": "ATHICS 2025",
        "authors": "S. Puhan, and H. Dahiya",
        "link_label": "View Details",
        "link_url": "#"
    },
]


def _escape_toml(s: str) -> str:
    """Escape a string for TOML double-quoted value."""
    return s.replace("\\", "\\\\").replace('"', '\\"')


def build_frontmatter(p: dict) -> str:
    """Build clean TOML frontmatter from publication dict."""
    lines = ["+++"]
    lines.append(f'title = "{_escape_toml(p["title"])}"')
    lines.append(f'date = {p["date"]}')
    lines.append("")
    lines.append("[extra]")
    lines.append(f'thumbnail = "{_escape_toml(p["thumbnail"])}"')
    lines.append(f'service = "{_escape_toml(p["journal"])}"')
    lines.append(f'client = "{_escape_toml(p["authors"])}"')
    lines.append(f'short_description = "{_escape_toml(p["description"])}"')
    lines.append(f'challenge = "{_escape_toml(p["challenge"])}"')
    lines.append(f'solution = "{_escape_toml(p["solution"])}"')

    if p.get("doi"):
        lines.append(f'doi = "{_escape_toml(p["doi"])}"')

    if p.get("tags"):
        tags_toml = ", ".join(f'"{_escape_toml(t)}"' for t in p["tags"])
        lines.append(f'tags = [{tags_toml}]')

    if p.get("categories"):
        cats_toml = ", ".join(f'"{_escape_toml(c)}"' for c in p["categories"])
        lines.append(f'categories = [{cats_toml}]')

    lines.append("+++")
    return "\n".join(lines) + "\n"


def build_body(p: dict) -> str:
    """Build the Markdown body for a publication."""
    body = f"""
**Authors:** {p["authors"]}  
**Published in:** {p["journal"]}

[{p["link_label"]} →]({p["link_url"]})
"""
    if p.get("extra_markdown"):
        body += p["extra_markdown"]
    return body


def enrich(p: dict) -> dict:
    """Add creative metadata to a publication dict."""
    pid = p["id"]
    p["description"] = DESCRIPTIONS.get(pid, "Research publication.")
    p["challenge"] = CHALLENGES.get(pid, p["title"])
    p["solution"] = SOLUTIONS.get(pid, f"Research article published in {p['journal']}.")
    p["thumbnail"] = THUMBNAILS.get(pid, "images/portfolio/portfolio-1.png")
    p["doi"] = DOIS.get(pid)
    p["tags"] = TAGS.get(pid, [])
    p["categories"] = CATEGORIES.get(pid, ["Journal Article"])
    return p


def main():
    portfolio_dir = os.path.join(BASE_DIR, "content", "portfolio")
    os.makedirs(portfolio_dir, exist_ok=True)

    # Remove old generated files (keep _index.*)
    for f in glob(os.path.join(portfolio_dir, "*.md")):
        if os.path.basename(f).startswith("_index"):
            continue
        os.remove(f)
        print(f"REMOVED: {f}")

    created = 0
    for p in (pubs + confs):
        p = enrich(p.copy())
        content = build_frontmatter(p) + build_body(p)

        path_md = os.path.join(portfolio_dir, f"{p['id']}.md")
        with open(path_md, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"CREATED: {path_md}")
        created += 1

    print(f"\n=== Done: {created} publication files created in {portfolio_dir} ===")


if __name__ == "__main__":
    main()
