

function openMenu(el) {
    return new Promise((resolve)=>{

        //Create the menu open animation
        var exp = document.createElement("div");
        exp.className = "expanding-menu-transition-pane";
        document.getElementById("main-container").appendChild(exp);
        
        //Set the positions of exp
        var ofs = getOffset(el);
        
        //Add element width + height
        var style = window.getComputedStyle(el);
        var h = parseInt(style.height.split("px")) + 20;
        var w = parseInt(style.width.split("px"));
        exp.style.top = ofs.top + (h/2) + "px";
        exp.style.left = ofs.left + (w/2) + "px";
        

        setTimeout(()=>{
            var menu = document.createElement("div");
            menu.className = "menu-pane";
            var wr = document.createElement("div");
            wr.className = "wrapper";
            menu.appendChild(wr);
            menu.kill = ()=>{
                menu.style.animation = "none";
                menu.style.animation = "fade-out 150ms ease-in-out both";
                setTimeout(()=>{
                    menu.parentNode.removeChild(menu);
                }, 150)
            }


            var back = document.createElement("button");
            back.className = "button pill solid back secondary material-icons";
            back.innerHTML = "arrow_back";
            menu.appendChild(back);
            back.onclick = menu.kill;

            document.getElementById("main-container").appendChild(menu);
            exp.parentNode.removeChild(exp);
            resolve(wr);
        }, 250)
    })
}
var menu;

async function stats(el) {
    menu = await openMenu(el)
    menu.closest(".menu-pane").classList.add("statistics");
    var sessions = await fs.readdir(path.join(filesPath, "recordeddata"));

    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Statistics";
    menu.insertBefore(title, menu.querySelector(".content"));

    var info = document.createElement("span");
    info.innerText = "Info";
    info.className = "information-pill";
    var body = document.createElement("p");
    body.className = "body smooth-shadow";
    info.appendChild(body);
    body.innerHTML = `
        This page only shows statistics from your singleplayer worlds. Some worlds may not have statistics,
        and these are not included.
    `;
    title.appendChild(info);

    var selector = document.createElement("div");
    selector.className = "page-selector";
    menu.appendChild(selector);

    var b = document.createElement("button");
    selector.appendChild(b);
    b.innerText = "All time"
    b.className ="active"
    b.setAttribute("onclick", "triggerTransition(this)");

    var b = document.createElement("button");
    selector.appendChild(b);
    b.innerText = "Worlds"
    b.setAttribute("onclick", "triggerTransition(this)");

    var b = document.createElement("button");
    selector.appendChild(b);
    b.innerText = "Sessions"
    b.setAttribute("onclick", "triggerTransition(this)");

    var content = document.createElement("div");
    content.className = "content";
    menu.appendChild(content);

    showStatPage(0);

    //Create more buttons
    var bWr = document.createElement("div");
    bWr.className = "bottom-buttons-wrapper";
    menu.appendChild(bWr);

    var regCalc = document.createElement("button");
    regCalc.innerText = "Estimate all playtime";
    bWr.appendChild(regCalc);
    regCalc.className = "smooth-shadow";

    regCalc.onclick = openAdvancedEstimateMenu;


    var butt = document.createElement("button");
    butt.innerText = "Button";
    bWr.appendChild(butt);
    butt.className = "smooth-shadow";
}

function sleep(ms) {
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve();
        }, ms)
    })
}

async function openAdvancedEstimateMenu() {
    //Close any open menu?
    /*
    var menus = document.getElementsByClassName("menu-pane");
    var x;
    if(menus.length > 0) {
        for(x of menus) {
            setTimeout(()=>{
                x.kill();
            }, 100)
        }
    }*/

    //await sleep(50);

    //Check if user has set up this function yet
    if(!userConfig.startedPlaying) {

        var cleanUp = ()=>{
            setup.querySelector(".container").innerHTML = "";
        }


        var setup = await setupMenu();
        setup.definePages(2);
        setup.setPage(0);

        var t = document.createElement("h1");
        t.innerText = "set up feature";
        t.className = "title";
        setup.appendChild(t);

        var back = setup.closest(".menu-pane").querySelector(".back");
        back.style.color = "#E0F2E9";

        var cont = document.createElement("div");
        cont.className = "container";
        setup.appendChild(cont);

        var i = document.createElement("p");
        i.innerHTML = `
            If you wish to calculate all of your play time, even without having any log data or any worlds
            from the time you started playing Minecraft, this tool will give you an indication. <br><br>

            We will use your recorded log data, world data and the year 
            you originally started playing Minecraft 
            to calculate an estimate of your total playtime. 
        `
        cont.appendChild(i);
        i.className = "information";


        var proceed = document.createElement("button");
        proceed.innerText = "Proceed";
        proceed.className = "smooth-shadow next";
        setup.appendChild(proceed);

        proceed.onclick = ()=> {
            setup.setPage(1);
            cleanUp();
            step2();
        }


        function step2(){
            var i = document.createElement("p");
            i.innerHTML = "What year did you start playing Minecraft?";
            cont.appendChild(i);
            i.className = "information";

            var inp = document.createElement("input");
            inp.type = "number";
            inp.className = "smooth-shadow";
            inp.min = 2009;
            inp.max = new Date().getFullYear();
            cont.appendChild(inp);

            proceed.onclick = ()=>{

                var val = inp.value;
                if(val < 2009 || val > new Date().getFullYear()) {
                    //Invalid year selection
                    notification("Select a year between " + new Date().getFullYear() + " and 2009");
                    return;
                }

                userConfig.startedPlaying = inp.value;
                saveUserConfig();

                var menu = setup.closest(".menu-pane");
                menu.parentNode.removeChild(menu);
            };
            
        }

        await sleep(500);
    }



    var menu = await stdMenu();
    menu.closest(".menu-pane").classList.add("advanced-statistics");

    var t = document.createElement("h1");
    t.innerText = "Advanced";
    menu.appendChild(t);
    t.className = "title";



    var graph = document.createElement("div");
    graph.className = "graph-output";
    menu.appendChild(graph);

    var canv = document.createElement("canvas");
    graph.appendChild(canv);
    var multiplier = 1000;
    canv.width = 4 * multiplier;
    canv.height = 1 * multiplier;

    var ctx = canv.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = "#5B7B7A";
    ctx.lineWidth = 10;



    var info = document.createElement("div");
    info.className = "info-strip";
    menu.appendChild(info);


    /*
    var p = document.createElement("p");
    var year = document.createElement("input");
    year.type = "text";
    year.className = "year-input";
    menu.appendChild(year);
    */
    try {
        var logs = await fs.readdir(path.join(filesPath, "logScans"));
    } catch (error) {
        notification("Could not load log files");
    }

    //Get the oldest log
    var x;
    var years = [];
    for(x of logs) {
        var year = x.split("-")[0];
        years.push(year);
    }

    Array.min = function( array ){
        return Math.min.apply( Math, array );
    };

    var minimum = Array.min(years);

    var logsT = document.createElement("p");
    logsT.innerText = logs.length + " Logs scanned";
    info.appendChild(logsT);

    var first = document.createElement("p");
    first.innerText = "First log from " + minimum;
    info.appendChild(first);

    var first = document.createElement("p");
    first.innerText = "Started playing in " + userConfig.startedPlaying;
    info.appendChild(first);

    var times = []

    var x;
    for(x of logs) {
        try {
            var logFile = JSON.parse(await fs.readFile(path.join(filesPath, "logScans", x)));
        } catch (error) {
            notification("Could not read " + x);
        }

        if(times.filter(e=>e.date == logFile.date).length == 0) {
            console.log(logFile);
            var obj = {
                date: logFile.date,
                time: logFile.time
            }
            times.push(obj);
        } else {
            var index = times.findIndex(item => item.date == logFile.date);
            times[index].time = times[index].time + logFile.time;

        }
    }

    //All files have been scanned, and the data points can be plotted
    plotDataPoints(times);
}

function plotDataPoints(times) {
    var x;
    for(x of times) {
        
    }
}

var disableMenu = false;
function triggerTransition(el) {
    if(disableMenu) return;
    disableMenu = true;
    var slider = document.createElement("div");
    slider.className = "slider";

    var sel = el.closest(".page-selector");
    if(!(sel instanceof HTMLElement)) return;

    
    //Get the distance to travel
    
    //get the initial position
    var selected = sel.querySelector(".active");
    if(selected == el) {disableMenu = false; return;};
    el.closest(".page-selector").appendChild(slider);
    var x1 = selected.offsetLeft;
    slider.style.left = x1 + "px";
    setTimeout(()=>{
        slider.style.transition = "all 200ms ease-in-out";
        selected.classList.remove("active");
        var x = el.offsetLeft;
        slider.style.left = x + "px";
        setTimeout(()=>{
            el.classList.add("active");
            disableMenu = false;
            slider.parentNode.removeChild(slider);
            showStatPage(Array.from(sel.children).indexOf(el));
        }, 170)
    }, 100)
}

var statsPaths = {
    time: [
        ["minecraft:custom","minecraft:total_world_time"],
        ["stat.playOneMinute"],
        ["minecraft:custom","minecraft:play_one_minute"]
    ],
    distance: [
        {
            walkonecm:[
                ["minecraft:custom", "minecraft:walk_one_cm"],
                ["stat.walkOneCm"]
            ]
        }
    ]
}

async function showStatPage(index) {
    //Remove the contents
    menu.querySelector(".content").innerHTML = "";
    //Read the statistic types from the statformats.json file
    //var stats = JSON.parse(await fs.readFile("statformats.json"), "utf8");

    
    /*
        if index is
        -0 --> Show combined stats
        -1 --> Show world based stats
        -2 --> Show sessions

    */
    var properties;
    switch(index) {
        case 0:
            properties = {total: true}
        break;
        case 1:
            properties = {perWorld: true}
        break;
        case 2:
            properties = {sessions: true}
        break;
    }
//[["minecraft:custom", "minecraft:walk_one_cm"],["stat.walkOneCm"]]
    if(!properties.sessions) {
        var allWorlds = [];
        var createEntry = (path, properties, scaling, title, icon)=>{
            return new Promise((resolve, reject)=>{

                //Get total distance walked
                retrieveStat(path,properties)
                .then(async (res)=>{
                    if(properties.total) {
                        var entry = returnBox();
                        var ico = document.createElement("i");
                        ico.className = "material-icons";
                        ico.innerText = icon;
                        entry.appendChild(ico);
                        
                        var p = document.createElement("p");
                        p.className = "full-size";
                        p.innerText = Math.round(res*scaling) + " " + title;
                        entry.querySelector(".wrapper").appendChild(p);
                        resolve(entry);
                    } else if(properties.perWorld) {
                        var x;
                        for(x of res) {
                            await new Promise((resolve)=>{

                                if(allWorlds.filter(e=>e.name == x.name).length == 0) {
                                    allWorlds.push({name:x.name})
                                    //We will get returned all worlds per stat
                                    var entry = returnBox(true);
                                    menu.querySelector(".content").appendChild(entry);
                                    var name = document.createElement("p");
                                    name.className = "world-name";
                                    name.innerText = x.name;
                                    entry.querySelector(".wrapper").appendChild(name);
                                    var ul = document.createElement("div");
                                    ul.className = "ul";
                                    entry.querySelector(".wrapper").appendChild(ul);
                                    resolve();
                                } else {
                                    resolve();
                                }
                            })

                            var boxes = document.body.getElementsByClassName("stat-entry");
                            console.log(boxes);
                            var val = x.value;


                            var p = document.createElement("p");
                            p.className = "world-stat";
                            p.innerHTML = "<span>" + Math.round((val * scaling)) + "</span> " + title;
                            
                            //Get the thing in the world array that matches this thing and things thangs
                            var index = allWorlds.findIndex(y => y.name == x.name);
                            boxes[index].querySelector(".wrapper > .ul").appendChild(p);
                        }

                    }
                })
                .catch((err)=>{
                    reject(err);
                })
                
                var returnBox = (world)=>{
                    
                    var el = document.createElement("div");
                    el.className = "stat-entry smooth-shadow";
                    var wr = document.createElement("div");
                    wr.className = "wrapper";
                    el.appendChild(wr);

                    if(world) {
                        el.classList.add("world-display");
                    }
                    
                    return el;
                }
            })
        }

        var wrapper = document.querySelector("#main-container > div.menu-pane > div > div.content");
        createEntry([["minecraft:custom", "minecraft:walk_one_cm"],["stat.walkOneCm"]], properties, 0.01, "Meters walked", "directions_walk")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

        createEntry([["minecraft:custom", "minecraft:sneak_time"],["stat.sneakTime"]],properties, (1/20), "Seconds sneaked", "elderly")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

        
        createEntry([["minecraft:custom", "minecraft:mob_kills"],["stat.mobKills"]],properties, 1, "mobs killed", "shield")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })
        
        createEntry([["minecraft:custom", "minecraft:fly_one_cm"],["stat.flyOneCm"]],properties, (1/100), "meters flown", "flight")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

        createEntry([["minecraft:custom", "minecraft:deaths"],["stat.deaths"]],properties, 1, "deaths", "personal_injury")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

        createEntry([["minecraft:custom", "minecraft:total_world_time"],["stat.playOneMinute"], ["minecraft:custom", "minecraft:play_one_minute"]],properties, (((1/20)/60)/60), "hours played", "schedule")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

        createEntry([["minecraft:custom", "minecraft:jump"],["stat.jump"]],properties, 1, "times jumped", "north_east")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

    } else {
        //Show the properties section
        var wrapper = document.querySelector("#main-container > div.menu-pane > div > div.content");
        wrapper.innerHTML = "";
        var t = document.createElement("p");
        t.innerText ="Placeholder";
        wrapper.appendChild(t);
    }
    

}

async function worlds(el) {
    var menu = await openMenu(el)
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Worlds";
    menu.appendChild(title);
}

async function scan(el) {
    var menu = await openMenu(el)
    menu.closest(".menu-pane").classList.add("scan");
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Scan";
    menu.appendChild(title);

    var info = document.createElement("div");
    var p = document.createElement("p");
    p.innerText = `
        Select the folder containing the worlds when scanning for statistics. Minecraft log files are not yet supported when scanning manually for files.
    `;
    info.appendChild(p);
    info.className = "information-paragraph";
    menu.appendChild(info);
    var ico = document.createElement("i");
    ico.innerHTML = "info";
    ico.className = "material-icons";
    info.appendChild(ico);

    var pathB = document.createElement("div");
    pathB.className = "path-selection-box";
    menu.appendChild(pathB);

    var t = document.createElement("p");
    t.innerText = "Select a directory to scan";
    pathB.appendChild(t);
    t.className = "sub-title";

    var out = document.createElement("div");
    out.className = "path-out smooth-shadow";
    pathB.appendChild(out);

    var p = document.createElement("p");
    p.innerHTML = "No path selected";
    out.appendChild(p);

    var browse = document.createElement("button");
    browse.innerText = "browse";
    browse.className = "rounded outline";
    browse.style = `
        margin-left: 0.5rem;
        vertical-align: top;
    `

    browse.onclick = openDirectoryModal1;

    var scan = document.createElement("button");
    scan.innerText = "scan directory";
    scan.className = "smooth-shadow";
    pathB.appendChild(scan);
    pathB.appendChild(browse);

    scan.style = `
        display: inline-block;
        vertical-align: top;
        margin-left: 1rem;
    `

    scan.addEventListener("click", ()=>{
        scanDirectory(scanPath)
        .then(async(res)=>{
            //Add these to an object, and save this to a JSON-file
            var date = new Date();
            var obj = {
                meta:{
                   date: date,
                   directory: scanPath
                },
                scans:{
                    res
                }
            };

            var fileName = createFileName();

            try {
                await fs.writeFile(path.join(filesPath, "scans", fileName + ".json"), JSON.stringify(obj))
            } catch (error) {
                console.log(error);
                notification("Could not save session file");
            }

            //Update the session list
            try {
                await loadScans()
            } catch (error) {
                notification("Failed to update the scanned directories list");
            }
        })
        .catch((err)=>{
            notification(err);
        })
    })

    var res = document.createElement("div");
    res.className = "scan-result smooth-shadow";
    menu.appendChild(res);
    loadScans()
    .catch((err)=>{
        console.log(err);
        notification("Could not load scans");
    })
    var p = document.createElement("p");
    p.innerText = "Your scanned directories will appear here";
    res.appendChild(p);
    p.className = "empty"

    var dir = document.createElement("button");
    dir.className = "outline rounded";
    menu.appendChild(dir);
    dir.innerText = "Open scans folder";
    dir.style = `
        margin-top: 1rem;
    `;
    dir.addEventListener("click", ()=>{
        require('child_process').exec('start "" "' + path.join(filesPath, "scans"));
    })

}

function createScanEntry(file) {
    var el = document.createElement("div");
    el.className = "entry";

    var parent = document.querySelector("#main-container > div.menu-pane.scan > div > div.scan-result.smooth-shadow");
    if(parent.querySelector(".empty")) {parent.innerHTML = "";}

    parent.appendChild(el);

    var date = new Date(file.meta.date);
    
    var days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ]
    
    var hours = date.getHours()<10?"0" + date.getHours():date.getHours();
    var minutes = date.getMinutes()<10?"0" + date.getMinutes():date.getMinutes();

    var title = hours + ":" + minutes + " " + days[date.getDay()-1] + " " + date.getFullYear();
    
    var p = document.createElement("p");
    p.innerHTML = title;
    el.appendChild(p);
}

function loadScans() {
    return new Promise(async (resolve, reject)=>{

        try {
            var files = await fs.readdir(path.join(filesPath, "scans"))
        } catch (error) {
            console.log(error);
            reject(error);
        }
        console.log(files);
        if(files.length < 1) {resolve({scans: false}); return;}
        var x;
        var cont = document.querySelector("#main-container > div.menu-pane.scan > div > div.scan-result.smooth-shadow");
        cont.innerHTML = "";
        for(x of files) {
            try {
                var file = await fs.readFile(path.join(filesPath, "scans", x), "utf8");
            } catch (error) {
                console.log(error);
                reject(error);
            }

            createScanEntry(JSON.parse(file));
            resolve({scans: true});
        }
    })
}

function scanDirectory(path) {
    return new Promise((resolve, reject)=>{
        console.log(typeof path);
        if(!(typeof path == "string")) {reject("No path")}
        if(path.length < 1) {reject("No path")}
        retrieveStat([["minecraft:custom", "minecraft:total_world_time"],["stat.playOneMinute"], ["minecraft:custom", "minecraft:play_one_minute"]],{perWorld:true},path)
        .then((res)=>{
            resolve(res);
        })
        .catch((err)=>{
            console.log(err);
            notification("Something went wrong while scanning your files");
        })
    })
}


function revealAllScans() {
    return new Promise((resolve, reject)=>{

    })
}

var scanPath;

async function openDirectoryModal1() {
    var result = await ipcRenderer.invoke("open-directory-modal", "pp");
    if(result.length < 1) return;
    //Set the path variable as well
    scanPath = result[0];

    var text = document.querySelector("#main-container > div.menu-pane > div > div > div > p")
    if(text instanceof HTMLElement) {
        text.innerText = result[0];
    }

}

async function settings(el) {

    var menu = await openMenu(el)
    menu.closest(".menu-pane").classList.add("settings");
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Settings";
    menu.appendChild(title);

    var paths = document.createElement("div");
    paths.className = "path-selection-box";

    var t = document.createElement("p");
    t.innerText = "Minecraft path",
    paths.appendChild(t);

    var box = document.createElement("div");
    box.className = "path-out smooth-shadow";
    paths.appendChild(box);
    var p = document.createElement("p");
    box.appendChild(p);
    p.innerText = userConfig.minecraftpath;
    menu.appendChild(paths);

    var browse = document.createElement("button");
    browse.className = "smooth-shadow";
    browse.style = `
        margin-left: 1rem;
    `
    browse.innerText = "Browse";
    paths.appendChild(browse);
    browse.addEventListener("click", ()=>{
        openDirectoryModal2()
        .then(async (res)=>{
            box.children[0].innerText = res;
            userConfig.minecraftpath = res;
            try {
                await saveUserConfig(); 
                notification("Saved new minecraft path")
            } catch (error) {
                console.log(error);
                notification("Could not save the path choice");
            }

        })
        .catch((err)=>{
            notification("Could not fetch the path");
        })
    })

    var appV = document.createElement("p");
    appV.innerText = "App version - " + localStorage.getItem("app-version");
    menu.appendChild(appV);
    appV.style = `
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        opacity: 0.5;
        margin: 0;
    `;

    divider();

    var t = document.createElement("p");
    t.innerText = "Lost track of your total playtime?",
    menu.appendChild(t);
    t.style = "margin-bottom: 0.2rem";

    var reCalc = document.createElement("button");
    reCalc.innerText = "recalculate";
    reCalc.className = "smooth-shadow";
    menu.appendChild(reCalc);

    reCalc.addEventListener("click", async ()=>{

        var newObj = {
            username: userConfig.username,
            uuid: userConfig.uuid,
            logsCalculated: false,
            termsAccepted: userConfig.termsAccepted,
            minecraftpath: userConfig.minecraftpath
        }

        var newObj1 = {
            multiplayertime: 0,
            singleplayertime: 0,
            totalSessionTime: 0
        }

        try {
            await saveUserConfig(newObj);
            await saveTimeConfig(newObj1);
            timeConfig = newObj1;
            userConfig = newObj;
            totalSeconds = 0;

        } catch (error) {
            notification("Failed to update user config");
            return;
        }

        try {
            await gatherWorldInformation()
        } catch (error) {
            notification("Could not recalculate")
        }

        try {
            await scanLogFiles();
        } catch (error) {
            notification("Could not rescan log files");
        }


    })


    divider();

    var t = document.createElement("p");
    t.innerText = "Registered username and uuid",
    menu.appendChild(t);
    t.style = "margin-bottom: 0.5rem";

    var usrName = document.createElement("p");
    usrName.innerText = userConfig.username;
    menu.appendChild(usrName);

    var id = document.createElement("p");
    id.innerText = userConfig.uuid;
    menu.appendChild(id);


    divider();
    var reset = document.createElement("button");
    reset.innerText = "Reset program";
    menu.appendChild(reset);
    reset.style = `
        
    `;
    reset.className = "smooth-shadow";
    reset.addEventListener("click", async ()=>{
        try {
            await resetAppFiles();
        } catch (error) {
            notification("Could not reset the program");
            return;
        }

        relaunchProgram();
    })

    function divider() {
        var div = document.createElement("div");
        div.className = "divider";
        menu.appendChild(div);
    }

}

function saveUserConfig(custom) {
    return new Promise(async(resolve, reject)=>{
        var config = userConfig;
        if(custom) {
            config = custom;
        }
        try {
            await fs.writeFile(path.join(filesPath, "configs", "userdata.json"), JSON.stringify(config))
        } catch (error) {
            reject(error);
        }
        resolve();
    })
}

function saveTimeConfig(custom) {
    return new Promise(async(resolve, reject)=>{
        var config = timeConfig;
        if(custom) {
            config = custom;
        }
        try {
            await fs.writeFile(path.join(filesPath, "worlddata", "scannedplaytime.json"), JSON.stringify(config))
        } catch (error) {
            reject(error);
        }
        resolve();
    })
}

function openDirectoryModal2() {
    return new Promise(async (resolve, reject)=>{
        try {
            var result = await ipcRenderer.invoke("open-directory-modal", "pp");
        } catch (error) {
            reject(error);
        }
        if(result.length < 1) return;
        //Set the path variable as well
        resolve(result[0])
    })
}

function getOffset(el) {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY
    };
  }


  function stdMenu() {
    var menu = document.createElement("div");
    menu.className = "menu-pane non-transitioning";
    var wr = document.createElement("div");
    wr.className = "wrapper";
    menu.appendChild(wr);
    menu.kill = ()=>{
        menu.style.animation = "none";
        menu.style.animation = "fade-out 150ms ease-in-out both";
        setTimeout(()=>{
            menu.parentNode.removeChild(menu);
        }, 150)
    }


    var back = document.createElement("button");
    back.className = "button pill solid back secondary material-icons";
    back.innerHTML = "arrow_back";
    menu.appendChild(back);
    back.onclick = menu.kill;

    document.getElementById("main-container").appendChild(menu);
    return wr;
  }

function setupMenu() {
    return new Promise(async (resolve, reject)=>{
        var menu = await stdMenu();
        menu.closest(".menu-pane").classList.add("setup-menu");
          
        var page = document.createElement("div");
        page.className = "page-indicator";
        menu.parentNode.appendChild(page);

        menu.definePages = (num)=>{
            for(let i = 0; i < num; i++) {
                var el = document.createElement("div");
                el.className = "dot";
                page.appendChild(el);
            }
        }

        menu.setPage = (num) => {
            if(page.querySelector(".active")) {
                page.querySelector(".active").classList.remove("active");
            }
            page.children[num].classList.add("active");
        }

          resolve(menu);
        })
  }
