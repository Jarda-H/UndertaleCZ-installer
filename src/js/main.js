let t = window.__TAURI__
const { getName } = t.app;
const { invoke } = t.tauri;
const { ask, dialog, message, open: openPicker } = t.dialog;
const { exit } = t.process;
const {
    writeBinaryFile,
    BaseDirectory,
    removeFile: rmTemp,
} = t.fs;
const { tempdir } = t.os;
const { open: openPath, Command: RunCmd } = t.shell;
const DISCORD_LINK = "https://discord.gg/beGejNfDmv";
const STEAM_MD5 = "5903fc5cb042a728d4ad8ee9e949c6eb";
const GOG_MD5 = "dd8ebb409962e678258106468ced621e";
let 
//Papyrus letterbox
function Speak(elem) {
    let text = elem.innerHTML;
    if (!text) return;
    //get closest parent letter-box
    let p1 = elem.closest(".letter-box").querySelector(".pap1");
    let p2 = elem.closest(".letter-box").querySelector(".pap2");
    //get current tab
    let tab = elem.closest(".tab");
    if (tab.classList.contains("done")) return;
    //show letter by letter
    elem.innerHTML = "";
    let i = 0;
    let interval = setInterval(() => {
        //if tab is not visible, stop
        if (tab.style.display == "none") {
            clearInterval(interval);
            elem.innerHTML = text;
            //done speaking
            tab.classList.add("done");
            return;
        }
        elem.innerHTML += text[i];
        //play sound
        let audio = new Audio('../assets/text_papyrus.mp3');
        audio.play();
        //animate
        if (i % 2 == 0) {
            p1.style.display = "block";
            p2.style.display = "none";
        } else {
            p1.style.display = "none";
            p2.style.display = "block";
        }
        i++;
        if (i >= text.length) {
            tab.classList.add("done");
            clearInterval(interval);
        }
    }, 70);
}
// a simple parser for Valve's KeyValue format
// https://developer.valvesoftware.com/wiki/KeyValues
//
// authors:
// Rossen Popov, 2014-2016
// p0358, 2019-2021
// https://github.com/p0358/vdf-parser/blob/master/main.js
function VDFparse(text, options) {
    if (typeof text !== "string") {
        throw new TypeError("VDF.parse: Expecting parameter to be a string");
    }

    options = {
        types:
            (typeof options === "boolean") ? options // backward compatibility with the old boolean param
                : ((typeof options === "object" && "types" in options) ? options.types : true),
        arrayify: (typeof options === "object" && "arrayify" in options) ? options.arrayify : true,
        conditionals: (typeof options === "object" && "conditionals" in options) ? options.conditionals : undefined
    };
    if (options.conditionals && !Array.isArray(options.conditionals) && typeof options.conditionals === "string") options.conditionals = [options.conditionals];

    var lines = text.split("\n");

    var obj = {};
    var stack = [obj];
    var expect_bracket = false;
    var odd = false;

    var re_kv = new RegExp(
        '^[ \\t]*' +
        '("((?:\\\\.|[^\\\\"])+)"|([a-zA-Z0-9\\-\\_]+))' + // qkey, key

        '([ \\t]*(' +
        '"((?:\\\\.|[^\\\\"])*)(")?' + // qval, vq_end
        '|([a-zA-Z0-9\\-\\_.]+)' + // val
        '))?' +

        '(?:[ \\t]*\\[(\\!?\\$[A-Z0-9]+(?:(?:[\\|]{2}|[\\&]{2})\\!?\\$[A-Z0-9]+)*)\\])?' // conditionals
    );

    var i = -1, j = lines.length, line, sublines;
    var getNextLine = function () {
        if (sublines && sublines.length) {
            var _subline = sublines.shift();
            if (!odd) _subline = _subline.trim(); // we need to trim the line if outside of quoted value
            return _subline;
        }

        var _line = lines[++i];

        // skip empty and comment lines
        // but only if we are not inside of a quote value
        while (!odd && _line !== undefined && (_line = _line.trim()) && (_line == "" || _line[0] == '/'))
            _line = lines[++i];

        if (_line === undefined)
            return false; // this is the end

        // make sure brackets are in separate lines, as this code assumes
        // done separately to retain correct line numbers in errors

        // skip tricky comments + add newlines around brackets, while making sure that slashes are not part of some key/value (inside quotes)
        //var odd = false; // odd number of quotes encountered means we are inside of a quote value
        var comment_slash_pos = -1;
        sanitization: for (var l = 0; l < _line.length; l++) {
            switch (_line.charAt(l)) {
                case '"': if (_line.charAt(l - 1) != '\\') odd = !odd; break;
                case '/': if (!odd) { comment_slash_pos = l; break sanitization; } break;
                case '{': if (!odd) { _line = _line.slice(0, l) + "\n{\n" + _line.slice(l + 1); l += 2; } break;
                case '}': if (!odd) { _line = _line.slice(0, l) + "\n}\n" + _line.slice(l + 1); l += 2; } break;
            }
        }
        if (comment_slash_pos > -1) _line = _line.substr(0, comment_slash_pos);

        //if (!odd) _line = _line.trim(); // isn't that redundant?
        sublines = _line.split("\n"); // no trim here
        return getNextLine();
    }

    while ((line = getNextLine()) !== false) {

        // skip empty and comment lines, again
        if (line == "" || line[0] == '/') { continue; }

        // one level deeper
        if (line[0] == "{") {
            expect_bracket = false;
            continue;
        }

        if (expect_bracket) {
            throw new SyntaxError("VDF.parse: invalid syntax on line " + (i + 1) + " (expected opening bracket, empty unquoted values are not allowed):\n" + line);
        }

        // one level back
        if (line[0] == "}") {
            if (Array.isArray(stack[stack.length - 2])) stack.pop(); // if the element above is an array, we need to pop twice
            stack.pop();
            continue;
        }

        // parse keyvalue pairs
        while (true) {
            var m = re_kv.exec(line);

            if (m === null) {
                throw new SyntaxError("VDF.parse: invalid syntax on line " + (i + 1) + ":\n" + line);
            }

            // qkey = 2
            // key = 3
            // qval = 6
            // vq_end = 7
            // val = 8
            var key = (m[2] !== undefined) ? m[2] : m[3];
            var val = (m[6] !== undefined) ? m[6] : m[8];

            if (val === undefined) {
                // parent key

                // does not exist at all yet
                if (stack[stack.length - 1][key] === undefined /*|| typeof stack[stack.length-1][key] !== 'object'*/) {
                    stack[stack.length - 1][key] = {};
                    stack.push(stack[stack.length - 1][key]);
                }

                // exists already, is an object, but not an array
                else if (stack[stack.length - 1][key] !== undefined && !Array.isArray(stack[stack.length - 1][key])) {
                    if (options.arrayify) {
                        // we turn it into an array to push the next object there
                        stack[stack.length - 1][key] = [stack[stack.length - 1][key], {}]; // turn current object into array with the object and new empty object
                        stack.push(stack[stack.length - 1][key]); // push our array to stack
                        stack.push(stack[stack.length - 1][1]); // push our newly created (2nd) object to stack
                    } else {
                        // push it on stack and let it get patched with new values
                        stack.push(stack[stack.length - 1][key]);
                    }
                }

                // exists already, is an array of objects
                else if (stack[stack.length - 1][key] !== undefined && Array.isArray(stack[stack.length - 1][key])) {
                    if (!options.arrayify)
                        throw new Error("VDF.parse: this code block should never be reached with arrayify set to false! [1]");
                    stack.push(stack[stack.length - 1][key]); // push current array on stack
                    stack[stack.length - 1].push({}); // append new object to that array
                    stack.push(stack[stack.length - 1][(stack[stack.length - 1]).length - 1]); // push that new (last) object on stack
                }

                expect_bracket = true;
            }
            else {
                // value key

                if (m[7] === undefined && m[8] === undefined) {
                    if (i + 1 >= j) {
                        throw new SyntaxError("VDF.parse: un-closed quotes at end of file");
                    }
                    line += "\n" + getNextLine();
                    continue;
                }

                if (options.conditionals !== undefined && Array.isArray(options.conditionals) && m[9]) {
                    var conditionals = m[9];
                    var single_cond_regex = new RegExp('^(\\|\\||&&)?(!)?\\$([A-Z0-9]+)');
                    var ok = false;
                    while (conditionals) {
                        var d = single_cond_regex.exec(conditionals);
                        if (d === null || !d[3])
                            throw new SyntaxError("VDF.parse: encountered an incorrect conditional: " + conditionals);
                        conditionals = conditionals.replace(d[0], '').trim(); // erase parsed fragment from the list
                        var op = d[1];
                        var not = d[2] && d[2] === '!';
                        var cond = d[3];
                        var includes = options.conditionals.indexOf(cond) !== -1;
                        var _ok = not ? !includes : includes;
                        if (!op || op === '||')
                            ok = ok || _ok;
                        else // &&
                            ok = ok && _ok;
                    }
                    //console.log('cond', key, val, _ok);
                    if (!ok) {
                        // conditions are not met
                        // continue processing the line (code duplicated from the bottom of our while loop)
                        line = line.replace(m[0], "");
                        if (!line || line[0] == '/') break; // break if there is nothing else (of interest) left in this line
                        continue;
                    }
                }
                let TYPEEX = {
                    INT: /^\-?\d+$/,
                    FLOAT: /^\-?\d+\.\d+$/,
                    BOOLEAN: /^(true|false)$/i,
                }
                if (options.types) {
                    if (TYPEEX.INT.test(val)) {
                        val = parseInt(val);
                    } else if (TYPEEX.FLOAT.test(val)) {
                        val = parseFloat(val);
                    } else if (TYPEEX.BOOLEAN.test(val)) {
                        val = val.toLowerCase() == "true";
                    }
                }

                // does not exist at all yet
                if (stack[stack.length - 1][key] === undefined) {
                    stack[stack.length - 1][key] = val;
                }

                // exists already, but is not an array
                else if (stack[stack.length - 1][key] !== undefined && !Array.isArray(stack[stack.length - 1][key])) {
                    if (options.arrayify) {
                        // we turn it into an array and push the next object there
                        stack[stack.length - 1][key] = [stack[stack.length - 1][key], val]; // turn current object into array with the old object and the new object
                    } else {
                        // replace it with the new value
                        stack[stack.length - 1][key] = val;
                    }
                }

                // exists already, is an array
                else if (stack[stack.length - 1][key] !== undefined && Array.isArray(stack[stack.length - 1][key])) {
                    if (!options.arrayify)
                        throw new Error("VDF.parse: this code block should never be reached with arrayify set to false! [2]");
                    stack[stack.length - 1][key].push(val);
                }

            }

            if (expect_bracket) break; // there was just key, no value, the next line should contain bracket (to go one level deeper)
            line = line.replace(m[0], "").trim();
            if (!line || line[0] == '/') break; // break if there is nothing else (of interest) left in this line
            line = line.replace(/^\s*\[\!?\$[A-Z0-9]+(?:(?:[\|]{2}|[\&]{2})\!?\$[A-Z0-9]+)*\]/, "").trim(); // ignore conditionals
            if (!line || line[0] == '/') break; // again; if there's nothing left after skipping the conditional
        }

    }

    if (stack.length != 1) throw new SyntaxError("VDF.parse: open parentheses somewhere");

    return obj;
}
function checkIfValidMD5Hash(str) {
    // Regular expression to check if string is a MD5 hash
    let regexExp = /^[a-f0-9]{32}$/gi;
    return regexExp.test(str);
}
async function IsFolderOK(folder) {
    //get_file_status
    try {
        await invoke('get_file_status', { path: folder + "/UNDERTALE.exe" });
        await invoke('get_file_status', { path: folder + "/data.win" });
    } catch (error) {
        console.error(error);
        return false;
    }
    return true;
}
async function VerifyHash(folder) {
    //get md5 hash - check_md5_hash_of_file
    let out = false;
    await invoke('check_md5_hash_of_file', { path: folder + "/data.win" })
        .then(async (md5hash) => {
            if (!checkIfValidMD5Hash(md5hash)) {
                out = [false, "Nepodařilo se získat hash souboru. Zkuste zvolit jinou složku, popř. nás kontaktute na Discordu."];
                return;
            }
            //old mod
            let installed = await IsInstalled(folder);
            if (installed) {
                out = [true, "Nalezena instalovaná čeština, pro přeinstalaci češtiny stiskněte tlačítko Nainstalovat!", "steam"];
            }
            out = GetPlatform(md5hash);
            if (out[2] == false) {
                //verify data_old.win
                await invoke('check_md5_hash_of_file', { path: folder + "/data_old.win" })
                    .then(async (md5hash) => {
                        if (!checkIfValidMD5Hash(md5hash)) {
                            out = [false, "Nepodařilo se získat hash souboru. Zkuste zvolit jinou složku, popř. nás kontaktute na Discordu."];
                            return;
                        }
                        out = GetPlatform(md5hash);
                        out[1] += " (čeština instalována, byla nalezena záloha originálního souboru data.win)";
                        out[3] = 'old';
                    }).catch((error) => {
                        console.error(error)
                        console.log("not found");
                    })
            }

        })
        .catch((error) => {
            console.error(error)
            console.log("no md5");
            out = [false, "Nepodařilo se získat hash souboru. Zkuste zvolit jinou složku, popř. nás kontaktute na Discordu."];
        })
    return out;
}

async function GetSteamFolder() {
    //try to get parh from steam
    let error = false;
    let finalPath = "";
    await invoke('steam_is_installed')
        .then(async (path) => {
            if (!path) {
                error = true;
                return;
            }
            await invoke('get_file_content', {
                path: `${path}/steamapps/libraryfolders.vdf`
            }).then(async (data) => {
                let json = VDFparse(data);
                console.log(JSON.stringify(json));
                //undertale id 391540
                let i;
                Object.assign([], json.libraryfolders)
                    .filter(({ apps }) => Object.hasOwn(apps, "391540"))
                    .map(({ path }) => {
                        i = `${path}\\\\steamapps\\\\common\\\\Undertale`;
                    })
                if (i) {
                    finalPath = i.replaceAll("\\\\", "\\")
                } else {
                    error = true;
                }
            }).catch((error) => {
                console.error(error)
                console.log("No steam installed");
                error = true;
            });
        })
        .catch((error) => {
            console.error(error)
            console.log("No steam installed");
            error = true;
        })
    if (error) return false;
    return finalPath;
}

async function checkFolder(entry) {
    if (!entry) {
        document.querySelector(".status").innerHTML = "Tato složka neobsahuje soubory s hrou!";
        return;
    }
    document.querySelector(".input input").value = entry;
    //reset
    document.querySelector(".status").innerHTML = "Ověřování složky...";
    let f = await IsFolderOK(entry);
    if (!f) {
        document.querySelector(".status").innerHTML = "Tato složka neobsahuje soubory s hrou!";
        return;
    }

    let hash = await VerifyHash(entry);
    console.log("check hash:", hash);
    document.querySelector(".status").innerHTML = hash[1];
}

async function IsInstalled(folder) {
    console.log("checking if installed", folder);
    //md5 hash
    let out = false;
    await invoke('check_md5_hash_of_file', { path: folder + "\\data_old.win" })
        .then(async (md5hash) => {
            if (!checkIfValidMD5Hash(md5hash)) {
                console.log("Invalid hash of", folder + "\\data_old.win");
                out = false;
                return;
            }
            let steamElement = document.querySelector(".md5-steam");
            let steam = steamElement ? steamElement.innerHTML : STEAM_MD5;
            if (md5hash == steam) {
                console.log("Steam original", folder + "\\data_old.win");
                out = true;
            }
        })
        .catch(() => {
            console.log("Is not yet installed, or backup data.win not found", folder + "\\data_old.win");
            out = false;
        })
    return out;
}

async function CheckIfDeltaPatchIsInTheFolder() {
    //check if xdelta3.exe exists using tauri
    let path = await invoke('get_current_path');
    try {
        await invoke('get_file_status', { path: path + "\\xdelta3.exe" });
    } catch (error) {
        console.error(error, 'was checking file: ' + path + "\\xdelta3.exe");
        return false;
    }
    return true;
}
function GetPlatform(md5hash) {
    let steamElement = document.querySelector(".md5-steam");
    let steam = steamElement ? steamElement.innerHTML : STEAM_MD5;
    let gogElement = document.querySelector(".md5-gog");
    let gog = gogElement ? gogElement.innerHTML : GOG_MD5;
    switch (md5hash) {
        case gog:
            return [true, "Nalezena GOG verze, pro instalaci češtiny stiskněte tlačítko Nainstalovat!", "gog"];
        case steam:
            return [true, "Nalezena Steam verze, pro instalaci češtiny stiskněte tlačítko Nainstalovat!", "steam"];
        default:
            return [false, "Hash souboru neodpovídá originální verzi! (Máte hru upravenou?)", false];
    }
}
async function renameFile(from, to, path) {
    //if path is missing \\ at the end, add it
    if (path[path.length - 1] != "\\") path += "\\";
    console.log("trying to rename", path + from, path + to)
    return await invoke('rename_file', {
        oldPath: path + from,
        newPath: path + to
    });
}
async function removeFile(file, path) {
    //if path is missing \\ at the end, add it
    if (path[path.length - 1] != "\\") path += "\\";
    console.log("trying to remove", path + file)
    return await invoke('remove_file', {
        path: path + file
    });
}
document.addEventListener("DOMContentLoaded", async () => {

    document.addEventListener("click", async (e) => {
        let targetED = e.target.closest(".exit-done");
        let targetRUN = e.target.closest(".run-undertale");
        if (targetRUN) {
            setTimeout(async () => {
                //exit tauri app
                await exit(1);
            }, 5000);
            let i = await openPath(undertaleEXE);
            console.log(i);
            //
        } else if (targetED) {
            await exit(1);
        }
    });
    document.querySelector(".discord").addEventListener("click", async (e) => {
        e.preventDefault();
        await openPath(DISCORD_LINK);
    })
    document.addEventListener('contextmenu', e => e.preventDefault());
    setTimeout(() => {
        document.querySelector(".loader").classList.add("remove");
    }, 1000);
    document.querySelector(".start-installer").addEventListener("click", async () => {
        //check if xdelta3.exe exists
        let delta = await CheckIfDeltaPatchIsInTheFolder();
        if (!delta) {
            //show alert message using tauri
            await message('Nepodařilo se nalézt xdelta3.exe. Instalátor nebude fungovat.',
                {
                    title: 'Chyba!',
                    type: 'error'
                });
            return;
        }
        //2nd page
        document.querySelector("#tab0").classList.remove("active");
        document.querySelector("#tab1").classList.add("active");
        Speak(document.querySelector("#tab1 .letter-box p"));
    });

    document.querySelector(".exit").addEventListener("click", async () => {
        let yes = await ask('Opravdu chcete instalátor ukončit?', {
            title: 'Ukončit instalátor?', type: 'question', okLabel: 'Ano', cancelLabel: 'Ne'
        });
        console.log("end?", yes);
        if (yes == true) await exit(0);
    })
    //go to tab 2
    document.querySelector(".next").addEventListener("click", async () => {
        let Steam = await GetSteamFolder();
        document.getElementById("tab1").style.display = "none";
        document.getElementById("tab2").style.display = "block";
        Speak(document.querySelector("#tab2 .letter-box p"));
        console.log("Response", Steam);
        if (Steam) {
            document.querySelector(".input input").value = Steam;
            document.querySelector('.input input').dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            await checkFolder();
        }
        let ver = document.querySelector(".newest-version");
        let fetchTimeout = 5 * 1000; //5s

        let timeoutPromise = new Promise((r, reject) => {
            setTimeout(() => reject(new Error(`Request timed out, time >${fetchTimeout}ms`)), fetchTimeout);
        });
        let timestamp = new Date().getTime();
        let fetchPromise = fetch(`https://undertale.cz/api/get/installer?cache=${timestamp}`, {
            cache: 'no-cache',
        })
            .then(response => response.json())
            .then(data => {
                ver.innerHTML = JSON.stringify(data);
                if (!data.avalable) {
                    ver.innerHTML = "Nepodařilo se získat informace o nejnovější verzi, instaluji verzi přibalenou s instalátorem.";
                    return;
                }
                ver.innerHTML = `<p>Aktuální verze překladu: ${data.version}</p>
        <div class="file-data" style="display: none">
            <p class="md5-steam">${data.md5.original_steam}</p>
            <p class="md5-gog">${data.md5.original_gog}</p>
            <p class="steam-cz">${data.steam}</p>
            <p class="gog-cz">${data.gog}</p>
        </div>`;
            }).catch(() => {
                ver.innerHTML = "Nepodařilo se získat informace o nejnovější verzi, instaluji verzi přibalenou s instalátorem.";
            });

        Promise.race([fetchPromise, timeoutPromise])
            .catch(error => {
                ver.innerHTML = "Nepodařilo se získat informace o nejnovější verzi, instaluji verzi přibalenou s instalátorem.";
                console.error(error)
            });
    });
    //tab 2
    document.querySelector(".prev").addEventListener("click", async () => {
        document.getElementById("tab2").style.display = "none";
        document.getElementById("tab1").style.display = "block";
    })
    document.querySelector(".pick-path").addEventListener("click", async () => {
        let val = document.querySelector(".input input").value;
        let selected = await openPicker({
            directory: true,
            multiple: false,
            defaultPath: val
        });
        console.log(selected)
        if (selected) checkFolder(selected);
    })
    document.querySelector(".input input").addEventListener("input", async () => {
        let entry = document.querySelector(".input input").value;
        checkFolder(entry);
    });

    let undertaleEXE;
    document.querySelector(".install").addEventListener("click", async () => {
        //check the path again
        let folder = document.querySelector(".input input").value;
        let f = await IsFolderOK(folder);
        if (!f) {
            await message('Tato složka neobsahuje soubory s hrou!', {
                title: 'Chyba!', type: 'warning', okLabel: 'OK'
            });
            return;
        }
        //hash verify
        let hash = await VerifyHash(folder);
        console.log("hash", hash);
        let platform = hash[2];
        if (!platform) {
            await message('Nemáte originální Steam ani GOG verzi, přeinstalujte hru.', {
                title: 'Neplatný hash!', type: 'warning', okLabel: 'OK'
            });
            return;
        }
        document.getElementById("tab2").style.display = "none";
        document.getElementById("tab3").style.display = "block";
        //local or online
        let ver = document.querySelector(".newest-version");
        let steam = ver.querySelector(".file-data .steam-cz");
        let gog = ver.querySelector(".file-data .gog-cz");
        let deltaFile, url;
        if (platform == "steam") {
            deltaFile = "steam.patch"
            if (steam) url = steam.innerHTML;
        } else {
            deltaFile = "gog.patch"
            if (gog) url = gog.innerHTML;
        };
        let ins = document.querySelector(".install-progress");
        if (url) {
            //download the file from the server and save it
            ins.innerHTML += `<p>Stahování patch souboru pro ${platform[0].toUpperCase() + platform.slice(1)}.</p>`;
            let timestamp = new Date().getTime();
            if (platform == "steam") {
                deltaFile = `steam_${timestamp}.patch`
            } else {
                deltaFile = `gog_${timestamp}.patch`
            }
            let response;
            try {
                response = await fetch(url + `?cache=${timestamp}`);
            } catch (err) {
                ins.innerHTML += `<p>Chyba při stahování češtiny, zkuste to později.</p>`;
                return;
            }
            console.log(response);
            if (!response.ok) {
                ins.innerHTML += `<p>Chyba při stahování češtiny (chyba: ${response.status}), zkuste to později.</p>`;
                return;
            }
            let totalLength = response.headers.get('Content-Length');
            let reader = response.body.getReader();
            let data = new Uint8Array(totalLength);
            let receivedLength = 0;
            ins.innerHTML += `<p class="dwnld"></p>`;
            while (true) {
                let { done, value } = await reader.read();

                if (done) break;

                data.set(value, receivedLength);
                receivedLength += value.length;

                let progress = Math.round(receivedLength / totalLength * 100);
                if (progress < 99) {
                    document.querySelector(".install-progress .dwnld").innerHTML = `Staženo ${progress}%`;
                } else {
                    document.querySelector(".install-progress .dwnld").innerHTML = `Staženo. Ukládání souboru.`;
                }
            }
            await writeBinaryFile(deltaFile, data, { dir: BaseDirectory.Temp })
                .catch((err) => {
                    console.error(err);
                    ins.innerHTML += `<p>Chyba při ukládání souboru ${deltaFile}.</p>`;
                    return;
                });
            console.log("tu", deltaFile);
            ins.innerHTML += `<p>Patch soubor stažen a uložen jako ${deltaFile}.</p>`;
        }
        let oldFile = `${folder}\\data.win`;
        //if already installed
        let installed = await IsInstalled(folder);
        if (installed) oldFile = `${folder}\\data_old.win`;
        console.log("is installed", installed)
        console
        let finalFile = `${folder}\\data_patched.win`;
        let tempPath = await tempdir();
        //apply patch
        let args = [
            "-d",
            "-s",
            oldFile, `${tempPath}${deltaFile}`, finalFile
        ];
        let cmd = await new RunCmd('xdelta3', args).execute();
        console.log("running xdelta3 width args", args, ", response: ", cmd);
        if (cmd.code == 1) {
            switch (cmd.stderr) {
                case "xdelta3: target window checksum mismatch: XD3_INVALID_INPUT\r\n":
                    console.log("MD5 hash nesedí!");
                    ins.innerHTML += '<p>Chyba při instalaci.</p>';
                    await message('Nepodařilo se ověřit hash souboru s daty. Přeinstalujte hru.',
                        {
                            title: 'Chyba při instalaci',
                            type: 'error'
                        });
                    break;
                default:
                    console.log("Chyba při aplikaci patche", cmd.stderr);
                    ins.innerHTML += `<p>Chyba při aplikaci patche: ${cmd.stderr}</p>`;
                    ins.innerHTML += `<p>Pokud problém bude přetrvávat, kontaktujte nás na Discordu.</p>`;
                    await message('Neočekávaná chyba při aplikaci patche.', {
                        title: 'Chyba při instalaci',
                        type: 'error'
                    });
                    break;
            }
            return;
        }
        document.querySelector(".install-progress").innerHTML += '<p>Došlo k aplikování češtiny.</p>';
        if (!installed) {
            //rename files - data.win to data_old.win
            let r = await renameFile("data.win", "data_old.win", folder);
            console.log("First install, renamed", r);
            if (r == 'ok') {
                document.querySelector(".install-progress").innerHTML += '<p>Soubor data.win přejmenován na data_original.win.</p>';
            } else {
                document.querySelector(".install-progress").innerHTML += '<p>Chyba při přejmenovávání data.win.</p>';
                document.querySelector("#tab3").innerHTML += "<h2>Instalace se nepodařila.</h2>";
                return;
            }
        } else {
            //del data.win
            let remove = await removeFile("data.win", folder);
            console.log("Already installed, removed", remove);
            if (remove == 'ok') {
                document.querySelector(".install-progress").innerHTML += '<p>Soubor data.win smazán.</p>';
            } else {
                document.querySelector(".install-progress").innerHTML += '<p>Chyba mazání data.win.</p>';
                document.querySelector("#tab3").innerHTML += "<h2>Instalace se nepodařila.</h2>";
                return;
            }
        }
        //move data_patched.win to data.win
        let r = await renameFile(`data_patched.win`, `data.win`, folder);
        console.log("data_patched.win to data.win", r);
        if (r == 'ok') {
            document.querySelector(".install-progress").innerHTML += '<p>Soubor data_patched.win přejmenován.</p>';
        } else {
            document.querySelector(".install-progress").innerHTML += '<p>Chyba při přejmenovávání data_patched.win.</p>';
            document.querySelector("#tab3").innerHTML += "<h2>Instalace se nepodařila.</h2>";
            return;
        }
        //if was online install, delete the patch
        let error = false;
        if (url) {
            console.log("remove temp patch");
            await rmTemp(deltaFile, { dir: BaseDirectory.Temp })
                .then(() => {
                    document.querySelector(".install-progress").innerHTML += `<p>Patch soubor ${deltaFile} smazán.</p>`;
                }).catch((err) => {
                    console.log(err);
                    error = true;
                    document.querySelector(".install-progress").innerHTML += `<p>Chyba mazání ${deltaFile}.</p>`;
                    document.querySelector("#tab3").innerHTML += "<h2>Instalace se nepodařila.</h2>";
                });
        }
        if (error) return;
        document.querySelector("#tab3").innerHTML += "<h2>Instalace dokončena.</h2>";

        document.querySelector("#tab3").innerHTML += `<div class="install-btns float-right">
        <div>
            <button class="run-undertale">Spustit Undertale</button>
            <button class="exit-done">Ukončit</button>
        </div>
      </div>`;
        undertaleEXE = `${folder}/UNDERTALE.exe`;
    })
})