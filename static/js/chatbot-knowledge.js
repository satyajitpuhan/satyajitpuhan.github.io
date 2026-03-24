// ============================================================
// Chatbot Knowledge Base — Satyajit Puhan
// All searchable information organized by category
// ============================================================

const CHATBOT_KNOWLEDGE = {

  // ── Quick Reply Categories ──────────────────────────────────
  quickReplies: [
    { label: "👤 About Satyajit",   query: "about" },
    { label: "🔬 Research",         query: "research" },
    { label: "📄 Publications",     query: "publications" },
    { label: "🎓 Education",        query: "education" },
    { label: "💼 Experience",       query: "experience" },
    { label: "🛠️ Skills",           query: "skills" },
    { label: "🤝 Collaborators",    query: "collaborators" },
    { label: "📧 Contact",          query: "contact" },
  ],

  // ── Knowledge Entries ───────────────────────────────────────
  entries: [

    // ──── ABOUT / BIO ─────────────────────────────────────────
    {
      keywords: ["about", "who", "satyajit", "puhan", "introduction", "bio", "biography", "yourself", "tell me about", "background"],
      answer: `<b>Satyajit Puhan</b> is a <b>Senior Research Fellow</b> at <b>Dr. B R Ambedkar NIT, Jalandhar</b>, working on <b>Computational High Energy Physics</b> under <b>Dr. Harleen Dahiya</b>.<br><br>Born on <b>15th May 1999</b> in <b>Chhatara, Srirampur, Balasore, Odisha</b>, he grew up in a farming family and went on to achieve national ranks — <b>AIR-877 (JAM)</b>, <b>AIR-1544 (GATE)</b>, and <b>AIR-209 (JEST)</b> in Physics.<br><br>He has published <b>20+ papers</b> in leading journals and presented work internationally at Kyoto (Japan), Zuoz (Switzerland), Dubna (Russia), TIFR Mumbai, IIT Roorkee, and ICTS Bengaluru. 🌍`,
      section: "#about"
    },
    {
      keywords: ["birth", "born", "birthday", "date of birth", "dob", "age"],
      answer: `Satyajit Puhan was born on <b>15th May 1999</b> in <b>Chhatara, Srirampur, Balasore – 756029, Odisha, India</b>. 🎂`,
      section: "#about"
    },
    {
      keywords: ["family", "village", "odisha", "chhatara", "balasore", "hometown", "home", "where from", "origin"],
      answer: `Satyajit hails from a small village called <b>Chhatara, Srirampur, Balasore (756029), Odisha, India</b>. He grew up in a humble farming family and credits his teachers for igniting his passion for physics. 🏡`,
      section: "#about"
    },
    {
      keywords: ["teachers", "mentor", "guru", "inspiration", "chitta", "suresh", "hui", "pranesh"],
      answer: `Satyajit's extraordinary teachers who shaped his journey: <b>Mr. Chitta Ranjan Das</b>, <b>Mr. Suresh Chandra Jena</b>, <b>Mr. Hui Sir</b>, and <b>Mr. Pranesh Sahoo</b>. They saw potential where he had only seen failure, and gave him direction, discipline, and purpose. 🙏`,
      section: "#about"
    },
    {
      keywords: ["rank", "air", "jam", "gate", "jest", "exam", "achievement", "topper", "chse", "board"],
      answer: `Satyajit's academic achievements:<br>
• <b>2nd Rank in Physics</b> — CHSE State Board Exam, Odisha (2016)<br>
• <b>AIR-877</b> — JAM (Physics)<br>
• <b>AIR-1544</b> — GATE (Physics)<br>
• <b>AIR-209</b> — JEST (Physics)<br>
• <b>JEE Qualified</b><br>
• <b>Premier Research Award</b> — NIT Jalandhar (Jan 2025) 🏆`,
      section: "#about"
    },

    // ──── RESEARCH ────────────────────────────────────────────
    {
      keywords: ["research", "work", "area", "field", "topic", "what do you do", "what does he do", "study"],
      answer: `Satyajit's research focuses on <b>Computational High Energy Physics</b> — specifically the <b>internal structure of hadrons</b> (mesons like pion, kaon, ρ, J/ψ, B, D) using <b>light-front dynamics</b>. His main areas are:<br><br>
🎯 <b>TMDs</b> — Transverse Momentum Distributions<br>
🗺️ <b>GPDs</b> — Generalized Parton Distributions<br>
⚡ <b>Hadronic & Mechanical Properties</b> — form factors, charge radii, spin-orbit correlations<br>
🔬 <b>Medium Modifications</b> — nuclear medium effects on meson structure<br><br>
His thesis: <i>"Tomography of Light and Heavy Mesons Using Light-front Dynamics"</i> 📐`,
      section: "#service"
    },
    {
      keywords: ["tmd", "tmds", "transverse momentum", "momentum distribution"],
      answer: `<b>TMDs (Transverse Momentum Distributions)</b> are one of Satyajit's core research areas. He works on:<br><br>
• Model-dependent TMDs for <b>spin-0</b> (pion, kaon), <b>spin-1/2</b> (proton), and <b>spin-1</b> (ρ meson, heavy vector mesons, photon)<br>
• PDFs and spin densities in momentum space<br>
• Higher twist calculations<br>
• Medium modification of TMDs using LFQM + Chiral SU(3) CQMF model<br>
• Extraction of pion TMDs/PDFs from Drell-Yan data via neural networks 🧬`,
      section: "#service"
    },
    {
      keywords: ["gpd", "gpds", "generalized parton", "parton distribution", "form factor"],
      answer: `<b>GPDs (Generalized Parton Distributions)</b> are a key area of Satyajit's work:<br><br>
• GPDs for <b>spin-0</b> (pion, kaon) and <b>spin-1</b> (ρ meson) particles<br>
• Extraction of <b>electromagnetic and gravitational form factors</b><br>
• <b>GDAs</b> for pion<br>
• Global extraction from charge form factor data using <b>neural networks</b><br>
• Relevant for <b>EIC</b> and <b>JLab</b> experiments 🔭`,
      section: "#service"
    },
    {
      keywords: ["gtmd", "gtmds", "generalized transverse", "mother distribution", "wigner"],
      answer: `<b>GTMDs (Generalized Transverse Momentum Dependent distributions)</b> are the most general distributions encoding quark structure. Satyajit has published work on pion GTMDs using the light-front quark model, showing how they reduce to TMDs, GPDs, and PDFs in appropriate limits. 📊`,
      section: "#service"
    },
    {
      keywords: ["thesis", "phd topic", "dissertation"],
      answer: `Satyajit's PhD thesis is titled: <b><i>"Tomography of Light and Heavy Mesons Using Light-front Dynamics"</i></b>, supervised by <b>Dr. Harleen Dahiya</b> at NIT Jalandhar. It focuses on mapping the internal 3D structure of mesons (pion, kaon, ρ, J/ψ, B, D) through distribution functions. 📖`,
      section: "#about"
    },
    {
      keywords: ["meson", "pion", "kaon", "rho", "jpsi", "quarkonia", "charmonia", "bottomonia", "hadron", "quark"],
      answer: `Satyajit studies the <b>internal structure of mesons</b> using light-front dynamics:<br>
• <b>Pion (π)</b> & <b>Kaon (K)</b> — spin-0 pseudo-scalar mesons<br>
• <b>ρ meson</b> — lightest spin-1 vector meson<br>
• <b>J/ψ</b> — charmonium state<br>
• <b>B & D mesons</b> — heavy mesons<br>
• <b>Radially excited states</b> of charmonia & bottomonia<br>
• <b>Photon</b> TMDs<br><br>
He investigates their TMDs, GPDs, GTMDs, form factors, and properties in nuclear medium. ⚛️`,
      section: "#service"
    },
    {
      keywords: ["medium", "nuclear medium", "nuclear matter", "baryon density", "in-medium", "dense"],
      answer: `Satyajit studies <b>medium modifications</b> of hadrons using LFQM + Chiral SU(3) CQMF model:<br><br>
• TMDs, PDFs, GPDs of pion and kaon in nuclear/hadronic medium<br>
• Effects of symmetric and asymmetric nuclear matter<br>
• Finite temperature effects<br>
• Charge radii, form factors in-medium<br>
• NJL-Polyakov loop model for transport coefficients 🌡️`,
      section: "#service"
    },
    {
      keywords: ["lfqm", "light front", "light-front", "light cone", "quark model", "model"],
      answer: `The <b>Light-Front Quark Model (LFQM)</b> is the primary theoretical framework used by Satyajit. It provides a relativistic description of hadron structure using light-front wave functions, enabling calculation of TMDs, GPDs, form factors, and other observables. He also uses NJL, DS-BSE, and spectator models. 🔧`,
      section: "#service"
    },
    {
      keywords: ["eic", "nica", "collider", "experiment", "jlab"],
      answer: `Satyajit's research is directly relevant to future collider experiments:<br>
• <b>EIC (Electron-Ion Collider)</b> — to map hadron structure<br>
• <b>NICA</b> — heavy-ion collider at JINR, Dubna<br>
• <b>JLab</b> — Jefferson Lab experiments<br><br>
His calculations of GPDs, TMDs, and form factors provide theoretical predictions for these experiments. 🔬`,
      section: "#service"
    },

    // ──── PUBLICATIONS ────────────────────────────────────────
    {
      keywords: ["publication", "publications", "paper", "papers", "journal", "published", "articles", "list of papers"],
      answer: `Satyajit has published <b>20+ papers</b> in leading journals. Key publications include:<br><br>
📄 <b>Phys. Rev. D</b> — Valence quark of rho meson, pion GPDs, spin-orbit correlations, form factors, nuclear medium TMDs<br>
📄 <b>JHEP 075 (2024)</b> — T-even TMDs for spin-0 mesons up to twist-4<br>
📄 <b>Phys. Lett. B 859 (2024)</b> — Nuclear medium effects on pion TMDs<br>
📄 <b>Nucl. Phys. A/B</b> — B-mesons in asymmetric medium, spatial distributions<br>
📄 <b>PTEP</b> — Pion GTMDs, D/D* mesons<br>
📄 <b>Eur. Phys. J. A/Plus</b> — Photon TMDs, kaon properties<br>
📄 <b>Chin. Phys. C</b> — Charmonia & bottomonia spectroscopy<br><br>
🔗 <a href="#portfolio">See all publications →</a>`,
      section: "#portfolio"
    },
    {
      keywords: ["prd", "physical review d", "phys rev"],
      answer: `Papers published in <b>Physical Review D</b>:<br><br>
• Valence quark distribution of the rho meson (PRD 113, 2026)<br>
• Valence quark distribution of ρ and J/ψ (PRD 112, 2025)<br>
• Transverse and spatial structure of mesons (PRD 111, 2025)<br>
• Electromagnetic form factors of pion and kaon (PRD 111, 2025)<br>
• Quark spin-orbit correlations in mesons (PRD 110, 2024)<br>
• Pion valence quark in asymmetric nuclear matter (PRD 110, 2024)<br>
• Leading twist T-even TMDs for spin-1 mesons (PRD 109, 2024) 📰`,
      section: "#portfolio"
    },
    {
      keywords: ["jhep", "journal high energy"],
      answer: `Published in <b>JHEP</b>: <i>"T-even TMDs for the spin-0 pseudo-scalar mesons up to twist-4 using light-front formalism"</i> — JHEP 075 (2024), by S. Puhan, S. Sharma, N. Kaur, N. Kumar, and H. Dahiya. 📰`,
      section: "#portfolio"
    },
    {
      keywords: ["plb", "physics letters b", "phys lett"],
      answer: `Published in <b>Physics Letters B</b>: <i>"Does nuclear medium affect the transverse momentum-dependent parton distributions of valence quark of pions?"</i> — Phys. Lett. B 859 (2024). 📰`,
      section: "#portfolio"
    },
    {
      keywords: ["inspire", "inspirehep", "google scholar", "citation", "h-index"],
      answer: `You can find Satyajit's full publication record on:<br>
• <a href="https://inspirehep.net/authors/2695282" target="_blank">INSPIRE-HEP →</a><br>
• <a href="https://scholar.google.com/citations?hl=en&user=pKbmhZQAAAAJ/" target="_blank">Google Scholar →</a><br>
• <a href="https://orcid.org/0009-0004-9766-5005" target="_blank">ORCID →</a> 📚`,
      section: "#portfolio"
    },

    // ──── EDUCATION ────────────────────────────────────────
    {
      keywords: ["education", "study", "degree", "university", "college", "school", "qualification", "academic"],
      answer: `<b>Education:</b><br><br>
🎓 <b>Ph.D.</b> — Computational High Energy Physics, NIT Jalandhar (2022–Ongoing, CGPA: 8.75)<br>
🔬 <b>Visiting Fellow</b> — JINR, Dubna, Russia (Jun–Sep 2025)<br>
🔬 <b>Visiting Fellow</b> — IIT Bhilai (Feb 2025)<br>
🎓 <b>M.Sc. Physics</b> — NIT Jamshedpur (2019–2021, CGPA: 8.59)<br>
🎓 <b>B.Sc. Physics</b> — Bhadrak Autonomous College (2016–2019, CGPA: 8.91)<br>
🏫 <b>12th (CHSE)</b> — Siddhivinayak +2 Science College (2015–2016, 78%)`,
      section: "#resume"
    },
    {
      keywords: ["phd", "doctorate", "doctoral", "nit jalandhar", "nitj"],
      answer: `<b>Ph.D. in Computational High Energy Physics</b> (2022–Ongoing)<br>
📍 Dr. B R Ambedkar NIT, Jalandhar<br>
📖 Thesis: <i>"Tomography of Light and Heavy Mesons Using Light-front Dynamics"</i><br>
👨‍🏫 Supervisor: <b>Dr. Harleen Dahiya</b><br>
📊 CGPA: 8.75/10.0<br>
📚 Courses: Particle Physics, Advanced Particle Physics, QFT, Research Methodology, Experimental HEP 🎓`,
      section: "#resume"
    },
    {
      keywords: ["msc", "master", "nit jamshedpur", "jamshedpur"],
      answer: `<b>M.Sc. in Physics</b> (2019–2021)<br>
📍 NIT Jamshedpur<br>
📖 Project: <i>"Proton-Oxygen Elastic Scattering by Taylor Series Expansion"</i><br>
👨‍🏫 Supervisor: <b>Prof. Ujjwal Laha</b><br>
📊 CGPA: 8.59/10.0 🎓`,
      section: "#resume"
    },
    {
      keywords: ["bsc", "bachelor", "bhadrak", "undergraduate"],
      answer: `<b>B.Sc. in Physics</b> (2016–2019)<br>
📍 Bhadrak Autonomous College, Odisha<br>
📖 Project: <i>"Superconductivity and its Application to Maglev Trains"</i><br>
👨‍🏫 Supervisor: <b>Dr. Rajat Kumar Pradhan</b><br>
📊 CGPA: 8.91/10.0 🎓`,
      section: "#resume"
    },
    {
      keywords: ["jinr", "dubna", "russia", "moscow", "visiting fellow", "teryaev"],
      answer: `<b>Visiting Fellow — JINR, Dubna, Russia</b> (Jun–Sep 2025)<br>
📍 Joint Institute for Nuclear Research<br>
🔬 Project: Extraction of hadron GPDs using neural networks and energy-momentum tensor calculations<br>
👨‍🏫 Supervisor: <b>Prof. Oleg V. Teryaev</b><br><br>
He also presented a seminar on <i>"Internal structure of pion, kaon, and ρ meson"</i> + a talk on <i>"Gravitational Form Factors of Pion"</i> at JINR-BLTP 2025. 🇷🇺`,
      section: "#resume"
    },

    // ──── EXPERIENCE ──────────────────────────────────────────
    {
      keywords: ["experience", "position", "job", "career", "srf", "senior research fellow", "fellowship"],
      answer: `<b>Professional Experience:</b><br><br>
🔬 <b>Senior Research Fellow</b> — NIT Jalandhar (2022–Present)<br>
&nbsp;&nbsp;&nbsp;&nbsp;Hadron tomography: TMDs, GPDs, GTMDs, GDAs, form factors, PDFs. 20+ papers published.<br><br>
🏆 <b>Premier Research Award</b> — NIT Jalandhar (Jan 2025)<br><br>
🎤 <b>International Talks:</b> Kyoto (Japan), Zuoz (Switzerland), Dubna (Russia), TIFR Mumbai, IIT Roorkee, ICTS Bengaluru<br><br>
🔬 <b>Visiting Fellow</b> — JINR Dubna (2025) & IIT Bhilai (2025)`,
      section: "#resume"
    },
    {
      keywords: ["award", "prize", "recognition", "premier research"],
      answer: `🏆 <b>Premier Research Award</b> — Received in the Department of Physics, NIT Jalandhar on 26th January 2025, recognizing outstanding research contributions in the field of High Energy Physics. 🎉`,
      section: "#resume"
    },
    {
      keywords: ["talk", "presentation", "seminar", "lecture", "invited"],
      answer: `<b>Conference Talks & Seminars:</b><br><br>
🎤 JINR-BLTP 2025, Dubna — <i>"Gravitational Form Factors of Pion"</i><br>
🎤 Prof. C. R. Ji's Group (NCSU, USA) — <i>"Internal Structure of Light Mesons"</i> (Zoom)<br>
🎤 JINR Dubna — <i>"Internal structure of pion, kaon, and ρ meson"</i><br>
🎤 DAE SNP 2024, IIT Roorkee — <i>"Spin-1 unpolarized GPDs"</i><br>
🎤 HHIQCD 2024, Kyoto — <i>"Structural analysis of Pion and Kaon"</i><br>
🎤 ICTS-TIFR 2024, Bengaluru — <i>"Structural analysis of pion with TMDs, GPDs and GDAs"</i><br>
🎤 HQL 2023, TIFR Mumbai — Poster on <i>"Internal Structure of Heavy B and D-mesons"</i> 🗣️`,
      section: "#resume"
    },

    // ──── SKILLS ──────────────────────────────────────────────
    {
      keywords: ["skill", "skills", "tool", "tools", "programming", "software", "language", "technical"],
      answer: `<b>Technical Skills:</b><br><br>
🧮 <b>Mathematica</b> — Expert (95%)<br>
🐍 <b>Python / NumPy / SciPy</b> — Expert (92%)<br>
📐 <b>LFQM</b> — Expert (95%)<br>
🔬 <b>NJL / DS-BSE / Spectator Models</b> — 85%<br>
📊 <b>LHAPDF / xFitter / DGLAP / CSS</b> — 90%<br>
📝 <b>LaTeX / Overleaf / Scientific Writing</b> — Expert (95%)<br>
🤖 <b>Neural Networks / ML / Monte Carlo (Pythia)</b> — 75%<br>
💻 <b>C++ / Linux / Git</b> — 60%`,
      section: "#skill"
    },
    {
      keywords: ["python", "numpy", "scipy", "code", "coding"],
      answer: `Satyajit is proficient in <b>Python</b> (with <b>NumPy</b> and <b>SciPy</b>) at an expert level (92%). He uses Python for numerical computations, data analysis, and implementing physics calculations. 🐍`,
      section: "#skill"
    },
    {
      keywords: ["mathematica", "wolfram"],
      answer: `Satyajit is an expert in <b>Wolfram Mathematica</b> (95%). He uses it extensively for symbolic computation, analytical calculations in quantum field theory, and deriving distribution functions. 🧮`,
      section: "#skill"
    },
    {
      keywords: ["latex", "overleaf", "writing", "scientific writing"],
      answer: `Satyajit is an expert in <b>LaTeX</b> and <b>Overleaf</b> (95%), using them for writing scientific papers, preparing presentations, and formatting research documents for journal submission. 📝`,
      section: "#skill"
    },
    {
      keywords: ["machine learning", "ml", "neural network", "nn", "ai", "deep learning", "monte carlo", "pythia"],
      answer: `Satyajit applies <b>Machine Learning</b> techniques in physics research (75%):<br>
• Neural networks for extraction of hadron GPDs<br>
• Neural network-based extraction of pion TMDs/PDFs from Drell-Yan data<br>
• Monte Carlo simulations with <b>Pythia 8312</b> (NRQCD)<br>
• Global fitting with iminuit 🤖`,
      section: "#skill"
    },

    // ──── COLLABORATORS ───────────────────────────────────────
    {
      keywords: ["collaborator", "collaborators", "colleague", "coauthor", "co-author", "team", "group"],
      answer: `<b>Key Collaborators:</b><br><br>
👨‍🏫 <b>Dr. Harleen Dahiya</b> — PhD Supervisor (NIT Jalandhar)<br>
👨‍🏫 <b>Prof. Oleg V. Teryaev</b> — JINR Supervisor (Dubna, Russia)<br>
👨‍🏫 <b>Prof. Sabyasachi Ghosh</b> — IIT Bhilai<br>
👨‍🏫 <b>Prof. Ujjwal Laha</b> — MSc Supervisor (NIT Jamshedpur)<br>
👨‍🏫 <b>Prof. Arvind Kumar</b> & <b>Prof. Suneel Dutt</b> — NIT Jalandhar<br>
🤝 <b>Narinder Kumar, Shubham Sharma, Reetanshu Pandey, Anshu Gautam, Tanisha, Ashutosh Dwibedi, Anurag Yadav, Ritwik Acharyya, Hari Govind P, Abhishek K P</b>`,
      section: "#about"
    },
    {
      keywords: ["supervisor", "advisor", "guide", "dahiya", "harleen"],
      answer: `Satyajit's PhD supervisor is <b>Dr. Harleen Dahiya</b>, Professor in the Department of Physics at <b>Dr. B R Ambedkar NIT, Jalandhar</b>. She guides his research on hadron tomography using light-front dynamics. 👩‍🔬`,
      section: "#about"
    },

    // ──── CONTACT ─────────────────────────────────────────────
    {
      keywords: ["contact", "email", "mail", "phone", "number", "reach", "connect", "address", "location", "where"],
      answer: `<b>Contact Information:</b><br><br>
📧 <b>Email:</b> puhansatyajit@gmail.com | satyajitp.ph.21@nitj.ac.in<br>
📱 <b>Phone:</b> +91-9776342407<br>
📍 <b>Address:</b> Dr. B R Ambedkar NIT, Jalandhar, Punjab, India<br><br>
<b>Social Links:</b><br>
🔗 <a href="https://github.com/satyajitpuhan" target="_blank">GitHub</a> · 
<a href="https://www.linkedin.com/in/satyajit-puhan-b9889a162/" target="_blank">LinkedIn</a> · 
<a href="https://scholar.google.com/citations?hl=en&user=pKbmhZQAAAAJ/" target="_blank">Google Scholar</a> · 
<a href="https://inspirehep.net/authors/2695282" target="_blank">INSPIRE-HEP</a> · 
<a href="https://orcid.org/0009-0004-9766-5005" target="_blank">ORCID</a>`,
      section: "#contact"
    },
    {
      keywords: ["github", "repository", "code", "open source"],
      answer: `Satyajit's GitHub: <a href="https://github.com/satyajitpuhan" target="_blank"><b>github.com/satyajitpuhan</b></a> 💻`,
      section: "#contact"
    },
    {
      keywords: ["linkedin", "social media", "professional"],
      answer: `Satyajit's LinkedIn: <a href="https://www.linkedin.com/in/satyajit-puhan-b9889a162/" target="_blank"><b>linkedin.com/in/satyajit-puhan</b></a> 💼`,
      section: "#contact"
    },

    // ──── CONFERENCES ─────────────────────────────────────────
    {
      keywords: ["conference", "conferences", "workshop", "event", "symposium", "summer school", "attended"],
      answer: `<b>Conferences & Events:</b><br><br>
🇮🇳 IITB-CFNS-CTEQ School on Perturbative QCD for EIC (Feb 2026, IIT Bombay)<br>
🇮🇳 SATPP 2026 (Jan 2026, ICTS Bengaluru)<br>
🇮🇳 ICFHEP 2025 (Feb 2025, IIT Bhilai)<br>
🇮🇳 68th DAE SNP 2024 (Dec 2024, IIT Roorkee) — Talk<br>
🇯🇵 HHIQCD 2024 (Oct–Nov 2024, Kyoto University) — Talk<br>
🇨🇭 PSI Summer School 2024 (Aug 2024, Zuoz, Switzerland)<br>
🇮🇳 ICTS-TIFR 2024 (Jan–Feb 2024, Bengaluru) — Talk<br>
🇮🇳 HQL 2023 (Nov–Dec 2023, TIFR Mumbai) — Poster<br>
🇮🇳 Shivalik HEPCATs 2023 (IIT Mandi & NIT Jalandhar)<br>
🇮🇳 Celebrating a Decade of the Higgs (Jun 2022, TIFR) — Online 📍`,
      section: "#resume"
    },
    {
      keywords: ["kyoto", "japan", "hhiqcd", "yukawa"],
      answer: `🇯🇵 <b>HHIQCD 2024 — Kyoto University, Japan</b> (Oct 14 – Nov 15, 2024)<br>
Delivered a talk on <i>"Structural analysis of Pion and Kaon with distribution functions"</i> at the Yukawa Institute for Theoretical Physics. 🎌`,
      section: "#resume"
    },
    {
      keywords: ["switzerland", "zuoz", "psi", "alps"],
      answer: `🇨🇭 <b>PSI Summer School 2024 — Zuoz, Switzerland</b> (Aug 4–10, 2024)<br>
Attended <i>"From Low to High: Particle Physics at the Frontier"</i> at Lyceum Alpinum, Zuoz, in the beautiful Swiss Alps. ⛰️`,
      section: "#resume"
    },

    // ──── NEWS ────────────────────────────────────────────────
    {
      keywords: ["news", "recent", "latest", "update", "new", "what's new"],
      answer: `<b>Recent News & Activities:</b><br><br>
📰 <b>Feb 2026:</b> Paper published in <b>Phys. Rev. D 113</b> — Valence quark distribution of the rho meson<br>
📰 <b>Feb 2026:</b> Participated in IITB-CFNS-CTEQ School on QCD for EIC at IIT Bombay<br>
📰 <b>Jan 2026:</b> Attended SATPP 2026 at ICTS Bengaluru<br>
📰 <b>Jan 2026:</b> New preprint on spectroscopy of ρ-meson in symmetric nuclear medium (arXiv: 2601.11082) 🗞️`,
      section: "#home"
    },

    // ──── WEBSITE ─────────────────────────────────────────────
    {
      keywords: ["website", "site", "page", "navigate", "section", "menu"],
      answer: `This website has the following sections:<br><br>
🏠 <a href="#home"><b>Home</b></a> — Welcome & overview<br>
👤 <a href="#about"><b>About</b></a> — Biography & background<br>
🔬 <a href="#service"><b>Research</b></a> — Research areas<br>
🎓 <a href="#resume"><b>Resume</b></a> — Education & experience<br>
📄 <a href="#portfolio"><b>Publications</b></a> — Full list of papers<br>
🛠️ <a href="#skill"><b>Skills</b></a> — Technical skills<br>
🎤 <a href="#blog"><b>Talks</b></a> — Conference presentations<br>
📧 <a href="#contact"><b>Contact</b></a> — Get in touch 🗺️`,
      section: "#home"
    },

    // ──── FUN / MISC ──────────────────────────────────────────
    {
      keywords: ["hobby", "hobbies", "interest", "free time", "fun", "travel"],
      answer: `Satyajit has traveled to many places for research and conferences — <b>Kyoto (Japan)</b>, <b>Zuoz (Switzerland)</b>, <b>Dubna (Russia)</b>, <b>Mumbai</b>, <b>Bengaluru</b>, <b>Roorkee</b>, and more! You can see some of his travel photos in the gallery on the homepage. 🌍✈️`,
      section: "#home"
    },
    {
      keywords: ["help", "how", "what can you do", "what do you know", "capability"],
      answer: `I'm <b>Bob</b> — Satyajit Puhan's virtual assistant! I can help you with:<br><br>
👤 Learn <b>about Satyajit</b> — bio, background, achievements<br>
🔬 Explore his <b>research areas</b> — TMDs, GPDs, hadron physics<br>
📄 Find his <b>publications</b> — papers, journals, co-authors<br>
🎓 Check his <b>education</b> & career timeline<br>
🛠️ View his <b>technical skills</b><br>
🤝 Meet his <b>collaborators</b><br>
📧 Get his <b>contact information</b><br>
📍 See <b>conferences</b> he's attended<br><br>
Just type a question or click a quick-reply button! 💬`,
      section: null
    },
  ]
};
