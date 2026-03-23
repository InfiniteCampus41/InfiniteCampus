import { auth, onAuthStateChanged, Hyperbeam } from "./imports.js";
const virtualComputerDiv = document.getElementById("browsers");
let hb;
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/InfiniteLogins.html";
        return;
    }
    const uid = user.uid;
    try {
        const adminPass = localStorage.getItem("a_pass");
        let url;
        let options = {};
        if (adminPass) {
            url = `${a}/hyperadminvm?uid=${uid}`;
            options.headers = {
                "x-admin-password": adminPass
            };
        } else {
            url = `${a}/hypervm?uid=${uid}`;
        }
        const resp = await fetch(url, options);
        const data = await resp.json();
        hb = await Hyperbeam(virtualComputerDiv, data.embed_url);
    } catch (err) {
        console.error(err);
        virtualComputerDiv.innerText = "Failed To Load VM";
    }
});