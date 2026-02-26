const fieldsEl=document.getElementById('fields');
const fnTypeEl=document.getElementById('fnType');
const qrSizeEl=document.getElementById('qrSize');
const qrECEl=document.getElementById('qrEC');
const moduleColorEl=document.getElementById('moduleColor');
const bgColorEl=document.getElementById('bgColor');
const logoInputEl=document.getElementById('logoInput');
const logoScaleEl=document.getElementById('logoScale');
const logoRadiusEl=document.getElementById('logoRadius');
const logoBorderEl=document.getElementById('logoBorderSize');
const logoPreviewImg=document.getElementById('logoPreviewImg');
const logoEmpty=document.getElementById('logoEmpty');
const clearLogoBtn=document.getElementById('clearLogo');
const downloadBtn=document.getElementById('downloadBtn');
const previewCanvas=document.getElementById('qrPreview');
const previewCtx=previewCanvas.getContext('2d');
let logoImage=null;
let latestExportCanvas=null;
function html(s,...v){return s.map((s,i)=>s+(v[i]??'')).join('');}
const templates={
    text:()=>html`<label for="textValue" class="btxt">URL or Text</label><br><textarea class="button" id="textValue" placeholder="https://example.com"></textarea>`,
    wifi:()=>html`<div class="row"><div><label for="wifiSsid">SSID:</label><br><input id="wifiSsid" type="text" placeholder="Enter SSID Here" class="button"/></div><div><label for="wifiAuth">Security:</label><br><select id="wifiAuth" class="button"><option value="WPA">WPA</option><option value="WEP">WEP</option><option value="nopass">None</option></select></div></div><div><label for="wifiPass">Password:</label><br><input placeholder="Enter Password Here" class="button" id="wifiPass" type="text" /></div>`,
    email:()=>html`<label for="emailTo">To:</label><br><input id="emailTo" type="email" class="button" placeholder="Enter Email Address Here"/><br><label for="emailSubject">Subject: </label><br><input class="button" id="emailSubject" type="text" placeholder="Enter Subject Here" /><br><label for="emailBody">Body: </label><br><textarea id="emailBody" class="button" placeholder="Enter Email Body Here"></textarea>`,
    phone:()=>html`<label for="telNumber">Phone Number: </label><br><input id="telNumber" class="button" placeholder="Enter Phone Number" type="text" />`,
    sms:()=>html`<label for="smsNumber">Number: </label><br><input id="smsNumber" type="text" class="button" placeholder="Enter Phone Number" /><br><label for="smsBody">Message:</label><br><input class="button" placeholder="Enter Message Here" id="smsBody" type="text" />`,
    geo:()=>html`<label for="geoLat">Latitude:</label><br><input id="geoLat" class="button" placeholder="Enter Lat Here" type="text" /><br><label for="geoLng">Longitude:</label><br><input class="button" placeholder="Enter Long Here" id="geoLng" type="text" />`
};
function renderFields(){
    fieldsEl.innerHTML=templates[fnTypeEl.value]();
    fieldsEl.querySelectorAll('input,textarea,select').forEach(el=>{
        el.addEventListener('input',scheduleRender);
        el.addEventListener('change',scheduleRender);
    });
    scheduleRender();
}
function buildPayload(){
    const type=fnTypeEl.value;
    const g=(id)=>fieldsEl.querySelector('#'+id);
    switch(type){
        case 'text': return (g('textValue')?.value||'').trim();
        case 'wifi': {const ssid=g('wifiSsid')?.value||''; const auth=g('wifiAuth')?.value||'WPA'; const pass=g('wifiPass')?.value||''; return `WIFI:T:${auth};S:${ssid};${auth!=='nopass'?`P:${pass};`:''};`;}
        case 'email': {const to=g('emailTo')?.value||''; const sub=g('emailSubject')?.value||''; const body=g('emailBody')?.value||''; return `mailto:${to}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;}
        case 'phone': return 'tel:'+((g('telNumber')?.value||'').replace(/\s+/g,'')); 
        case 'sms': {const num=(g('smsNumber')?.value||'').replace(/\s+/g,''); const body=g('smsBody')?.value||''; return `SMSTO:${num}:${body}`;}
        case 'geo': return `geo:${g('geoLat')?.value||''},${g('geoLng')?.value||''}`;
    }
}
let renderTimer=null;
function scheduleRender(){ clearTimeout(renderTimer); renderTimer=setTimeout(()=>{generateAndPreview();},50); }
function generateQRCodeCanvas(data,size,ecLevel,moduleColor,bg){
    const tempDiv=document.createElement('div'); tempDiv.style.position='absolute'; tempDiv.style.left='-9999px'; document.body.appendChild(tempDiv);
    const qr=new QRCode(tempDiv,{text:data,width:size,height:size,colorDark:moduleColor,colorLight:bg,correctLevel:QRCode.CorrectLevel[ecLevel]});
    const cnv=tempDiv.querySelector('canvas'); document.body.removeChild(tempDiv); return cnv;
}
function drawRoundedImage(ctx,img,x,y,w,h,r){ ctx.save(); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.clip(); ctx.drawImage(img,x,y,w,h); ctx.restore(); }
function composeFinalCanvas(qrCanvas, options){
    const size=qrCanvas.width;
    const out=document.createElement('canvas');
    out.width=size;
    out.height=size;
    const ctx=out.getContext('2d');
    ctx.drawImage(qrCanvas,0,0);
    if(options.logoImage){
        const pct=Math.max(8,Math.min(40,Number(logoScaleEl.value)||22))/100;
        const logoSize=Math.round(size*pct);
        const cx=size/2,cy=size/2;
        const x=Math.round(cx-logoSize/2), y=Math.round(cy-logoSize/2);
        const logoBorder=Math.max(0,Number(logoBorderEl.value)||8);
        const bgX=x-logoBorder,bgY=y-logoBorder,bgW=logoSize+logoBorder*2,bgH=logoSize+logoBorder*2;
        const rad=Math.max(0,Math.min(Number(logoRadiusEl.value)||16,80));
        ctx.save();
        ctx.beginPath();
        const r=Math.min(rad+logoBorder,Math.min(bgW,bgH)/2);
        ctx.moveTo(bgX+r,bgY); ctx.arcTo(bgX+bgW,bgY,bgX+bgW,bgY+bgH,r); ctx.arcTo(bgX+bgW,bgY+bgH,bgX,bgY+bgH,r); ctx.arcTo(bgX,bgY+bgH,bgX,bgY,r); ctx.arcTo(bgX,bgY,bgX+bgW,bgY,r); ctx.closePath();
        ctx.fillStyle='#ffffff'; ctx.fill(); ctx.restore();
        drawRoundedImage(ctx,options.logoImage,x,y,logoSize,logoSize,Math.min(rad,logoSize/2));
    }
    return out;
}
async function generateAndPreview(){
    const payload=buildPayload();
    if(!payload){ previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height); return; }
    const size=Math.max(128,Math.min(2048,Number(qrSizeEl.value)||420));
    const ec=qrECEl.value;
    const mColor=moduleColorEl.value||'#000';
    const bg=bgColorEl.value||'#fff';
    const qrCanvas=generateQRCodeCanvas(payload,size,ec,mColor,bg);
    latestExportCanvas=composeFinalCanvas(qrCanvas,{logoImage});
    previewCanvas.width=latestExportCanvas.width;
    previewCanvas.height=latestExportCanvas.height;
    previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);
    previewCtx.drawImage(latestExportCanvas,0,0);
}
fnTypeEl.addEventListener('change',renderFields);
qrSizeEl.addEventListener('input',scheduleRender);
qrECEl.addEventListener('change',scheduleRender);
moduleColorEl.addEventListener('input',scheduleRender);
bgColorEl.addEventListener('input',scheduleRender);
logoScaleEl.addEventListener('input',scheduleRender);
logoRadiusEl.addEventListener('input',scheduleRender);
logoBorderEl.addEventListener('input',scheduleRender);
logoInputEl.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) {
        logoImage = null;
        if (logoPreviewImg) logoPreviewImg.style.display = 'none';
        if (logoEmpty) logoEmpty.style.display = 'inline';
        scheduleRender();
        return;
    }
    const img = new Image();
    img.onload = () => {
        logoImage = img;
        if (logoPreviewImg) {
            logoPreviewImg.src = img.src;
            logoPreviewImg.style.display = 'block';
        }
        if (logoEmpty) {
            logoEmpty.style.display = 'none';
        }
        scheduleRender();
    };
    img.src = URL.createObjectURL(file);
});
clearLogoBtn.addEventListener('click', () => {
    logoImage = null;
    logoInputEl.value = '';
    if (logoPreviewImg) {
        logoPreviewImg.style.display = 'none';
        logoPreviewImg.src = '';
    }
    if (logoEmpty) {
        logoEmpty.style.display = 'inline';
    }
    scheduleRender();
});
downloadBtn.addEventListener('click',()=>{
    if(!latestExportCanvas) return;
    latestExportCanvas.toBlob(blob=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='qr-code.png'; a.click(); });
});
renderFields();