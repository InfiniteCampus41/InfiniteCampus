const params = new URLSearchParams(window.location.search);
const choice = params.get("choice");
const iframe = document.getElementById('frame');
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
