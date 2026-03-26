import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import fs from "fs";
import https from "https";
import AdmZip from "adm-zip";
import readline from "readline";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let PORT = 2000;
let serverAuthorized = false;
function log() {
  	console.log("This Program Was Made By Hacker41");
  	serverAuthorized = true;
}
const VERSION_FILE = "version.txt";
const VERSION_URLS = [
    "https://raw.githubusercontent.com/Infinitecampus41/InfiniteCampus/main/version.txt",
    "https://www.infinitecampus.xyz/version.txt",
    "https://instructure.space/version.txt",
	"https://infinitecampus.xyz/version.txt",
	"https://backup.infinitecampus.xyz/version.txt",
	"https://backup.instructure.space/version.txt"
];
const ZIP_URLS = [
    "https://github.com/InfiniteCampus41/Infinitecampus/archive/refs/heads/main.zip"
];
function fetchText(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            if (res.statusCode !== 200) {
                reject(new Error("Bad Status: " + res.statusCode));
                return;
            }
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(data.trim()));
        }).on("error", reject);
    });
}
async function runUpdate() {
    for (const url of ZIP_URLS) {
        try {
            console.log(`Downloading Update From ${url}...`);
            await downloadFile(url, "update.zip");
            const zip = new AdmZip("update.zip");
            const tempDir = path.join(__dirname, "update_temp");
            zip.extractAllTo(tempDir, true);
            const extractedRoot = fs.readdirSync(tempDir)[0];
            const fullPath = path.join(tempDir, extractedRoot);
            const files = fs.readdirSync(fullPath);
            for (const file of files) {
                if (file === "pfps") continue;
                const src = path.join(fullPath, file);
                const dest = path.join(__dirname, file);
                fs.rmSync(dest, { recursive: true, force: true });
                fs.cpSync(src, dest, { recursive: true });
            }
            fs.rmSync("update.zip", { force: true });
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log("✔ Update Complete. Restart Server.");
            return;
        } catch (e) {
            console.log(`✖ Failed Update From ${url}`);
        }
    }
    console.log("❌ All Update Sources Failed.");
}
async function getRemoteVersion() {
    for (const url of VERSION_URLS) {
        try {
            const v = await fetchText(url);
            console.log(`✔ Version Fetched From ${url}`);
            return v;
        } catch (e) {
            console.log(`✖ Failed: ${url}`);
        }
    }
    return null;
}
function getLocalVersion() {
    try {
        return fs.readFileSync(VERSION_FILE, "utf-8").trim();
    } catch {
        return null;
    }
}
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, res => {
            res.pipe(file);
            file.on("finish", () => {
                file.close(resolve);
            });
        }).on("error", err => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}
function printBanner() {
  	console.clear();
  	console.log(`
		╭────────────────╮
		|    .d8888b.    |
		|   d88P  Y88b   |
		|   888    888   |
		|   888          |
		|   888    888   |
		|   Y88b  d88P   |
		|    "Y8888P"    |    
		╰────────────────╯
	`);
}
function getLocalIP() {
  	const nets = os.networkInterfaces();
  	for (const name of Object.keys(nets)) {
    	for (const net of nets[name]) {
      		if (net.family === "IPv4" && !net.internal) {
        		return net.address;
      		}
    	}
  	}
  	return "127.0.0.1";
}
printBanner();
log();
if (!serverAuthorized) {
  	console.error("Server Start Error");
  	process.exit(1);
}
const rl = readline.createInterface({
  	input: process.stdin,
  	output: process.stdout
});
rl.question(
  	"Choose Port \n Default 2000\n> ",
  	(portInput) => {
    	const parsed = parseInt(portInput, 10);
    	if (!isNaN(parsed) && parsed > 0 && parsed < 65536) {
      		PORT = parsed;
    	}
   	 	rl.question(
      		"\nChoose Server Visibility:\n1) Local\n2) Entire Network\n\n> ",
      		(choice) => {
        		let HOST;
        		let mode;
        		if (choice === "1") {
          			HOST = "127.0.0.1";
          			mode = "Local";
        		} else if (choice === "2") {
          			HOST = "0.0.0.0";
          			mode = "Network";
        		} else {
          			console.log("\nInvalid Selection.\n");
          			rl.close();
          			process.exit(1);
        		}
        		rl.close();
        		startServer(HOST, mode);
      		}
    	);
  	}
);
(async () => {
    const localVersion = getLocalVersion();
    const remoteVersion = await getRemoteVersion();
    if (!remoteVersion) {
        console.log("⚠ Could Not Check For Updates (All Sources Failed)");
        return;
    }
    if (localVersion !== remoteVersion) {
        console.log("\n⚠ UPDATE AVAILABLE");
        console.log(`Local : ${localVersion}`);
        console.log(`Remote: ${remoteVersion}`);
        console.log("Type 'update' To Update Files.\n");
        process.stdin.on("data", async (data) => {
            const input = data.toString().trim();
            if (input === "update") {
                await runUpdate();
                process.exit(0);
            }
        });
    } else {
        console.log("✔ Server Is Up To Date\n");
    }
})();
function startServer(HOST, mode) {
  	console.clear();
  	printBanner();
  	log();
  	const app = express();
  	const localIP = getLocalIP();
  	app.use(express.static(__dirname));
  	app.use((req, res) => {
    	res.status(404).send("File Not Found");
  	});
  	app.listen(PORT, HOST, () => {
    	console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    	console.log("Infinite Campus Server Running");
    	console.log(`Mode      : ${mode}`);
    	console.log(`Port      : ${PORT}`);
    	if (HOST === "0.0.0.0") {
      		console.log(`Network   : http://${localIP}:${PORT}`);
    	} else {
      		console.log(`Local URL : http://localhost:${PORT}`);
    	}
    	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    	console.log("Press Ctrl C To Stop");
  	});
}