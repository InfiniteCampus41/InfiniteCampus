import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import readline from "readline";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let PORT = 2000;
let serverAuthorized = false;
function log() {
  	console.log("This Program Was Made By Hacker41");
  	serverAuthorized = true;
}
function printBanner() {
  	console.clear();
  	console.log(`
		╭────────────────╮
		|    .d8888b.    |
		|   d88P  Y88b   |
		|   888    888   |
		|   888          |
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