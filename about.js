const allowedHosts = ["infinitecampus.xyz", "www.infinitecampus.xyz", "instructure.space", "localhost:2000"];
const before = document.getElementById("before");
const toptext = document.getElementById("tptxt");
const role1 = document.getElementById('rolesReveal1');
const role2 = document.getElementById('rolesReveal2');
const rolecontainer = document.getElementById('rolesContainer');
const beforecontainer = document.getElementById('beforeContainer');
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