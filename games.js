document.addEventListener("DOMContentLoaded", function () {
    const launchButton = document.getElementById("launchGames");
    const before = document.getElementById("before");
    if (!launchButton) return;
    launchButton.addEventListener("click", function () {
            before.style.display = 'none';
            const games = [
            { name: "Slope", url: "https://mathadventure1.github.io/slope/slope/index.html" },
            { name: "NettleWeb (1)", url: "https://nettleweb.com"},
            { name: "NettleWeb (2)", url: "https://sigmasigmatoiletedge.github.io" },
            { name: "Ngon", url: "https://landgreen.github.io/n-gon/" },
            { name: "Eaglercraft ( 1.5.2 )", url: "https://sd592g.github.io/zj684od4lfg/" },
            { name: "Eaglercraft ( 1.8.8 )", url: "https://resent4-0.vercel.app/" },
            { name: "Minecraft ( Connect To Real Servers! )", url: "https://mcraft.fun/" },
            { name: "Eaglercraft Servers", url: "https://servers.eaglercraft.com/" },
            { name: "Roblox ( Server 1 )", url: "https://www.easyfun.gg/games/roblox.html" },
            { name: "Roblox ( Server 2 )", url: "https://dashboard-cq4z.onrender.com/?ng_ifp_partner=skool" },
            { name: "Roblox ( Server 3 )", url: "https://html.cafe/x8bcb5934" },
            { name: "Run 3", url: "https://lekug.github.io/tn6pS9dCf37xAhkJv/" },
            { name: "Bad Time Simulator", url: "https://jcw87.github.io/c2-sans-fight/"},
            { name: "OVO", url: "https://www.hoodamath.com/mobile/games/ovo/game.html?nocheckorient=1" },
            { name: "Pixel Gun 3D", url: "https://games.crazygames.com/en_US/pixel-gun-3d/index.html" },
            { name: "Rooftop Snipers", url: "https://rooftop-snipers.github.io/file/" },
            { name: "Stickman Hook", url: "https://mountain658.github.io/g/stickmanhook/index.html" },
            { name: "We Become What We Behold", url: "https://gnhustgames.github.io/wbwwb/" },
            { name: "Universal Paperclips", url: "https://ryann-4.github.io/universal-paperclips/index2.html" },
            { name: "Plants Vs Zombies", url: "https://games.gombis.com/plants-vs-zombies-3?hl=en" },
            { name: "Gridland", url: "https://gridland.doublespeakgames.com/" },
            { name: "8 Ball Pool Multiplayer", url: "https://foony.com/games/8-ball-pool-online-billiards?&platform=crazygames" },
            { name: "Gulper.io", url: "https://gulper.io/" },
            { name: "Skribbl.io", url: "https://skribbl.io/" },
            { name: "Paper.io 2", url: "https://mountain658.github.io/g/paperio2/paperio2.html" },
            { name: "Deeeep.io", url: "https://beta.deeeep.io/" },
            { name: "Voxiom.io", url: "https://voxiom.io/?nolinks=1&authTest=1" },
            { name: "Brutal.io", url: "https://brutal.io/" },
            { name: "Bonk.io", url: "https://bonk.io/" },
            { name: "Slither.io", url: "https://slithergame.io/slither-io.embed" },
            { name: "Ninja.io", url: "https://ninja.io/" },
            { name: "Wings.io", url: "https://wings.io/" },
            { name: "Mope.io", url: "https://mope.io/" },
            { name: "Warbot.io", url: "https://warbot.io/"},
            { name: "Diep.io", url: "https://diep.io/" },
            { name: "Agar.io Neocities Version", url: "https://agar.neocities.org/" },
            { name: "Kour.io", url: "https://kour.io/" },
            { name: "Wormate.io", url: "https://wormate.io/" },
            { name: "Build Royale", url: "https://buildroyale.io/" },
            { name: "BLOXD.IO", url: "https://bloxd.io/" },
            { name: "2048", url: "https://2048game.com/" },
            { name: "9007199254740992", url: "https://dmitrykuzmenko.github.io/2048/" },
            { name: "Subway Surfers", url: "https://dddavit.github.io/subway/" },
            { name: "World's Hardest Game", url: "https://mountain658.github.io/zworldsHardestGame.html" },
            { name: "Drive Mad", url: "https://ubg365.github.io/drive-mad/play.html" },
            { name: "HexGL", url: "https://hexgl.bkcore.com/play/" },
            { name: "BitLife", url: "https://ubg365.github.io/bitlife-life-simulator/play.html" },
            { name: "Shell Shockers", url: "https://shellshock.io/" },
            { name: "Moto X3M", url: "https://ubg365.github.io/moto-x3m/play.html" },
            { name: "Moto X3M 2", url: "https://slope-game.github.io/newgame/motox3m-2/" },
            { name: "Moto X3M 3", url: "https://slope-game.github.io/newgame/motox3m-3/" },
            { name: "Moto X3M Winter", url: "https://unblocked-games.s3.amazonaws.com/games/2024/gm/moto-x3m-winter/index.html" },
            { name: "Moto X3M Pool Party", url: "https://unblocked-games.s3.amazonaws.com/games/2024/gm/moto-x3m-pool-party/index.html" },
            { name: "Moto X3M Spooky Land", url: "https://unblocked-games.s3.amazonaws.com/games/2024/gm/moto-x3m-spooky-land/index.html" },
            { name: "Fireboy And Watergirl 1", url: "https://fireboyandwatergirlunblocked.github.io/" },
            { name: "Fireboy And Watergirl 2", url: "https://app-96912.games.s3.yandex.net/96912/jxv8hpvk1a4cg9pivs3p6coxop7sufps/index.html" },
            { name: "Fireboy And Watergirl 3", url: "https://html5.gamedistribution.com/f3a6e1ac0a77412289cbac47658b2b68/?gd_sdk_referrer_url=https://www.mathnook.com/fun-games-2/fireboy-and-watergirl-3.html" },
            { name: "Fireboy And Watergirl 4", url: "https://fireboyandwatergirlunblocked.github.io/4/" },
            { name: "Fireboy And Watergirl 5", url: "https://fireboyandwatergirlunblocked.github.io/5/" },
            { name: "Fireboy And Watergirl 6", url: "https://fireboyandwatergirlunblocked.github.io/6/" },
            { name: "Death Run 3D", url: "https://ubg365.github.io/death-run-3d/" },
            { name: "Bad Time Simulator ( Sans Fight )", url: "https://undertale-play.com/wp-content/uploads/gg/bad-time-simulator/" },
            { name: "EggyCar", url: "https://ubg365.github.io/eggy-car/play.html" },
            { name: "Stack", url: "https://ubg365.github.io/stack/" },
            { name: "Asteroids ( 1986 )", url: "https://downloads.retrostic.com/play.php?console_slug=atari-7800&rom_url=https://downloads.retrostic.com/roms/Asteroids.zip" },
            { name: "Asteroids ( 1979 )", url: "https://www.retrogames.cc/embed/44988-asteroids-rev-4.html" },
            { name: "Breakout", url: "https://www.coolmathgames.com/sites/default/files/public_games/41808/?gd_sdk_referrer_url=https%3A%2F%2Fwww.coolmathgames.com%2F0-atari-breakout" },
            { name: "Bosconian", url: "https://www.retrogames.cc/embed/42458-bosconian-old-version.html" },
            { name: "Doom", url: "https://arcader.com/roms/doom.html" },
            { name: "Half-Life 1", url: "https://x8bitrain.github.io/webXash/" },
            { name: "Tetris ( NES )", url: "https://downloads.retrostic.com/play.php?console_slug=nes&rom_url=https://downloads.retrostic.com/roms/Tetris%20%28USA%29.zip" },
            { name: "EarthBound", url: "https://downloads.retrostic.com/play.php?console_slug=snes&rom_url=https://downloads.retrostic.com/roms/EarthBound%20%28USA%29.zip" },
            { name: "Pac Man", url: "https://downloads.retrostic.com/play.php?console_slug=mame&rom_url=https://downloads.retrostic.com/roms/pacman.zip" },
            { name: "New Rally X", url: "https://www.retrogames.cc/embed/9312-new-rally-x.html" },
            { name: "Super Mario Bros", url: "https://downloads.retrostic.com/play.php?console_slug=nes&rom_url=https://downloads.retrostic.com/roms/Super%20Mario%20Bros%20%28E%29.zip" },
            { name: "Hover Racer Drive", url: "https://ubg365.github.io/hover-racer-drive/" },
            { name: "Drift Boss", url: "https://ubg365.github.io/drift-boss/" },
            { name: "Madalin Stunt Cars 2 (Long Load Time)", url: "https://ubg100.github.io/games/Madalin/index.html" },
            { name: "Snake", url: "https://ubg100.github.io/games/snakegame/index.html" },
            { name: "Breaking The Bank", url: "https://mountain658.github.io/zbreakingthebank.html" },
            { name: "Escaping The Prison", url: "https://mountain658.github.io/zescapetheprison.html" },
            { name: "Stealing The Diamond", url: "https://mountain658.github.io/zstealingthediamond.html" },
            { name: "Infiltrating The Airship", url: "https://sz-games.github.io/games/Flash.html?game=/games/henry-airship/infiltratingtheairshipgame.swf" },
            { name: "Fleeing The Complex", url: "https://sz-games.github.io/games/Flash.html?game=https://sz-games.github.io/Games6/Henry%20Stickmin%20-%20Fleeing%20the%20Complex.swf?raw=true" },
            { name: "1v1.lol", url: "https://sz-games.github.io/Games-2/lol/" },
            { name: "Time Shooter", url: "https://games.crazygames.com/en_US/time-shooter/index.html" },
            { name: "Time Shooter 2", url: "https://games.crazygames.com/en_US/time-shooter-2/index.html" },
            { name: "Time Shooter 3", url: "https://games.crazygames.com/en_US/time-shooter-3-swat/index.html" },
            { name: "Bloxorz", url: "https://ad-freegames.github.io/flash/game/bloxorz.html" },
            { name: "Tagpro", url: "https://tagpro.koalabeast.com/" },
            { name: "Baldis Basics", url: "https://igroutka.ru/loader/game/26471/" },
            { name: "Doodle Jump", url: "https://webglmath.github.io/doodle-jump/" },
            { name: "Drift Hunters", url: "https://htmlxm.github.io/h/drift-hunters/" },
            { name: "Chrome Dino", url: "https://htmlxm.github.io/h7/dinosaur-game/" },
            { name: "Crossy Road", url: "https://htmlxm.github.io/h/crossy-road/" },
            { name: "Flappy Bird", url: "https://htmlxm.github.io/h8/flappy-bird-origin/" },
            { name: "Retro Bowl", url: "https://loserboysonyt.github.io/" },
            { name: "Basketball Stars", url: "https://htmlxm.github.io/h/basketball-stars/" },
            { name: "Tunnel Rush", url: "https://ubg44.github.io/TunnelRush/" },
            { name: "Stumble Guys ( Server 1 )", url: "https://www.stumbleguys.com/play" },
            { name: "Cookie Clicker", url: "https://cookieclickerunblocked.github.io/games/cookie-clicker/index.html" },
            { name: "Capybara Clicker", url: "https://capybara-clicker.com/" },
            { name: "Snowball.io", url: "https://games.crazygames.com/en_US/snowball-io/index.html" },
            { name: "Doodle Road", url: "https://games.crazygames.com/en_US/doodle-road/index.html" },
            { name: "Minesweeper", url: "https://minesweeper.online/" },
            { name: "FNAF ( Web Remake )", url: "https://ubg77.github.io/fix/fnaf1/" },
            { name: "Krunker.io", url: "https://krunker.io/" },
            { name: "Duck Life", url: "https://ducklifegame.github.io/file/" },
            { name: "Duck Life 2", url: "https://www.hoodamath.com/mobile/games/duck-life-2-world-champion/game.html?nocheckorient=1" },
            { name: "Duck Life 3", url: "https://www.hoodamath.com/mobile/games/duck-life-3-evolution/game.html?nocheckorient=1" },
            { name: "Duck Life 4", url: "https://www.hoodamath.com/mobile/games/duck-life-4/game.html?nocheckorient=1" },
            { name: "Duck Life 5", url: "https://archive.org/embed/duck-life-treasure-hunt" },
            { name: "Duck Life 6", url: "https://www.hoodamath.com/mobile/games/duck-life-6-space/game.html?nocheckorient=1" },
            { name: "Madness Accelerant", url: "https://ad-freegames.github.io/flash/game/madness-accelerant.html" },
            { name: "Draw Climber", url: "https://ext.minijuegosgratis.com//draw-climber//gameCode//index.html" },
            { name: "Cut The Rope", url: "https://games.cdn.famobi.com/html5games/c/cut-the-rope/v020/?fg_domain=play.famobi.com&fg_aid=A-QU5FO&fg_uid=4531b37c-a8e0-4a67-9ebd-e8d3190b6277&fg_pid=f821547d-586c-4df8-83e5-796f8c2d3d64&fg_beat=963&original_ref=" },
            { name: "Timore", url: "https://media2.y8.com/y8-studio/unity_webgl_games/u53/timore_v3/" },
            { name: "Getaway Shootout", url: "https://ubg44.github.io/GetawayShootout/" },
            { name: "Temple Of Boom", url: "https://g.igroutka.ru/games/49/temple_of_boom/uploads/game/html5/6009/" },
            { name: "Tanuki Sunset", url: "https://kdata1.com/2020/04/962943/" },
            { name: "Dino Swords", url: "https://dinoswords.gg/" },
            { name: "Smash Karts", url: "https://smashkarts.io/" },
            { name: "Tiny Fishing", url: "https://ubg365.github.io/tiny-fishing/" },
            { name: "Hammer 2", url: "https://games.crazygames.com/en_US/hammer-2/index.html" },
            { name: "OSU", url: "https://webosu.online/" },
            { name: "Flight Sim ( Scratch )", url: "https://scratch.mit.edu/projects/74221074/embed" },
            { name: "Geometry Dash ( Scratch )", url: "https://html.cafe/x8e83d9f3" },
            { name: "Getting Over It ( Scratch )", url: "https://turbowarp.org/389464290/embed?autoplay&addons=remove-curved-stage-border,pause,gamepad" },
            { name: "Infinite Craft", url: "https://infinite-craft.com/infinite-craft/" },
            { name: "Wordle", url: "https://wordleunlimited.org/" },
            { name: "Worldguessr", url: "https://www.worldguessr.com/" },
            { name: "Tomb Of The Mask", url: "https://mountain658.github.io/g/tombofthemask/index.html" } 
        ];
        let container = document.getElementById("gamesContainer");
        if (!container) {
            container = document.createElement("div");
            container.setAttribute("id", "gamesContainer");
            container.style.padding = "30px";
            container.style.display = "flex";
            container.style.flexWrap = "wrap";
            container.style.justifyContent = "center";
            container.style.gap = "10px";
            document.body.appendChild(container);
        }
        games.forEach(function (game) {
            const button = document.createElement("button");
            button.textContent = game.name;
            button.className = "button";
            button.style.padding = "10px 20px";
            button.style.fontSize = "16px";
            button.style.cursor = "pointer";
            button.onclick = function () {
                container.style.display = "none";
                const backButton = document.createElement("button");
                backButton.textContent = "← Back";
                backButton.className = "button";
                backButton.style.position = "fixed";
                backButton.style.top = "70px";
                backButton.style.left = "10px";
                backButton.style.zIndex = "1000";
                backButton.style.padding = "10px";
                backButton.style.fontSize = "16px";
                backButton.style.cursor = "pointer";
                document.body.appendChild(backButton);
                const fullscreen = document.createElement("button");
                fullscreen.textContent = "⛶";
                fullscreen.className = "button";
                fullscreen.style.position = "fixed";
                fullscreen.style.bottom = "10px";
                fullscreen.style.right = "10px";
                fullscreen.style.zIndex = "1000";
                fullscreen.style.padding = "10px";
                fullscreen.style.fontSize = "16px";
                fullscreen.style.cursor = "pointer";
                document.body.appendChild(fullscreen);
                const addressInput = document.getElementById("sj-address");
                if (addressInput) {
                    addressInput.value = game.url;
                    const form = document.getElementById("sj-form");
                    if (form) {
                        const event = new Event("submit", { bubbles: true, cancelable: true });
                        form.dispatchEvent(event);
                    }
                }
                fullscreen.onclick = function () {
                    const iframe = document.querySelector("iframe");
                    if (!iframe) return;
                    if (!document.fullscreenElement) {
                        iframe.requestFullscreen().catch(err => console.error(err));
                    } else {
                        document.exitFullscreen();
                    }
                };
                backButton.onclick = function () {
                    const iframes = document.querySelectorAll("iframe");
                    iframes.forEach(iframe => iframe.remove());
                    backButton.remove();
                    fullscreen.remove();
                    container.style.display = "flex";
                };
            };
            container.appendChild(button);
        });
    });
});