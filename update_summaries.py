#!/usr/bin/env python3
"""Update portfolio summaries (solution field) with meaningful descriptions."""
import os
import re

SUMMARIES = {
    "t-even-tmds-spin-0.en.md": (
        "First comprehensive calculation of all T-even TMDs for pion and kaon up to twist-4 in light-front holographic and quark models. Predicts higher-twist kaon properties for the first time and verifies sum rules across both frameworks."
    ),
    "t-even-tmds-spin-1.en.md": (
        "Presents leading twist TMDs for J/psi and Upsilon mesons in both LFHM and LFQM, showing LFQM predictions align well with Bethe-Salpeter model results. Includes k_perp moment calculations and PDF analysis."
    ),
    "tmd-relations.en.md": (
        "Establishes systematic relations between T-even proton TMDs up to twist-4 using a light-front quark-diquark model. Introduces a novel helicity-based parameterization table for deriving and classifying proton TMDs."
    ),
    "spin-orbit-correlations.en.md": (
        "First study of quark spin-orbit correlations in light and heavy spin-1 mesons. Extends previous spin-0 analysis to include rho, J/psi, and Upsilon mesons using GTMDs and GPDs in the LFQM framework."
    ),
    "pion-valence-asymm.en.md": (
        "Investigates how isospin asymmetry and temperature modify pion valence quark DAs and PDFs in nuclear matter. Shows baryon density has a dominant effect compared to temperature and isospin asymmetry, with results evolved to Q^2 = 10 and 16 GeV^2."
    ),
    "photon-leading-twist.en.md": (
        "Calculates all leading-twist T-even photon TMDs using light-front wave functions, treating the photon as a quark-antiquark Fock state. Compares results for real vs. virtual photons and discusses spin-spin correlations."
    ),
    "spectroscopy-radially-excited.en.md": (
        "First LFQM study of the 3S and 1P excited states of charmonia and bottomonia. Presents EMFFs, charge radii, decay constants, PDFs, and DAs along with 3D wave function visualizations showing nodal structures."
    ),
    "transverse-spatial-light-heavy.en.md": (
        "Unified study of light (pion, kaon) and heavy (eta_c, eta_b, B, D) pseudoscalar meson structure through TMDs and GPDs. Derives EMFFs and GFFs compatible with lattice QCD and verifies the PDF sum rule."
    ),
    "emffs-pion-kaon.en.md": (
        "Calculates scalar, vector, and tensor form factors for pion and kaon from twist-2 and twist-3 GPDs in the LCQM. Predicts scalar radii of 0.528 fm (pion) and 0.409 fm (kaon), consistent with experimental data and lattice results."
    ),
    "valence-quark-rho-jpsi.en.md": (
        "Studies unpolarized quark GPDs of rho and J/psi mesons using the LCQM. Derives charge, magnetic, and quadrupole form factors and Rosenbluth structure functions, with PDFs evolved to 5 GeV^2 via NNLO DGLAP."
    ),
    "valence-quark-kaons-symm.en.md": (
        "Calculates leading-twist TMDs and GPDs of charged kaons in symmetric nuclear matter using LCQM with chiral SU(3) CQMF model inputs. Derives in-medium EMFFs, charge radii, and average momenta in good agreement with data."
    ),
    "valence-quark-pion-gtmd.en.md": (
        "Comprehensive GTMD analysis of the pion up to twist-4 in LCQM. Finds 12 of 16 possible GTMDs are nonzero, extracts TMDs, GPDs, FFs, and PDFs, and reports a pion charge radius of 0.558 fm."
    ),
    "radiative-transitions-charmonia.en.md": (
        "Calculates decay constants, radiative transition form factors, decay widths, and branching ratios for ground and excited charmonia states. Results for chi_c0 -> J/psi + gamma and psi(2S) transitions agree well with experimental data."
    ),
    "isospin-asymm-b-mesons.en.md": (
        "Studies how isospin asymmetry and temperature modify B and B* meson properties using LFQM with chiral SU(3) CQMF model. Vacuum predictions for masses and decay constants agree with experimental data."
    ),
    "d-mesons-isospin-asymm.en.md": (
        "Investigates in-medium properties of pseudoscalar D and vector D* mesons in asymmetric nuclear matter. Finds significant medium effects for mesons with u/d quarks, while strange-quark mesons show reduced sensitivity."
    ),
    "asymmetric-nuclear-kaons.en.md": (
        "Analyzes the impact of baryonic density, isospin asymmetry, and temperature on kaon/antikaon DAs and PDFs using LCQM + CQMF. Baryon density dominates over temperature and isospin effects; PDFs evolved to Q^2 = 16 GeV^2."
    ),
    "pion-nuclear-medium.en.md": (
        "Calculates valence quark TMDs of pions in isospin asymmetric nuclear matter using LCQM with in-medium quark masses from chiral SU(3) CQMF model. Analyzes spin densities at different momentum fractions and baryonic densities."
    ),
    "nuclear-medium-spatial.en.md": (
        "Studies the spatial distribution of pions in asymmetric nuclear matter through GPDs. Calculates in-medium EMFFs and charge radii using LCQM with chiral SU(3) CQMF inputs, finding agreement with experiment."
    ),
    "valence-quark-rho-lfqm.en.md": (
        "Comprehensive study of rho meson partonic structure using two distinct spin wave functions in LFQM. Computes all nine leading-twist TMDs including three tensor TMDs unique to spin-1, and evolves PDFs via NLO DGLAP."
    ),
    "radially-excited-pion-lfqm.en.md": (
        "Studies the 1S, 2S, and 3S pion states using harmonic-oscillator and mixed wave functions optimized via a QCD-motivated Hamiltonian. Shows 3S observables are highly sensitive to state mixing, with evolved PDFs matching experimental data."
    ),
    "spectroscopy-rho-symmetric.en.md": (
        "Investigates rho meson properties in symmetric nuclear matter including mass, decay constant, DAs, decay width, and electromagnetic form factors. Finds significant medium effects on mass and DAs, but weaker sensitivity in charge radii and moments."
    ),
    "njl-model-baryon-density.en.md": (
        "Calculates in-medium pion properties using LCQM with constituent quark masses from the NJL model. Evolves PDFs via NLO DGLAP and compares EMFFs with experiment and lattice QCD. Mellin moments agree with existing theoretical extractions."
    ),
    "hp2024-photon-tmds.en.md": (
        "Presents all 9 T-even photon TMDs using light-front wave functions for a quark-antiquark Fock state. Finds only 3 TMDs are nonzero for real photons vs. 8 for virtual photons. Discusses unpolarized, longitudinal, transverse, and tensor-polarized TMDs."
    ),
    "hql2023-b-d-mesons.en.md": (
        "Presents unpolarized GPDs and PDFs for heavy B and D mesons in LFQM. Extracts EMFFs and GFFs from GPD moments at zero skewness, providing insights into the spatial and gravitational structure of heavy mesons."
    ),
    "daehep2024-pion-asymm-nuclear.en.md": (
        "Studies the pion transition form factor for gamma* gamma -> pi_0 in asymmetric nuclear medium. Calculates in-medium decay constant and distribution amplitude using LFQM with chiral SU(3) CQMF model, finding qualitative agreement with experiment."
    ),
    "daehep2024-kaons-dense.en.md": (
        "Investigates medium-modified kaon and antikaon properties in dense nuclear matter using combined CQMF and LCQM approach. Analyzes the impact of finite isospin asymmetry and temperature on distribution amplitudes and decay constants."
    ),
    "daehep2024-pion-lf-dynamics.en.md": (
        "Calculates pion valence quark TMDs and PDFs using S-wave and P-wave states in LCQM. Finds S-wave contributes 94% while P-wave contributes only 6%, and computes Mellin and inverse moments for the valence quark."
    ),
    "dae2024-spectroscopy-excited-d.en.md": (
        "Studies the spectroscopy of excited D+ and D+_S meson states in LFQM, analyzing EMFFs, charge radii, decay constants, PDFs, and DAs. Visualizes nodal structures of radially excited states through 3D wave functions."
    ),
    "dae2024-radiative-psi.en.md": (
        "Calculates the radiative transition form factor and decay width for psi(2S) -> chi_c0(1P) + gamma in the LFQM. Compares predictions with experimental data and other theoretical models."
    ),
    "dae2024-in-medium-pseudoscalar.en.md": (
        "Examines in-medium pseudoscalar meson properties using LFQM combined with chiral SU(3) CQMF model. Analyzes density and temperature dependence of effective masses, decay constants, and distribution amplitudes."
    ),
    "dae2024-unpolarized-gpds.en.md": (
        "Presents chiral-even vector quark GPDs for spin-1 mesons in the light-front formalism. Derives charge, magnetic, and quadrupole form factors from the unpolarized GPDs."
    ),
    "athics2025-pion-kaon.en.md": (
        "Comprehensive structural analysis of pion and kaon using light-front dynamics, covering DAs, PDFs, and form factors. Results provide predictions relevant for upcoming experiments at AMBER, JLab, and the Electron-Ion Collider."
    ),
}

PORTFOLIO_DIR = r"c:\Users\SATYAJIT\my-website\content\portfolio"

def update_file(filepath, summary):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    safe_summary = summary.replace('\\', '\\\\').replace('"', '\\"')
    pattern = r'solution\s*=\s*"[^"]*"'
    replacement = f'solution = "{safe_summary}"'
    new_content = re.sub(pattern, replacement, content, count=1)

    if new_content == content:
        print(f"  WARNING: No match for solution in {os.path.basename(filepath)}")
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return True

def main():
    updated = 0
    skipped = 0
    for filename, summary in SUMMARIES.items():
        filepath = os.path.join(PORTFOLIO_DIR, filename)
        if not os.path.exists(filepath):
            print(f"SKIP (not found): {filename}")
            skipped += 1
            continue
        if update_file(filepath, summary):
            print(f"  OK: {filename}")
            updated += 1
        else:
            skipped += 1

    print(f"\nDone: {updated} updated, {skipped} skipped")

if __name__ == "__main__":
    main()
