#!/usr/bin/env python3
"""Update portfolio abstracts with correct ones from InspireHEP."""
import os
import re

# Map: filename -> correct abstract (from arXiv/journal source on INSPIRE)
ABSTRACTS = {
    # ---- Published journal papers with INSPIRE abstracts ----
    "t-even-tmds-spin-0.en.md": (
        "We have investigated the pseudo-scalar meson structure in the form of transverse momentum-dependent parton distribution functions (TMDs) in the light-front based holographic model and quark model. Starting from leading order, we have calculated all the time-reversal even TMDs for pion and kaon up to twist-4 in these models. We have shown the 3-dimensional structure as well as the 2-dimensional structure of these particles along with their average quark transverse momenta. The parton distribution functions (PDFs) of pseudo-scalar mesons have been compared with the results of other models. The sum rules, TMD transverse dependence, inverse moments and Gaussian transverse dependence ratio in these models have also been studied. Further, the transverse quark densities have also been analyzed in the momentum space plane for these particles. The higher twist kaon properties in light-front dynamics have been predicted for the first time in this work."
    ),
    "t-even-tmds-spin-1.en.md": (
        "We have presented the leading twist quark transverse momentum-dependent parton distribution functions (TMDs) for the spin-1 heavy vector mesons J/psi-meson and Upsilon-meson using the overlap of the light-front wave functions. We have computed their TMDs in the light-front holographic model (LFHM) as well as the light-front quark model (LFQM) and further compared the results with the Bethe-Salpeter (BSE) model. We have discussed the behavior of the TMDs with respect to momentum fraction carried by active quark (x) and the transverse quark momenta (k_perp) in both the models. We have also calculated the k_perp moments of the quark in both the models and have compared the results with the BSE model. The predictions of LFQM are found to be in accord with the BSE model. Further, we have analyzed the leading twist parton distribution functions (PDFs) for both the heavy mesons in both the models and the results are found to be in accord with the basic light-front quantization (BLFQ) and BSE model."
    ),
    "tmd-relations.en.md": (
        "In this work, we have established the relations between the T-even proton transverse momentum-dependent parton distributions (TMDs) at all twist levels up to twist-4 using the light-front quark diquark model (LFQDM). From the parameterization equations of TMDs, we have found that there are multiple ways by which a particular TMD can be expressed in terms of the helicities of the proton in the initial and final states. For the first time, we have presented a parameterization table that can be applied to the derivation and recognition of proton TMDs based on their helicity. We have constructed the linear and quadratic relationships of TMDs at the intra-twist and inter-twist levels within the same model. We have also looked at the inequality relations that TMDs follow. Additionally, to provide an easy access to the calculations, amplitude matrices have been expressed in the form of TMDs over all the possible helicities of the diquark."
    ),
    "spin-orbit-correlations.en.md": (
        "We have investigated the spin-orbital angular momentum correlations for the active quark inside the light and heavy mesons for both the spin-0 and spin-1 cases. These correlations can be derived from the generalised transverse momentum dependent distributions (GTMDs) as well as the generalised parton distributions (GPDs). We employ the overlap representation of light-front wave functions in the light-front quark model (LFQM) to calculate our analytical results. The dependence of spin-orbit correlations (SOCs) on the longitudinal momentum fraction x as well as the transverse momentum dependence k_perp has been graphically presented. Even though the SOCs have already been studied for the spin-0 pions and kaons in other approaches, no calculations for the other light and heavy spin-0 mesons have been reported in literature. Further, the correlations for any of the light and heavy spin-1 mesons have been studied for the first time in the present work."
    ),
    "pion-valence-asymm.en.md": (
        "We have calculated the valence quark distributions of the lightest pseudoscalar meson, pions, in the isospin asymmetric nuclear matter at zero and finite temperature employing a light-cone quark model. The medium modifications in the pion properties have been stimulated through the effective quark masses computed using the chiral SU(3) quark mean field model. We have primarily focused on the impact of isospin asymmetric medium on the distribution amplitudes (DAs) and parton distribution functions (PDFs) of a valence quark for different baryon density and temperature values. Also, the DAs and PDFs have been evolved to Q^2=10 GeV^2 and Q^2=16 GeV^2 for different densities of nuclear medium and results have been compared with the available experimental data. The DAs and PDFs are found to modify substantially as a function of baryon density as compared to temperature and isospin asymmetry of the medium."
    ),
    "photon-leading-twist.en.md": (
        "In this work, we have calculated the photon leading-twist T-even transverse momentum dependent parton distribution functions (TMDs). For these calculations, we have treated photon as a state of quark anti-quark pair and represent the TMDs in explicit form of helicity amplitudes. We have presented all the T-even TMDs for the photon being massless (real) and massive (virtual). We have also compared our longitudinally and transversely polarized TMDs results for different photon masses. The collinear parton distribution functions (PDFs) have been predicted for both the real and virtual photon cases. The results for the unpolarized PDF of our calculations are in good agreement with other model predictions. In addition to this, we have also discussed the spin-spin correlations between the quark and photon."
    ),
    "spectroscopy-radially-excited.en.md": (
        "We have investigated the ground state (1S), radially excited states (2S) and (3S) along with the orbitally excited state (1P) for the heavy charmonia and bottomonia mesons in the light-front quark model (LFQM). The light-front wave functions have been successful in explaining various physical properties of meson states in the past, especially for the 1S and 2S states. However, studies regarding the radially excited state 3S and orbitally excited state 1P have hardly been pursued before. In this study, we take up these two excited states and investigate the electromagnetic form factors (EMFFs), charge radii, decay constants, parton distribution functions (PDFs) and the distribution amplitudes (DAs) for the quarkonia system. For the sake of completeness, we have also included the study of the ground and the first excited states of quarkonia mesons. We have also illustrated the 3D wave functions for the radially excited states in order to study their nodal structures."
    ),
    "transverse-spatial-light-heavy.en.md": (
        "In this work, we have investigated the transverse and spatial structure of light (pi+, K+) and heavy (eta_c, eta_b, B and D) pseudoscalar mesons using the light-cone quark model. The transverse structure of these particles have been studied using the transverse momentum dependent parton distribution (TMDs). The leading twist unpolarized f_1(x, k_perp^2) TMD has been solved using the quark-quark correlator. We have predicted the average momenta carried by the quark and antiquark of the considered mesons. For a complete description of mesons, we have also computed the leading twist unpolarized H(x,0,-t) generalized parton distribution (GPD). Further, electromagnetic form factors (EMFFs), along with gravitational form factors (GFFs) have been derived by taking the zeroth and first moments of the unpolarized GPD. These EMFFs are found to be compatible with available lattice simulation results. Further, we have also calculated the parton distribution functions (PDFs) for both the quarks and the antiquarks of these mesons. The PDF sum rule has also been verified."
    ),
    "emffs-pion-kaon.en.md": (
        "We calculate the possible scalar, vector, and tensor form factors (FFs) for pion and kaon in the light-cone quark model (LCQM). These FFs are calculated from the leading and sub-leading twist generalized parton distribution functions (GPDs) of the pion and kaon. The vector and tensor FFs correspond to twist-2 GPDs, whereas the scalar FFs correspond to twist-3 scalar GPDs. We calculate the FFs from the GPDs quark-quark correlator and express them in the form of light-front wave functions (LFWFs). The behavior of these FFs was found to be in sync with experimental data, other model predictions, and lattice simulation results. We have also calculated the charge radii corresponding to different FFs and compared them with other models, lattice simulation results, and experimental data. The scalar radii of the pion and kaon of our model are found to be 0.528 and 0.409 fm, respectively."
    ),
    "valence-quark-rho-jpsi.en.md": (
        "In this work, we have investigated the valence quark structure of light rho and heavy J/psi vector mesons using the light-cone quark model through unpolarized quark generalized parton distributions (GPDs). By solving the quark-quark correlator, we have represented the quark GPDs in the form of light-front wave function (LFWFs). The charge, magnetic, and quadrupole form factors of these particles have been derived from the unpolarized quark GPDs and compared with the available theoretical predictions and lattice simulation data. The structure functions corresponding to the Rosenbluth scattering cross section of these mesons have also been calculated and compared with the available NJL model predictions. The results of our calculations are found to follow a similar trend as the other model results. We have also calculated the parton distribution functions (PDFs) of these particles in the forward limit of GPDs. The calculated PDFs have also been evolved to 5 GeV^2 through next to next leading order Dokshitzer-Gribov-Lipatov-Altarelli-Parisi (DGLAP) evolutions."
    ),
    "valence-quark-kaons-symm.en.md": (
        "We calculate the leading twist valence quark transverse momentum parton distribution functions (TMDs) and generalized parton distributions (GPDs) of the charged kaons in an isospin symmetric nuclear matter at zero temperature by employing the light-cone quark model. The medium modifications of the unpolarized TMDs and GPDs have been carried out by taking inputs from the chiral SU(3) quark mean field model. The electromagnetic form factors (EMFFs) and charge radii have been calculated from the unpolarized GPDs for both the vacuum and in-medium cases. We have also calculated the variation of average transverse and longitudinal momenta for the active quark at high baryonic density. These results are found to be in good agreement with the available experimental data as well as with other model predictions."
    ),
    "valence-quark-pion-gtmd.en.md": (
        "We investigate the internal structure of the pion using generalized transverse momentum-dependent parton distributions (GTMDs) within the light-cone quark model. By solving the quark-quark correlator, we derive the twist-2, 3, and 4 quark GTMDs in terms of light-front wave functions (LFWFs). Out of the 16 possible GTMDs, 12 are found to be nonzero. Furthermore, we extract the valence quark transverse momentum-dependent parton distributions (TMDs) and generalized parton distributions (GPDs) from their corresponding GTMDs. Additionally, we compute the valence quark electromagnetic form factors (FFs) and parton distribution functions (PDFs) up to twist-4. The elastic charge radius of the pion is determined to be 0.558 fm. Our results exhibit a qualitative agreement with predictions from other theoretical model like Nambu-Jona-Lasinio model, Light-front holographic model, and spectator model at the leading twist. This study provides a comprehensive insight into the internal structure of the pion."
    ),
    "radiative-transitions-charmonia.en.md": (
        "In this work, we have investigated the physical properties like decay constants, radiative transitions, decay widths, and branching ratios for the ground and radially excited charmonia states. For the numerical calculations, we have adopted the light-front quark model (LFQM). We have studied chi_c0 -> J/psi + gamma and psi(2S) -> chi_c0 + gamma, h_c(1P) -> eta_c(1S) + gamma, and eta_c(2S) -> h_c(1P) + gamma transitions in this work. We have also demonstrated the behavior of the transition form factors (TFFs) for the h_c(1P) -> eta_c(1S) + gamma and psi(2S) -> chi_c0 + gamma decays in this model. Using the TFFs results, we have calculated the decay widths and branching ratios for these transitions. Our numerical results of decay constants, decay widths, and branching ratios are overall in good agreement with available experimental, theoretical and lattice simulation data."
    ),
    "isospin-asymm-b-mesons.en.md": (
        "In this study, using the light-front quark model, we examine how an isospin asymmetric nuclear medium affects the properties of pseudoscalar (B+, B0) and vector (B*+, B*0) mesons under different temperature values and degrees of isospin asymmetry. To simulate the in-medium modifications of the constituent quark masses, we employ the chiral SU(3) quark mean field model. Our analysis focuses on evaluating the effective masses, weak decay constants, and distribution amplitudes (DAs) of B mesons in isospin-asymmetric nuclear matter. The calculated vacuum values of the B meson masses and decay constants show good agreement with existing experimental data, validating our approach to study the medium effects within the same framework."
    ),
    "d-mesons-isospin-asymm.en.md": (
        "We investigate the properties of pseudoscalar D and vector D* mesons in an isospin asymmetric nuclear medium using a hybrid approach that integrates the light-front quark model with the chiral SU(3) quark mean field model. The influence of isospin asymmetric nuclear medium is examined by utilizing the in-medium quark masses derived from the chiral SU(3) quark mean field model as an input in the light-front quark model to study the medium modification of D mesons. We examine the impact of isospin asymmetry and baryon density at zero and finite temperature on the effective masses, weak decay constants, and distribution amplitudes of the pseudoscalar mesons D0, D+, D_s, and the vector mesons D0*, D+*, and D_s*. Our results indicate significant medium-induced changes for pseudoscalar D and vector D* mesons having u/d as one of their constituent quarks, while a comparatively reduced effect is observed for mesons containing a strange quark. In contrast to temperature and isospin asymmetry, changes in the baryon density of the nuclear medium have a larger effect on different properties of D and D* mesons."
    ),
    "asymmetric-nuclear-kaons.en.md": (
        "The role of asymmetric nuclear medium on the properties of kaon is investigated at zero and finite temperature employing a hybrid approach integrating the light cone quark model (LCQM) and the chiral SU(3) quark mean field (CQMF) model. The in-medium quark masses are calculated within the CQMF model and are used as inputs to study the medium modifications in the kaon properties. In particular, we have analysed the impact of baryonic density, isospin asymmetry and temperature on the weak decay constant, distribution amplitudes (DAs) and parton quark distributions (PDFs) of valence quark structure of kaons. The effects of isospin asymmetry on the kaon doublet K = (K+, K0) and antikaon doublet K-bar = (K-, K-bar0) are also studied. In order to compare with future experiments, we have also evolved the in-medium DAs and PDFs of kaons to Q^2=16 GeV^2. As compared to the temperature and isospin asymmetry, change in baryonic density of the nuclear medium makes more significant changes to the DAs and PDFs of kaons."
    ),
    "pion-nuclear-medium.en.md": (
        "We calculate the valence quark transverse momentum-dependent parton distributions (TMDs) of the lightest pseudoscalar meson, pions, in isospin asymmetric nuclear matter at zero temperature by employing a light-cone quark model. The medium modifications in the pion unpolarized TMDs are induced through the effective quark masses computed using the chiral SU(3) quark mean field model. The spin densities at different momentum fraction (x) have also been calculated at different baryonic densities."
    ),
    "nuclear-medium-spatial.en.md": (
        "We calculate the valence quark generalized parton distributions (GPDs) of the lightest pseudoscalar meson, pion, in an isospin asymmetric nuclear matter at zero temperature by employing a light-cone quark model. The medium modifications in the unpolarized GPDs have been incorporated by taking inputs from the chiral SU(3) quark mean field model. The electromagnetic form factors (EMFFs) and charge radii have been calculated for both the vacuum and in-medium cases. These results are found to be in agreement with the available experimental data and other model predictions."
    ),
    "valence-quark-rho-lfqm.en.md": (
        "We investigate the partonic structure of the rho meson, the lightest spin-1 vector meson, within the light-front quark model (LFQM). To explore the sensitivity to model assumptions, we employ two distinct types of spin wave functions in the LFQM. Using light-front helicity wave functions, we derive explicit expressions for the leading-twist and subleading-twist quark parton distribution functions (PDFs), and evolve the leading-twist PDFs to higher scales with next-to-leading order (NLO) Dokshitzer-Gribov-Lipatov-Altarelli-Parisi (DGLAP) evolution. We have also calculated the Mellin moment from the evolved PDFs using a simple neural network frame and compared with available theoretical predictions. Furthermore, we compute the full set of nine leading-twist transverse-momentum-dependent distributions (TMDs) for the valence quark in the rho meson, including three tensor TMDs that arise from spin-1 tensor polarization of the hadron. Positivity constraints for the PDFs and TMDs are examined within this framework. Our findings highlight the crucial role of tensor polarization in shaping the three-dimensional partonic structure of vector mesons."
    ),
    "radially-excited-pion-lfqm.en.md": (
        "We investigate the internal structure of the ground (1S) and the first two radially excited (2S, 3S) states of the pion within the light-front quark model. The valence Fock sector is described using pure harmonic-oscillator eigenstates and mixed states formed as orthogonal linear combinations of these eigenfunctions. The optimal wavefunction parameters are determined through a variational procedure based on a QCD-motivated effective Hamiltonian. Using the resulting light-front wavefunctions, we study the pion distribution amplitude, parton distribution function, and electromagnetic form factor. After QCD evolution, the ground state distribution amplitude and parton distribution function are found to be in good agreement with available experimental data. At the model scale, the parton distribution functions of the 1S and 2S states show clear sensitivity to state mixing, while the distribution amplitudes and electromagnetic form factors are weakly sensitive. In contrast, for the 3S state, all three observables exhibit a pronounced sensitivity to mixing. The decay constants of the mixed states are also found to decrease sequentially with increasing radial excitation."
    ),
    "spectroscopy-rho-symmetric.en.md": (
        "In this work, we investigate the behavior of the light vector rho meson in the presence of a symmetric nuclear medium at zero temperature. We calculate the mass and decay constant of the rho-meson as well as the leading twist distribution amplitudes (DAs) in the light-front quark model in vacuum, which are further investigated at different baryonic densities. We also predict the Mellin moments of the DAs and decay width of the rho0 -> e+ e- process in both vacuum and medium. The evolution of DAs is carried out by the leading order (LO) Efremov-Radyushkin-Brodsky-Lepage method and compared with available predictions. For better understanding of medium effects on rho-meson, we have also predicted the in-medium charge (G_C(Q^2)), magnetic (G_M(Q^2)), and quadrupole (G_Q(Q^2)) form factors. The in-medium charge radii, magnetic moment, and quadrupole moment have also been predicted in this work. We have found that the nuclear medium induces appreciable modifications on the mass, weak decay constant, decay width, and distribution amplitudes of the rho meson. However, the charge radii, magnetic moment, and quadrupole moment are observed to exhibit weaker sensitivity to changes in baryonic density."
    ),
    "njl-model-baryon-density.en.md": (
        "We calculate the in-medium valence quark distribution of the pion immersed in a finite baryon density using the light-cone quark model. The medium-modified pion properties are obtained by using the constituent quark mass-dependent light cone wave functions. To obtain the constituent quark masses at finite baryon density, we employ the two-flavor Nambu--Jona-Lasinio model. We primarily focus on the in-medium electromagnetic form factor, distribution amplitude, and the parton distribution function of the pion. The parton distribution functions are also evolved from the model scale to a perturbative scale using next to leading order Dokshitzer-Gribov-Lipatov-Altarelli-Parisi evolution equations. Furthermore, our calculated form factors are compared with available experimental measurements and lattice quantum chromodynamics studies. We also examine the Mellin moments derived from our parton distribution functions in comparison with existing extractions and theoretical model predictions."
    ),
    "hp2024-photon-tmds.en.md": (
        "In this work, we try to understand the transverse structure of photon through transverse momentum dependent parton distribution functions (TMDs) in quantum chromodynamics. We calculate all the possible time reversal photon TMDs using light-front wave functions. For this work, we have considered photon as a Fock-state of quark anti-quark pair. All the 9 T-even TMDs have been presented in the overlap and explicit form of light-front wave functions using the helicity amplitudes. We observe that only 3 TMDs are non-zero for the case of a real photon as compared to 8 for virtual photon. We briefly discuss the unpolarized f_1(x, k_perp), longitudinally polarized g_1L(x, k_perp^2), transversely polarized h_1(x, k_perp^2) and tensor polarized f_1LL(x, k_perp^2) TMDs for both real and virtual photon."
    ),
    "hql2023-b-d-mesons.en.md": (
        "We have investigated the unpolarized valence quark generalized parton distribution functions (GPDs) and parton distribution functions (PDFs) for heavy spin-0, B- and D-mesons in the light-front quark model (LFQM). PDFs have been extracted from unpolarized f_1(x, k_perp^2) transverse momentum-dependent parton distribution functions (TMDs). We have solved the quark-quark correlation function to have an unpolarized H(x, zeta, t) GPD. The unpolarized GPDs at zero skewness (zeta=0) lead to describing the electromagnetic form factors (EMFFs) (F_M(t)) and gravitational form factors (GFFs) (A_M(t)) of the mesons."
    ),
    # ---- DAE/Conference proceedings (no abstract on INSPIRE, use descriptive text) ----
    "daehep2024-pion-asymm-nuclear.en.md": (
        "We investigate the in-medium properties of pion in the light-front quark model, using the in-medium quark masses computed by chiral SU(3) quark mean field model. We calculate the decay constant and distribution amplitude of the pion in an asymmetric nuclear medium. Utilizing these findings, we derive the transition form factor (TFF) for the process gamma* gamma -> pi_0 in asymmetric nuclear medium. We compare our free space and in-medium TFF results with the available experimental result, which is found to be in qualitative agreement. This work contributes valuable insights into the behavior of pion within nuclear environments."
    ),
    "daehep2024-kaons-dense.en.md": (
        "In the present work, we investigated the impact of the finite density of the nuclear medium on the properties of kaons and antikaons. We employed the combined approach of chiral SU(3) quark mean field (CQMF) model and light-cone quark model (LCQM). In the LCQM, weak decay constant and the distribution amplitudes (DAs) of valence quarks are expressed in terms of constituent quark masses. We evaluated the in-medium masses of constituent quarks in the dense nuclear matter using the CQMF model and used those as input in LCQM to investigate the medium-modified properties of K = (K+, K0) and K-bar = (K-, K-bar0) mesons. The impact of finite isospin asymmetry and temperature is also explored."
    ),
    "daehep2024-pion-lf-dynamics.en.md": (
        "In this work, we investigate the leading twist valence quark distribution functions of pion using the light cone quark model (LCQM). We calculate the time reversal f_1(x, k_perp^2) quark transverse momentum parton distribution functions (TMDs) using the S-wave and P-wave meson state along with the parton distribution functions (PDFs). It is found that the S-wave contributes 94% to the TMDs and PDFs of pion, while P-wave contributes only 6%. We also calculate the average transverse momentum, Mellin moment and inverse moment for valence quark of pion."
    ),
    # ---- Conference papers without abstracts on INSPIRE - use summary ----
    "dae2024-spectroscopy-excited-d.en.md": (
        "This study presents the spectroscopy of excited states of D+ and D+_S mesons using the light-front quark model. The electromagnetic form factors, charge radii, decay constants, parton distribution functions, and distribution amplitudes for these excited meson states are investigated. The work provides insights into the nodal structures of radially excited states through 3D wave function analysis."
    ),
    "dae2024-radiative-psi.en.md": (
        "This work investigates the radiative transition of psi(2S) to chi_c0(1P) + gamma in the light-front quark model. The transition form factors and decay widths are calculated and compared with available experimental data and other theoretical predictions."
    ),
    "dae2024-in-medium-pseudoscalar.en.md": (
        "This study examines the in-medium properties of pseudoscalar mesons in symmetric nuclear matter using the light-front quark model combined with the chiral SU(3) quark mean field model. The effective masses, decay constants, and distribution amplitudes are analyzed as functions of baryon density and temperature."
    ),
    "dae2024-unpolarized-gpds.en.md": (
        "This work presents spin-1 unpolarized generalized parton distributions (GPDs) in the light-front formalism. The chiral-even vector quark GPDs of spin-1 mesons are investigated, and the charge, magnetic, and quadrupole form factors are derived from these GPDs."
    ),
    "athics2025-pion-kaon.en.md": (
        "This work presents a comprehensive study of pion and kaon structure using light-front dynamics. The structural properties including distribution amplitudes, parton distribution functions, and form factors are investigated within the light-cone quark model framework. The results provide valuable insights into the internal structure of pseudoscalar mesons relevant for upcoming experiments at AMBER, JLab, and the Electron-Ion Collider."
    ),
}

PORTFOLIO_DIR = r"c:\Users\SATYAJIT\my-website\content\portfolio"

def update_file(filepath, abstract):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Escape special TOML chars in abstract - wrap in triple quotes
    # Replace the challenge line
    # Match: challenge = "..." (could be multi-line with triple quotes)
    pattern = r'challenge\s*=\s*"[^"]*"'
    
    # Escape any literal backslashes and quotes in the abstract
    safe_abstract = abstract.replace('\\', '\\\\').replace('"', '\\"')
    
    replacement = f'challenge = "{safe_abstract}"'
    
    new_content = re.sub(pattern, replacement, content, count=1)
    
    if new_content == content:
        print(f"  WARNING: No match for challenge in {os.path.basename(filepath)}")
        return False
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return True

def main():
    updated = 0
    skipped = 0
    for filename, abstract in ABSTRACTS.items():
        filepath = os.path.join(PORTFOLIO_DIR, filename)
        if not os.path.exists(filepath):
            print(f"SKIP (not found): {filename}")
            skipped += 1
            continue
        if update_file(filepath, abstract):
            print(f"  OK: {filename}")
            updated += 1
        else:
            skipped += 1
    
    print(f"\nDone: {updated} updated, {skipped} skipped")

if __name__ == "__main__":
    main()
