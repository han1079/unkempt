function switch_to_hash() {
    const r = getCurrentRoute() || "home";
    showCurrentHash(r);
}

function getCurrentRoute() {
    console.log("Current hash:", location.hash);
    return location.hash.slice(1);
}


function showCurrentHash(current_route) {
    for (const route of document.querySelectorAll("[data-route]")) {
        route.hidden = (route.dataset.route !== current_route);
    }
}

function getMarkdownHash(){
    const pagename = getCurrentRoute()
    const res = await fetch("./markdown/${pagename}.md")
    const text = await res.text()
}
window.addEventListener("hashchange", switch_to_hash);
