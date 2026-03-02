const page = window.location.pathname;
const params = new URLSearchParams(window.location.search);
if (page === '/InfiniteAbouts.html') {
    const roleParams = params.get("role");
    const allowedHosts = ["infinitecampus.xyz", "www.infinitecampus.xyz", "instructure.space", "localhost:2000"];
    const before = document.getElementById("before");
    const toptext = document.getElementById("tptxt");
    const role1 = document.getElementById('rolesReveal1');
    const role2 = document.getElementById('rolesReveal2');
    const rolecontainer = document.getElementById('rolesContainer');
    const beforecontainer = document.getElementById('beforeContainer');
    if (roleParams) {
        rolecontainer.style.display = "block";
        beforecontainer.style.display = "block";
    }
    role1.addEventListener("click", () => {
        rolecontainer.style.display = 'block';
        beforecontainer.style.display = 'none';
    });
    role2.addEventListener("click", () => {
        rolecontainer.style.display = 'none';
        beforecontainer.style.display = 'block';
    });
    if (!allowedHosts.includes(window.location.host)) {
        toptext.textContent = "About Infinite Campus";
        before.innerHTML = `
            Infinite Campus Was Founded On December 19th, 2024.
            <br>
            <br>
            <p class="r">
                You Are Using This Site On A Mirror Link
                <br>
                <br>
                Please Be Careful About Entering Important Information
                <br>
                <br>
                The Proxy 
                <strong>
                    WILL NOT
                </strong>
                Work
                <br>
                Any Support Requests Regarding The Proxy From A Non-Official Link Will Not Be Responded To
                <br>
                <br>
                Depending On If The Code Exists, There Should Only Be One Games Button In The Games Tab
                <br>
                If There Is More Than One Button, The First One Will Not Work As It Utilizes The Proxy
                <br>
                <br>
                The Official Links To This Site Are:
                <br>
                <a class="discord" href="https://www.infinitecampus.xyz">
                    https://infinitecampus.xyz
                </a>
                And
                <a class="discord" href="https://instructure.space">
                    https://instructure.space
                </a>
            </p>
            To Contact The Owner, Email support@infinitecampus.xyz
        `;
    }
} else if (page === '/InfiniteMirrors.html') {
    const byod = params.get("byod");
    const byodSection = document.getElementById('byod');
    const mirrorSection = document.getElementById('mirror');
    if (byod) {
        mirrorSection.style.display = 'none';
        byodSection.style.display = 'block';
    }
} else if (page === '/InfiniteEmbeds.html') {
    const choice = params.get("choice");
    const iframe = document.getElementById('embFrame');
    const tptxt = document.getElementById('rpbgtxt');
    const hr = document.getElementById('rphr');
    const cEmbBtn = document.getElementById('cEmbBtn');
    if (choice == 1) {
        iframe.src = 'https://padlet.com/newsomr95/chat-room-br2tjbusbebezr2n';
        cEmbBtn.style.display = 'block';
    }else if (choice == 2) {
        iframe.src = 'https://nettleweb.com';
    } else if (choice == 3) {
        iframe.src = 'https://sigmasigmatoiletedge.github.io';
    } else if (choice == 4) {
        iframe.src = 'https://dfs3rzq44v6as.cloudfront.net/place/';
    } else if(choice == 5) {
        iframe.src = 'https://docs.google.com/forms/d/e/1FAIpQLSfcgIrELDOk41dsNC_CmCBfT8dLCidiYC_ZBB9F1kfO_cuNKg/viewform?embedded=true';
        iframe.width = '640';
        iframe.height = '852';
        iframe.style.height = "calc(100vh - ((var(--headerHeight) * 2) + var(--footerHeight)))";
        iframe.frameborder = '0';
        iframe.marginheight = '0';
        iframe.marginwidth = '0';
        tptxt.style.display = 'block';
        hr.style.display = 'block';
    } else if(choice == 6) {
        iframe.src = 'https://calc-one-ruby.vercel.app/';
    } else if (choice == 7) {
        showError('WARNING: Use At Your Own Risk. We Are NOT Responsible If You Get Caught Or Get In Trouble For Using This.');
        iframe.src = 'https://proxyman15.github.io/';
    } else {
        iframe.style.display = 'none';
        showError('You Must Select An Embed First');
    }
}