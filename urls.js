let z = "www.infinitecampus.xyz";
let fn = location.hostname;
if (fn === "infinitecampus.xyz") {
    z = "infinitecampus.xyz";
} else if (fn === "instructure.space") {
    z = "instructure.space";
}
let y = `https://${z}/scram/scramjet.all.js`;