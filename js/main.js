// main.js — Satyajit Puhan Portfolio

// Progress bar animation for #skill section
function animateProgress() {
    document.querySelectorAll("#skill progress").forEach(function(el) {
        if (el.dataset.max) {
            var max = parseInt(el.dataset.max, 10);
            var val = parseInt(el.getAttribute("value") || "0", 10);
            var id = setInterval(function() {
                if (val <= max) {
                    el.setAttribute("value", val++);
                } else {
                    clearInterval(id);
                }
            }, 10);
        }
    });
}

// Sticky nav colour change on scroll
function changeNavbarColor() {
    var navbar = document.querySelector("nav");
    if (!navbar) return;
    if (window.scrollY > 200) {
        navbar.classList.add("nav__color__change");
    } else {
        navbar.classList.remove("nav__color__change");
    }
}

// Use addEventListener so we don't overwrite other scripts' handlers
window.addEventListener("load", function() {
    changeNavbarColor();
    animateProgress();
});

window.addEventListener("scroll", changeNavbarColor, { passive: true });
