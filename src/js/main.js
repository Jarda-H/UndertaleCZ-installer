let t = window.__TAURI__
const { appWindow } = t.window;
const { invoke } = t.tauri;
const { ask, dialog, message, open: openPicker } = t.dialog;
const { exit } = t.process;
const {
    writeBinaryFile,
    BaseDirectory,
    removeFile: rmTemp,
} = t.fs;
const { locale, tempdir } = t.os;
const { open: openPath } = t.shell;
const { getVersion } = t.app;
const { resolveResource } = t.path;
const DISCORD_LINK = "https://discord.gg/beGejNfDmv";
const STEAM_MD5 = "5903fc5cb042a728d4ad8ee9e949c6eb";
const GOG_MD5 = "dd8ebb409962e678258106468ced621e";
const UNDERTALE_STEAM_ID = 391540;
const strings = {
    hashFail: "Nepodařilo se získat hash souboru. Zkuste zvolit jinou složku, popř. nás kontaktute na Discordu.",
    czFound: "Nalezena nainstalovaná čeština, pro přeinstalaci češtiny stiskněte tlačítko Nainstalovat!",
    backupFound: " (čeština instalována, byla nalezena záloha originálního souboru data.win)",
    verifyFolder: "Ověřování složky...",
    wrongFolder: "Tato složka neobsahuje soubory s hrou!",
    gogFound: "Nalezena GOG verze, pro instalaci češtiny stiskněte tlačítko Nainstalovat!",
    steamFound: "Nalezena Steam verze, pro instalaci češtiny stiskněte tlačítko Nainstalovat!",
    gameEdited: "Hash souboru neodpovídá originální verzi! (Máte hru upravenou?)",
    reinstallGame: "Nemáte originální Steam ani GOG verzi, přeinstalujte hru.",
    alert: {
        error: 'Chyba!',
        quitTitle: "Ukončit instalátor?",
        quit: "Opravdu chcete ukončit instalátor?",
        wrongHashTitle: "Chyba při instalaci. Neplatný hash!",
        okLabel: 'Ano',
        cancelLabel: 'Ne',
        ok: 'Ok',
        installErrorTitle: "Chyba při instalaci",
        selectFolder: "Vyberte složku s hrou",
    },
    fetchFailed: "Nepodařilo se získat informace o nejnovější verzi, instaluji verzi přibalenou s instalátorem.",
    newestVersion: "Aktuální verze překladu: ",
    install: {
        platform: "Stahování patch souboru pro",
        steam: "Instalace češtiny pro Steam verzi",
        gog: "Instalace češtiny pro GOG verzi",
        patchApplied: "Patch aplikován.",
        done: "Instalace češtiny dokončena.",
        error: "Chyba při instalaci.",
        downloadError: "Chyba při stahování češtiny, zkuste to později.",
        downloaded: "Staženo",
        saving: "Ukládání souboru",
        savingError: "Chyba při ukládání souboru",
        patchSavedAs: "Patch soubor stažen a uložen jako",
        xdeltaError: "Chyba při aplikaci patche",
        discord: "Pokud problém bude přetrvávat, kontaktujte nás na Discordu.",
        run: "Spustit Undertale",
        exit: "Ukončit",
    },
    dontWannaToShare: "Nesdílet data o instalaci",
    shareData: "Sdílet data o instalaci",
    showData: "Zobrazit sdílená data",
    showDataTitle: "Sdílená data",
    disclaimer: "Sdílení dat je dobrovolné a pomáhá nám instalátor zlepšovat. Data jsou anonymní a neobsahují žádné osobní údaje.",
    sharingData: "Nahrávání dat...",
    sharingDataOk: "Data úspěšně nahrána, děkujeme.",
    sharingDataErr: "Nepodařilo se nahrát data, zkuste to později.",
    exiting: "Ukončuji...",
    runningUt: "Spouštím Undertale...",
}
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
        return false;
    }
    return true;
}
async function GetFileHash(file) {
    //get md5 hash - check_md5_hash_of_file
    return await invoke('check_md5_hash_of_file', { path: file });
}
async function VerifyHash(folder) {
    //get md5 hash - check_md5_hash_of_file
    let out = false;
    await invoke('check_md5_hash_of_file', { path: folder + "/data.win" })
        .then(async (md5hash) => {
            if (!checkIfValidMD5Hash(md5hash)) {
                out = [false, strings.hashFail];
                return;
            }
            //old mod
            let installed = await IsInstalled(folder);
            if (installed) {
                out = [true, strings.czFound, "steam"];
            }
            out = GetPlatform(md5hash);
            if (out[2] == false) {
                //verify data_old.win
                await invoke('check_md5_hash_of_file', { path: folder + "/data_old.win" })
                    .then(async (md5hash) => {
                        if (!checkIfValidMD5Hash(md5hash)) {
                            out = [false, strings.hashFail];
                            return;
                        }
                        out = GetPlatform(md5hash);
                        out[1] += strings.backupFound;
                        out[3] = 'old';
                    }).catch((error) => {
                        writeToLog(error, "check_md5_hash_of_file");
                    })
            }

        })
        .catch((error) => {
            writeToLog(error, "data.win hash not found");
            out = [false, strings.hashFail];
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
                writeToLog('NoPath', "noSteam");
                return;
            }
            await invoke('get_file_content', {
                path: `${path}/steamapps/libraryfolders.vdf`
            }).then(async (data) => {
                let json = VDFparse(data);
                let i;
                Object.assign([], json.libraryfolders)
                    .filter(({ apps }) => Object.hasOwn(apps, UNDERTALE_STEAM_ID))
                    .map(({ path }) => {
                        i = `${path}\\\\steamapps\\\\common\\\\Undertale`;
                    })
                if (i) {
                    finalPath = i.replaceAll("\\\\", "\\")
                } else {
                    error = true;
                }
            }).catch((error) => {
                writeToLog(error, "noSteam");
                error = true;
            });
        })
        .catch((error) => {
            writeToLog(error, "noSteam");
            error = true;
        })
    if (error) return false;
    return finalPath;
}

async function checkFolder(entry) {
    if (!entry) {
        document.querySelector(".status").innerHTML = strings.wrongFolder;
        return;
    }
    document.querySelector(".input input").value = entry;
    //reset
    document.querySelector(".status").innerHTML = strings.verifyFolder;
    let f = await IsFolderOK(entry);
    if (!f) {
        document.querySelector(".status").innerHTML = strings.wrongFolder;
        return;
    }

    let hash = await VerifyHash(entry);
    if (hash[2]) {
        writeToLog("Found" + hash[2] + "version", "GameFound");
    }
    document.querySelector(".status").innerHTML = hash[1];
}

async function IsInstalled(folder) {
    //md5 hash
    let out = false;
    await invoke('check_md5_hash_of_file', { path: folder + "\\data_old.win" })
        .then(async (md5hash) => {
            if (!checkIfValidMD5Hash(md5hash)) {
                out = false;
                return;
            }
            let steamElement = document.querySelector(".md5-steam");
            let steam = steamElement ? steamElement.innerHTML : STEAM_MD5;
            if (md5hash == steam) {
                writeToLog("originalBackupFonud", "SteamInstall");
                out = true;
            }
        })
        .catch(() => {
            writeToLog("CZNotInstalledOrBackupNotFound", "SteamInstall");
            out = false;
        })
    return out;
}

function GetPlatform(md5hash) {
    let steamElement = document.querySelector(".md5-steam");
    let steam = steamElement ? steamElement.innerHTML : STEAM_MD5;
    let gogElement = document.querySelector(".md5-gog");
    let gog = gogElement ? gogElement.innerHTML : GOG_MD5;
    switch (md5hash) {
        case gog:
            return [true, strings.gogFound, "gog"];
        case steam:
            return [true, strings.steamFound, "steam"];
        default:
            return [false, strings.gameEdited, false];
    }
}
let rename = 0;
async function renameFile(from, to, path) {
    //if path is missing \\ at the end, add it
    if (path[path.length - 1] != "\\") path += "\\";
    writeToLog(`${from} to ${to}`, `rename${rename++}`);
    return await invoke('rename_file', {
        oldPath: path + from,
        newPath: path + to
    });
}
let remove = 0;
async function removeFile(file, path) {
    //if path is missing \\ at the end, add it
    if (path[path.length - 1] != "\\") path += "\\";
    writeToLog(`remove ${file}`, `remove${remove++}`);
    return await invoke('remove_file', {
        path: path + file
    });
}
let consoleLog = {};
function writeToLog(text, action) {
    consoleLog[action] = text;
    console.log(JSON.stringify(consoleLog));
}
async function sendLogToServer(data) {
    document.querySelector(".choice").innerHTML = `<p>${strings.sharingData}</p>`;
    //create a hash
    let hash;
    await invoke('create_sha256_hash_from_timestamp_with_salt', { 'timestamp': data["TimeStart"].toString() }).then((h) => {
        hash = h;
    })
    //return a promise, fetch the server
    return await fetch("https://undertale.cz/api/log", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            data,
            auth: hash
        })
    }).then((response) => {
        return response.json();
    }).then((data) => {
        if (data.ok) {
            document.querySelector(".choice").innerHTML = `<p>${strings.sharingDataOk}</p>`;
            return;
        }
        throw new Error("Server error");
    }).catch((error) => {
        //change pap to sad
        document.querySelector(".pap img").src = "./assets/img/Papyrus_upload_failed.png";
        document.querySelector(".choice").innerHTML = `<p>${strings.sharingDataErr}</p>`;
        return error;
    });
}
function endInstallerWithError() {
    writeToLog(false, "InstallDone");
    //option to share data + exit
    document.querySelector("#tab3").innerHTML += `
    <div class="share-data">
        <div class="pap">
            <img src="./assets/img/Papyrus_share.png" alt="Papyrus">
        </div>
        <div class="choice">
            <input type="checkbox" name="data" checked/>
            <label for="data" class="share">${strings.shareData}</label>
            <p class="disclaimer">${strings.disclaimer} <button class="view-data">${strings.showData}</button></p>
        </div>
    </div>
    <div class="install-btns float-right">
    <div>
        <button class="exit-done">${strings.install.exit}</button>
    </div>
  </div>`;
}
async function setTimeoutPromise(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
document.addEventListener("DOMContentLoaded", async () => {
    //custom titlebar
    document
        .querySelector('.btn-minimize')
        .addEventListener('click', () => appWindow.minimize())
    document
        .querySelector('.btn-close')
        .addEventListener('click', () => appWindow.close())
    //data to log
    let time = new Date().getTime();
    writeToLog(time, "TimeStart");
    let version = await getVersion();
    writeToLog(version, "App version");
    let lang = await locale();
    writeToLog(lang, "Lang");

    document.addEventListener("click", async (e) => {
        let share = document.querySelector(".share-data input");
        if (share) share = share.checked;
        switch (e.target) {
            //last tab - run undertale
            case document.querySelector(".run-undertale"):
                //if share data is checked, send it to the server
                if (share) {
                    let time = new Date().getTime();
                    writeToLog(time, "TimeEnd");
                    await sendLogToServer(consoleLog);
                }
                await openPath(undertaleEXE);
                await setTimeoutPromise(5000);
                await exit(0);
                break;
            //last tab - exit
            case document.querySelector(".exit-done"):
                //if share data is checked, send it to the server
                if (share) {
                    let time = new Date().getTime();
                    writeToLog(time, "TimeEnd");
                    await sendLogToServer(consoleLog);
                    await setTimeoutPromise(5000);
                }
                await exit(0);
                break;
            case document.querySelector(".view-data"):
                let j = "";
                //convert the array to text
                for (let i in consoleLog) {
                    if (i == "ShareData") continue;
                    j += `${i}: ${consoleLog[i]}`;
                    if (i != consoleLog.length - 1) j += "\n";
                }
                await message(j,
                    {
                        title: strings.showDataTitle,
                        type: 'info',
                        okLabel: strings.alert.ok
                    });
                break;

        }
    });
    //on change
    document.addEventListener("change", (e) => {
        switch (e.target) {
            //share data last tab
            case document.querySelector(".share-data input"):
                let div = e.target.closest(".share-data");
                let para = div.querySelector("label");
                let pap = div.querySelector(".pap img");
                para.classList.remove("share", "dont-share");
                if (e.target.checked) {
                    para.textContent = strings.shareData;
                    para.classList.add("share");
                    //pap blush
                    pap.src = "./assets/img/Papyrus_share.png";
                } else {
                    para.textContent = strings.dontWannaToShare;
                    para.classList.add("dont-share");
                    //pap mad
                    pap.src = "./assets/img/Papyrus_dontshare.png";
                }
                writeToLog(e.target.checked, "ShareData");
                break;
            default:
                console.log("Changed", e.target);
                break;
        }
    })
    document.querySelector(".discord").addEventListener("click", async (e) => {
        e.preventDefault();
        await openPath(DISCORD_LINK).then(() => {
            writeToLog(true, "DiscordClicked");
        }).catch((err) => {
            writeToLog(err, "DiscordClickedError");
        });
    })
    document.addEventListener('contextmenu', e => e.preventDefault());
    setTimeout(() => {
        document.querySelector(".loader").classList.add("remove");
    }, 1000);
    document.querySelector(".start-installer").addEventListener("click", async () => {
        //2nd page
        document.querySelector("#tab0").classList.remove("active");
        document.querySelector("#tab1").classList.add("active");
        Speak(document.querySelector("#tab1 .letter-box p"));
    });

    document.querySelector(".exit").addEventListener("click", async () => {
        let yes = await ask(strings.alert.quit, {
            title: strings.alert.quitTitle, type: 'question', okLabel: strings.alert.okLabel, cancelLabel: strings.alert.cancelLabel
        });
        if (yes) await exit(0);
    })
    //go to tab 2
    document.querySelector(".next").addEventListener("click", async () => {
        let Steam = await GetSteamFolder();
        document.getElementById("tab1").style.display = "none";
        document.getElementById("tab2").style.display = "block";
        Speak(document.querySelector("#tab2 .letter-box p"));

        if (Steam) {
            document.querySelector(".input input").value = Steam;
            document.querySelector('.input input').dispatchEvent(new Event('input', { bubbles: true }));
            writeToLog(true, "SteamFolderWithTheGameFound");
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
                    ver.innerHTML = strings.fetchFailed;
                    return;
                }
                ver.innerHTML = `<p>${strings.newestVersion}${data.version}</p>
        <div class="file-data" style="display: none">
            <p class="md5-steam">${data.md5.original_steam}</p>
            <p class="md5-gog">${data.md5.original_gog}</p>
            <p class="steam-cz">${data.steam}</p>
            <p class="gog-cz">${data.gog}</p>
        </div>`;
            }).catch(() => {
                ver.innerHTML = strings.fetchFailed;
            });

        Promise.race([fetchPromise, timeoutPromise])
            .catch(error => {
                ver.innerHTML = strings.fetchFailed;
                writeToLog(error, "fetchTimedOut");
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
            defaultPath: val,
            title: strings.alert.selectFolder
        });
        if (selected) checkFolder(selected);
    })
    document.querySelector(".input input").addEventListener("input", async () => {
        let entry = document.querySelector(".input input").value;
        checkFolder(entry);
    });

    let undertaleEXE;
    let activeInstall = false;
    document.querySelector(".install").addEventListener("click", async () => {
        if (activeInstall) return;
        activeInstall = true;
        //check the path again
        let folder = document.querySelector(".input input").value;
        let f = await IsFolderOK(folder);
        if (!f) {
            await message(strings.wrongFolder, {
                title: strings.alert.error, type: 'warning', okLabel: strings.alert.okLabel
            });
            return;
        }
        //hash verify
        let hash = await VerifyHash(folder);
        let platform = hash[2];
        if (!platform) {
            await message(strings.reinstallGame, {
                title: strings.alert.wrongHashTitle, type: 'warning', okLabel: strings.alert.okLabel
            });
            return;
        }
        document.getElementById("tab2").style.display = "none";
        document.getElementById("tab3").style.display = "block";
        //local or online
        let ver = document.querySelector(".newest-version");
        let steam = ver.querySelector(".file-data .steam-cz");
        let gog = ver.querySelector(".file-data .gog-cz");
        let deltaFile;
        let url = false;
        if (
            (steam && gog)
        ) {
            //online install
            if (platform == "steam") {
                url = steam.innerHTML;
            } else {
                url = gog.innerHTML;
            }
        } else {
            //offline install
            console.log('offline')
            if (platform == "steam") {
                await resolveResource("offline/steam.patch").then((filePath) => {
                    // remove \\?\
                    deltaFile = filePath.replace("\\\\?\\", "");
                }).catch((e) => {
                    writeToLog("Steam: " + e, "OfflineFetchError");
                });
            } else {
                await resolveResource("offline/gog.patch").then((filePath) => {
                    // remove \\?\
                    deltaFile = filePath.replace("\\\\?\\", "");
                }).catch((e) => {
                    writeToLog("GOG: " + e, "OfflineFetchError");
                });
            }
        }
        let ins = document.querySelector(".install-progress");
        if (url) {
            console.log('web')
            //download the file from the server and save it
            ins.innerHTML += `<p>${strings.install.platform} ${platform[0].toUpperCase() + platform.slice(1)}.</p>`;
            let timestamp = new Date().getTime();
            deltaFile = (platform == "steam") ?
                `steam_${timestamp}.patch` : deltaFile = `gog_${timestamp}.patch`;
            let response;
            try {
                response = await fetch(url + `?cache=${timestamp}`);
            } catch (err) {
                writeToLog(err, "ServerFetchError");
                ins.innerHTML += `<p>${strings.install.downloadError}</p>`;
                endInstallerWithError();
                return;
            }
            if (!response.ok) {
                writeToLog(response, "ServerFetchError");
                ins.innerHTML += `<p>${strings.install.downloadError}</p>`;
                endInstallerWithError();
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
                    document.querySelector(".install-progress .dwnld").innerHTML = `${strings.install.downloaded} ${progress}%`;
                } else {
                    document.querySelector(".install-progress .dwnld").innerHTML = `${strings.install.downloaded}. ${strings.install.saving}.`;
                }
            }
            await writeBinaryFile(deltaFile, data, { dir: BaseDirectory.Temp })
                .catch((err) => {
                    writeToLog(err, "SavePatchError");
                    ins.innerHTML += `<p>${strings.install.savingError} ${deltaFile}.</p>`;
                    endInstallerWithError();
                    return;
                });
            ins.innerHTML += `<p>${strings.install.patchSavedAs} ${deltaFile}.</p>`;
            //add temp folder to the file
            let tempPath = await tempdir();
            deltaFile = `${tempPath}${deltaFile}`;
        }
        let oldFile = `${folder}\\data.win`;
        //if already installed
        let installed = await IsInstalled(folder).catch((e) => {
            console.log("Cant verify")
        })
        if (installed) oldFile = `${folder}\\data_old.win`;
        let finalFile = `${folder}\\data_patched.win`;
        //apply patch
        let args = [
            "-d",
            "-s",
            oldFile, deltaFile, finalFile
        ];
        await invoke('run_xdelta3', {
            source: oldFile,
            patch: deltaFile,
            output: finalFile,
            offline: !url,
            steam: (platform == "steam")
        }).then((d) => {
            console.log(d);
            writeToLog(true, "xdelta3Ok");
        }).catch(async (e) => {
            switch (e) {
                case "xdelta3: target window checksum mismatch: XD3_INVALID_INPUT\r\n":
                    //get hash
                    await GetFileHash(oldFile).then(async (md5hash) => {
                        writeToLog([cmd.stderr, cmd.stdout, "MD5 hash nesedí!", md5hash], "xdelta3Error");
                    });
                    ins.innerHTML += `<p>${strings.install.error}</p>`;
                    await message(strings.reinstallGame,
                        {
                            title: strings.alert.installErrorTitle,
                            type: 'error'
                        });
                    break;
                default:
                    writeToLog([cmd.stderr, cmd.stdout, "Neznámá chyba!"], "xdelta3Error");
                    ins.innerHTML += `<p>${strings.install.xdeltaError}: ${cmd.stderr}</p>`;
                    ins.innerHTML += `<p>${strings.install.discord}</p>`;
                    await message(strings.install.xdeltaError, {
                        title: strings.alert.installErrorTitle,
                        type: 'error'
                    });
                    break;
            }
            endInstallerWithError();
            return;
        });

        let progress = document.querySelector(".install-progress");
        let tab = document.querySelector("#tab3");
        progress.innerHTML += `<p>${strings.install.patchApplied}</p>`;
        if (!installed) {
            //rename files - data.win to data_old.win
            let r = await renameFile("data.win", "data_old.win", folder);
            writeToLog(true, "FirstInstall");
            if (r == 'ok') {
                progress.innerHTML += '<p>Soubor data.win přejmenován na data_original.win.</p>';
            } else {
                writeToLog(`error_${r}`, `rename${rename}_error`);
                progress.innerHTML += '<p>Chyba při přejmenovávání data.win.</p>';
                tab.innerHTML += `<h2>${strings.install.error}</h2>`;
                endInstallerWithError();
                return;
            }
        } else {
            //del data.win
            let remove = await removeFile("data.win", folder);
            writeToLog(false, "FirstInstall");
            if (remove == 'ok') {
                progress.innerHTML += '<p>Soubor data.win smazán.</p>';
            } else {
                writeToLog(`error_${r}`, `remove${remove}_error`);
                progress.innerHTML += '<p>Chyba mazání data.win.</p>';
                tab.innerHTML += `<h2>${strings.install.error}</h2>`;
                endInstallerWithError();
                return;
            }
        }
        //move data_patched.win to data.win
        let r = await renameFile(`data_patched.win`, `data.win`, folder);
        if (r == 'ok') {
            progress.innerHTML += '<p>Soubor data_patched.win přejmenován.</p>';
        } else {
            writeToLog(`error_${r}`, `rename${rename}_error`);
            progress.innerHTML += '<p>Chyba při přejmenovávání data_patched.win.</p>';
            tab.innerHTML += `<h2>${strings.install.error}</h2>`;
            endInstallerWithError();
            return;
        }
        //if was online install, delete the patch
        let error = false;
        if (url) {
            writeToLog(true, "WasOnlineInstall");
            await rmTemp(deltaFile, { dir: BaseDirectory.Temp })
                .then(async () => {
                    let tempPath = await tempdir();
                    progress.innerHTML += `<p>Patch soubor ${deltaFile.replace(tempPath, "")} smazán.</p>`;
                }).catch((err) => {
                    writeToLog(err, "TempRemoveError");
                    error = true;
                    progress.innerHTML += `<p>Chyba mazání ${deltaFile}.</p>`;
                    tab.innerHTML += `<h2>${strings.install.error}</h2>`;
                });
        } else {
            writeToLog(false, "WasOnlineInstall");
        }
        if (error) {
            endInstallerWithError();
            return;
        }

        writeToLog(true, "InstallDone");
        tab.innerHTML += `<h2>${strings.install.done}</h2>`;
        //option to share data
        tab.innerHTML += `
        <div class="share-data">
            <div class="pap">
                <img src="./assets/img/Papyrus_share.png" alt="Papyrus">
            </div>
          <div class="choice">
                <input type="checkbox" name="data" checked/>
                <label for="data" class="share">${strings.shareData}</label>
                <p class="disclaimer">${strings.disclaimer} <button class="view-data">${strings.showData}</button></p>
            </div>
        </div>
        `;
        tab.innerHTML += `<div class="install-btns float-right">
        <div>
            <button class="run-undertale">${strings.install.run}</button>
            <button class="exit-done">${strings.install.exit}</button>
        </div>
      </div>`;
        undertaleEXE = `${folder}\\UNDERTALE.exe`;
    })
})