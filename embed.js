const params = new URLSearchParams(window.location.search);
const choice = params.get("choice");
const iframe = document.getElementById('frame');
const tptxt = document.getElementById('rpbgtxt');
const hr = document.getElementById('rphr');
if (choice == 1) {
    iframe.src = 'https://nettleweb.com';
} else if (choice == 2) {
    iframe.src = 'https://sigmasigmatoiletedge.github.io';
} else if (choice == 3) {
    iframe.src = 'https://dfs3rzq44v6as.cloudfront.net/place/';
} else if(choice == 4) {
    iframe.src = 'https://docs.google.com/forms/d/e/1FAIpQLSekq4mp3pv0plnCCbo_9GSgOJBmgDJKgDQQpOFfzNYc44e9vQ/viewform?embedded=true';
    iframe.width = '640';
    iframe.height = '852';
    iframe.frameborder = '0';
    iframe.marginheight = '0';
    iframe.marginwidth = '0';
    tptxt.style.display = 'block';
    hr.style.display = 'block';
} else if(choice == 5) {
    iframe.src = 'https://calc-one-ruby.vercel.app/';
} else {
    iframe.style.display = 'none';
    showError('You Must Select An Embed First');
}