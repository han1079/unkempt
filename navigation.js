function switch_to_hash() {
    const r = getCurrentRoute() || "home";
    showCurrentHash(r);
}

function getCurrentRoute() {
    return location.hash.slice(1);
}


function showCurrentHash(current_route) {
    for (const route of document.querySelectorAll("[data-route]")) {
        route.hidden = (route.dataset.route !== current_route);
    }
}

window.addEventListener("hashchange", switch_to_hash);