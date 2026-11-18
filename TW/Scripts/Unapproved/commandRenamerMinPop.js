// made by Costache Madalin (lllll llll)
// discord: costache madalin#8472



var units=["pop_total","pop_off","pop_def",...game_data.units.slice()]

if(units.includes("militia"))
    units.pop()
if(units.includes("noble"))
    units.pop()

    
var troopsPop = {
    spear : 1,
    sword : 1,
    axe : 1,
    archer : 1,
    spy : 2,
    light : 4,
    marcher : 5,
    heavy : 6,
    ram : 5,
    catapult : 8,
    knight : 10,
    snob : 100
}
troopsPop.heavy=heavyPop


var countApiKey = "command_renamer";
var countNameSpace="madalinoTribalWarsScripts"

var translations={
    en_DK:{
        "Command renamer": "Command renamer",
        "start": "start",
        "default": "default",
        "save": "save",
        "settings": "settings",
        "export": "export",
        "import": "import",
        "type": "type",
        "conditions": "conditions",
        "show packets": "show packets",
        "show type": "show type",
        "show population": "show population",
        "show troops": "show troops",
        "show building target": "show building target",
        "this option is only for support commands": "this option is only for support commands",
        "show building target if the number of catapults is greater than your selection": "show building target if the number of catapults is greater than your selection"
        },
    en_US:{
        "Command renamer": "Command renamer",
        "start": "start",
        "default": "default",
        "save": "save",
        "settings": "settings",
        "export": "export",
        "import": "import",
        "type": "type",
        "conditions": "conditions",
        "show packets": "show packets",
        "show type": "show type",
        "show population": "show population",
        "show troops": "show troops",
        "show building target": "show building target",
        "this option is only for support commands": "this option is only for support commands",
        "show building target if the number of catapults is greater than your selection": "show building target if the number of catapults is greater than your selection"
    },
    fr_FR:{
        "Command renamer": "Renommer ordre sortant",
        "start": "début",
        "default": "defaut",
        "save": "enregistrer",
        "settings": "paramètres",
        "export": "export",
        "import": "import",
        "type": "type",
        "conditions": "conditions",
        "show packets": "afficher paquets",
        "show type": "afficher type",
        "show population": "afficher population",
        "show troops": "afficher troupes",
        "show building target": "afficher batiments ciblés",
        "this option is only for support commands": "Cette option est seulement pour les supports",
        "show building target if the number of catapults is greater than your selection": "Afficher les bâtiments ciblés si le nombre de catapulte est supérieur à votre sélection"
    },
}


tt("wood purchased")//test translation


var headerWood="#001a33"
var headerWoodEven="#002e5a"
var headerStone="#3b3b00"
var headerStoneEven="#626200"
var headerIron="#1e003b"
var headerIronEven="#3c0076"


var defaultTheme= '[["theme1",["#E0E0E0","#000000","#C5979D","#2B193D","#2C365E","#484D6D","#4B8F8C","50"]],["currentTheme","theme1"],["theme2",["#E0E0E0","#000000","#F76F8E","#113537","#37505C","#445552","#294D4A","50"]],["theme3",["#E0E0E0","#000000","#ACFCD9","#190933","#665687","#7C77B9","#623B5A","50"]],["theme4",["#E0E0E0","#000000","#181F1C","#60712F","#274029","#315C2B","#214F4B","50"]],["theme5",["#E0E0E0","#000000","#9AD1D4","#007EA7","#003249","#1F5673","#1C448E","50"]],["theme6",["#E0E0E0","#000000","#EA8C55","#81171B","#540804","#710627","#9E1946","50"]],["theme7",["#E0E0E0","#000000","#754043","#37423D","#171614","#3A2618","#523A34","50"]],["theme8",["#E0E0E0","#000000","#9E0031","#8E0045","#44001A","#600047","#770058","50"]],["theme9",["#E0E0E0","#000000","#C1BDB3","#5F5B6B","#323031","#3D3B3C","#575366","50"]],["theme10",["#E0E0E0","#000000","#E6BCCD","#29274C","#012A36","#14453D","#7E52A0","50"]]]'
var localStorageThemeName = "commandRenamerTheme"
if(localStorage.getItem(localStorageThemeName)!=undefined){
    let mapTheme = new Map(JSON.parse(localStorage.getItem(localStorageThemeName)))
    Array.from(mapTheme.keys()).forEach((key)=>{
        if(key!="currentTheme"){
            let listColors=mapTheme.get(key);
            if(listColors.length == 7){
                listColors.push(50);
                mapTheme.set(key,listColors)
            }
        }
    })
    localStorage.setItem(localStorageThemeName, JSON.stringify(Array.from(mapTheme.entries())))
}


var textColor="#ffffff"
var backgroundInput="#000000"

var borderColor = "#C5979D";//#026440
var backgroundContainer="#2B193D"
var backgroundHeader="#2C365E"
var backgroundMainTable="#484D6D"
var backgroundInnerTable="#4B8F8C"

var widthInterface=50;//percentage
var headerColorDarken=-50 //percentage( how much the header should be darker) if it's with -(darker) + (lighter)
var headerColorAlternateTable=-30;
var headerColorAlternateHover=30;

var backgroundAlternateTableEven=backgroundContainer;
var backgroundAlternateTableOdd=getColorDarker(backgroundContainer,headerColorAlternateTable);

async function main(){
    initializationTheme()
    await $.getScript("https://dl.dropboxusercontent.com/s/i5c0so9hwsizogm/styleCSSGlobal.js?dl=0");
    await insertJqueryTouch()
    createMainInterface()
    createTableSettings()
    createTableExport()
    createTableImport()
    changeTheme()

    initializationConditions()
    hitCountApi()
}
main()

function getColorDarker(hexInput, percent) {
    let hex = hexInput;

    // strip the leading # if it's there
    hex = hex.replace(/^\s*#|\s*$/g, "");

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, "$1$1");
    }

    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    const calculatedPercent = (100 + percent) / 100;

    r = Math.round(Math.min(255, Math.max(0, r * calculatedPercent)));
    g = Math.round(Math.min(255, Math.max(0, g * calculatedPercent)));
    b = Math.round(Math.min(255, Math.max(0, b * calculatedPercent)));

    return `#${("00"+r.toString(16)).slice(-2).toUpperCase()}${("00"+g.toString(16)).slice(-2).toUpperCase()}${("00"+b.toString(16)).slice(-2).toUpperCase()}`
}

function createMainInterface(){
    
    let html_info=`
    
    <div id="div_container" class="scriptContainer">
        <div class="scriptHeader">
            <div style=" margin-top:10px;"><h2>${tt("Command renamer")}</h2></div>
            <div style="position:absolute;top:10px;right: 10px;"><a href="#" onclick="$('#div_container').remove()"><img src="https://img.icons8.com/emoji/24/000000/cross-mark-button-emoji.png"/></a></div>
            <div style="position:absolute;top:8px;right: 35px;" id="div_minimize"><a href="#"><img src="https://img.icons8.com/plasticine/28/000000/minimize-window.png"/></a></div>
            <div style="position:absolute;top:10px;right: 60px;" id="div_theme"><a href="#" onclick="$('#theme_settings').toggle()"><img src="https://img.icons8.com/material-sharp/24/fa314a/change-theme.png"/></a></div>
        </div>

        <div id="theme_settings"></div>
        <div id="div_body">
            <center>
                <input class="btn evt-confirm-btn btn-confirm-yes" type="button" onclick="start()" style="margin:10px" value="${tt("start")}">
                <input class="btn evt-confirm-btn btn-confirm-yes" type="button" onclick="defaultSettings()"  style="margin:10px" value="${tt("default")}">
                <input class="btn evt-confirm-btn btn-confirm-yes" type="button" onclick="saveConditions()" style="margin:10px" value="${tt("save")}">
                <input class="btn evt-confirm-btn btn-confirm-yes" type="button" onclick="createTableSettings()" style="margin:10px" value="${tt("settings")}">
                <input class="btn evt-confirm-btn btn-confirm-yes" type="button" onclick="createTableExport()" style="margin:10px" value="${tt("export")}">
                <input class="btn evt-confirm-btn btn-confirm-yes" type="button" onclick="createTableImport()" style="margin:10px" value="${tt("import")}">
            </center>
            
            <center style="margin:10px" ><div id="div_settings" hidden> </div></center>
            <center style="margin:10px" ><div id="div_export" hidden> </div></center>
            <center style="margin:10px" ><div id="div_import" hidden> </div></center>

            <div id="divConditions" style="height: 600px; overflow-y: auto">
                <table id="table_main" class="scriptTable">
                    <tr class="disabled" >
                        <td style="width:5%"></td>
                        <td style="width:15%">${tt("type")}</td>
                        <td >${tt("conditions")}</td>
                        <td style="width:5%" class="hideMobile"></td>
                    </tr>
                    <tr id="add_row" class="disabled" >
                        <td ></td>
                        <td colspan="2">
                        <a href="#" onclick="addNewRow()"><img src="https://img.icons8.com/office/20/000000/add-row.png"/></a>
                        </td>
                        <td class="hideMobile"></td>
                    </tr>     
                </table>
            </div>
        </div>
        <div class="scriptFooter">
            <div style=" margin-top:5px;"><h5>made by Costache</h5></div>
        </div>

    </div>`
    ////////////////////////////////////////add and remove window from page///////////////////////////////////////////
    $("#div_container").remove()
    $("#contentContainer").eq(0).prepend(html_info);
    $("#mobileContent").eq(0).prepend(html_info);

    //for mobile browser
    if(game_data.device == "desktop")
        $("#div_container").draggable();


    $("#div_container").css("position","fixed");

    
    $("#div_minimize").on("click",()=>{
        let currentWidthPercentage=Math.ceil($('#div_container').width() / $('body').width() * 100);
        if(currentWidthPercentage >=widthInterface ){
            $('#div_container').css({'width' : '10%'});
            $('#div_body').hide();
        }
        else{
            $('#div_container').css({'width' : `${widthInterface}%`});
            $('#div_body').show();
        }
    })

    if(game_data.device != "desktop"){
        $("#divConditions").css("height","400px")
    }


    $('#table_main tbody').sortable({
        refreshPositions: true,
        opacity: 0.5,
        scroll: true,
        handle:".ui-sortable",
        items: "tr:not(.disabled)",
        containment: 'parent',
        placeholder: 'ui-placeholder',
        tolerance: 'pointer',
        'start': function (event, ui) {
          ui.placeholder.html("<td colspan='1'><hr></td>")}});
}

function changeTheme(){
    let html= `
    <h3 style="color:${textColor};padding-left:10px;padding-top:5px">after theme is selected run the script again<h3>
    <table class="scriptTable" >
        
        <tr>
            <td>
                <select  id="select_theme">
                    <option value="theme1">theme1</option>
                    <option value="theme2">theme2</option>
                    <option value="theme3">theme3</option>
                    <option value="theme4">theme4</option>
                    <option value="theme5">theme5</option>
                    <option value="theme6">theme6</option>
                    <option value="theme7">theme7</option>
                    <option value="theme8">theme8</option>
                    <option value="theme9">theme9</option>
                    <option value="theme10">theme10</option>
                </select>
            </td>
            <td>value</td>
            <td >color hex</td>
        </tr>
        <tr>
            <td>textColor</td>
            <td style="background-color:${textColor}" class="td_background"></td>
            <td><input type="text" class="scriptInput input_theme" value="${textColor}"></td>
        </tr>
        <tr>
            <td>backgroundInput</td>
            <td style="background-color:${backgroundInput}" class="td_background"></td>
            <td><input type="text" class="scriptInput input_theme" value="${backgroundInput}"></td>
        </tr>
        <tr>
            <td>borderColor</td>
            <td style="background-color:${borderColor}" class="td_background"></td>
            <td><input type="text" class="scriptInput input_theme" value="${borderColor}"></td>
        </tr>
        <tr>
            <td>backgroundContainer</td>
            <td style="background-color:${backgroundContainer}" class="td_background"></td>
            <td><input type="text" class="scriptInput input_theme" value="${backgroundContainer}"></td>
        </tr>
        <tr>
            <td>backgroundHeader</td>
            <td style="background-color:${backgroundHeader}" class="td_background"></td>
            <td><input type="text" class="scriptInput input_theme" value="${backgroundHeader}"></td>
        </tr>
        <tr>
            <td>backgroundMainTable</td>
            <td style="background-color:${backgroundMainTable}" class="td_background"></td>
            <td><input type="text" class="scriptInput input_theme" value="${backgroundMainTable}"></td>
        </tr>
        <tr>
            <td>backgroundInnerTable</td>
            <td style="background-color:${backgroundInnerTable}" class="td_background"></td>
            <td><input type="text" class="scriptInput input_theme" value="${backgroundInnerTable}"></td>
        </tr>
        <tr>
            <td>widthInterface</td>
            <td><input type="range" min="25" max="100" class="slider input_theme" id="input_slider_width" value="${widthInterface}"></td>
            <td id="td_width">${widthInterface}%</td>
        </tr>
        <tr >
            <td><input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_save_theme" value="Save"></td>
            <td><input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_reset_theme" value="Default themes"></td>
            <td></td>
        </tr>

    </table>
    `
    $("#theme_settings").append(html)
    $("#theme_settings").hide()

    let selectedTheme = ""
    let colours =[]
    let mapTheme = new Map()

    $("#select_theme").on("change",()=>{
        if(localStorage.getItem(localStorageThemeName) != undefined){
            selectedTheme = $('#select_theme').find(":selected").text();
            colours = Array.from($(".input_theme")).map(elem=>elem.value.toUpperCase().trim())
            mapTheme = new Map(JSON.parse(localStorage.getItem(localStorageThemeName)))
            console.log(selectedTheme)
            console.log(mapTheme)
            colours = mapTheme.get(selectedTheme)
            console.log(colours)
            Array.from($(".input_theme")).forEach((elem,index)=>{
                elem.value = colours[index]
            })
            Array.from($(".td_background")).forEach((elem,index)=>{
                elem.style.background = colours[index]
            })

            mapTheme.set("currentTheme",selectedTheme)
            localStorage.setItem(localStorageThemeName, JSON.stringify(Array.from(mapTheme.entries())))
        }
    })

    $("#btn_save_theme").on("click",()=>{
        colours = Array.from($(".input_theme")).map(elem=>elem.value.toUpperCase().trim())
        selectedTheme = $('#select_theme').find(":selected").text();

        for(let i=0;i<colours.length-1;i++){
            if(colours[i].match(/#[0-9 A-F]{6}/) == null ){
                UI.ErrorMessage("wrong colour: "+colours[i])  
                throw new Error("wrong colour")
            }
        }

        if(localStorage.getItem(localStorageThemeName) != undefined)
            mapTheme = new Map(JSON.parse(localStorage.getItem(localStorageThemeName)))


        mapTheme.set(selectedTheme,colours)
        mapTheme.set("currentTheme",selectedTheme)

        localStorage.setItem(localStorageThemeName, JSON.stringify(Array.from(mapTheme.entries())))
        console.log("saved colours for: "+selectedTheme)
        UI.SuccessMessage(`saved colours for: ${selectedTheme} \n run the script again`,1000)


    })

    $("#btn_reset_theme").on("click",()=>{
        localStorage.setItem(localStorageThemeName, defaultTheme)
        UI.SuccessMessage("run the script again",1000)

    })
    $("#input_slider_width").on("input",()=>{
        $("#td_width").text($("#input_slider_width").val()+"%")
    })


    if(localStorage.getItem(localStorageThemeName) != undefined){
        mapTheme = new Map(JSON.parse(localStorage.getItem(localStorageThemeName)))
        let currentTheme=mapTheme.get("currentTheme")
        document.querySelector('#select_theme').value=currentTheme
    }

    
}




function initializationTheme(){
    if(localStorage.getItem(localStorageThemeName) != undefined){
        let mapTheme = new Map(JSON.parse(localStorage.getItem(localStorageThemeName)))
        let currentTheme=mapTheme.get("currentTheme")
        let colours=mapTheme.get(currentTheme)

        textColor=colours[0]
        backgroundInput=colours[1]

        borderColor = colours[2]
        backgroundContainer=colours[3]
        backgroundHeader=colours[4]
        backgroundMainTable=colours[5]
        backgroundInnerTable=colours[6]
        widthInterface=colours[7]

        if(game_data.device != "desktop"){
            widthInterface = 98
        }

        backgroundAlternateTableEven=backgroundContainer;
        backgroundAlternateTableOdd=getColorDarker(backgroundContainer,headerColorAlternateTable);       
        console.log("textColor: "+textColor)
        console.log("backgroundContainer: "+backgroundContainer)
        
    }
    else{
        localStorage.setItem(localStorageThemeName, defaultTheme)

        let mapTheme = new Map(JSON.parse(localStorage.getItem(localStorageThemeName)))
        let currentTheme=mapTheme.get("currentTheme")
        let colours=mapTheme.get(currentTheme)

        textColor=colours[0]
        backgroundInput=colours[1]

        borderColor = colours[2]
        backgroundContainer=colours[3]
        backgroundHeader=colours[4]
        backgroundMainTable=colours[5]
        backgroundInnerTable=colours[6]
        widthInterface=colours[7]

        if(game_data.device != "desktop"){
            widthInterface = 98
        }

        backgroundAlternateTableEven=backgroundContainer;
        backgroundAlternateTableOdd=getColorDarker(backgroundContainer,headerColorAlternateTable);  
    }

}








function addNewRow(){
    let html_tr=`
        <tr class="tr_condition" >
            <td>
                <a href="#"  onclick="$(this).closest('tr').remove()"><img src="https://dsen.innogamescdn.com/asset/dbeaf8db/graphic/delete.png" /></a>
            </td>
            <td class="tdRotateMobile">
               <input type="text" class="condition_type scriptInput rotateMobile"  placeholder="set type" >
            </td>
            <td>
                <center style="margin:10px">
                    <table id="table_conditions"  class="scriptTableInner">

                        <tr hidden> </tr>
                        <tr class="add_condition">
                            <td colspan="4">
                                <a href="#" onclick="addCondition(event)" class="img_add_condition"><img src="https://img.icons8.com/ultraviolet/20/000000/add-row.png"/></a>
                            </td>
                        </tr>        
                    </table>
                </center>
            </td>
            <td class="ui-sortable hideMobile" >
                <a href="#" ><img src="https://www.tribalwars.net/graphic/sorthandle.png" /></a>
            </td>


        </tr>
    `
    $(html_tr).insertBefore("#add_row")
    if(game_data.device != "desktop"){
        $(".rotateMobile").css({
            "transform": "rotate(90deg)",
            "width":"100%",
        })

    }
}




function addCondition(event){
    html_cond=`
        <tr class="value_condition">
            <td>
                
                <select  class="select_troop">`
                    for(let i=0;i<units.length;i++){
                        html_cond+=`  <option value="${units[i]}">${units[i]}</option>`
                    }
        html_cond+=
                `</select>
               
            </td>
            <td>
            
                <select  class="select_operation">
                    <option value=">">></option>
                    <option value="<="><=</option>
                    <option value="=">=</option>
                </select>
                
               
            </td>
            <td>
                <input type="number" class="scriptInput" placeholder="1000" value="1000">
            </td>
            <td style="width:8%">
                <a href="#" onclick="$(this).closest('tr').remove()" ><img src="https://dsen.innogamescdn.com/asset/dbeaf8db/graphic/delete.png"/></a>
            </td>
        </tr>
    `
    let closestImg=event.target.closest("tr")
    $(html_cond).insertBefore(closestImg)
}


function createTableSettings(){

    let obj_tr={
        tr_population:`
            <tr class="tr_settings" tr-name='tr_population'>
                <td><input type="checkbox"  value="show_population"></td>
                <td>${tt("show population")}</td>
                <td class="ui-sortable-settings"><a href="#" ><img src="https://www.tribalwars.net/graphic/sorthandle.png"/></a></td>
            </tr>`,
        tr_buildings:`
            <tr class="tr_settings" tr-name='tr_buildings'>
                <td><input type="checkbox"  value="show_building"></td>
                <td>${tt("show building target")}
                    <input type="number" id="nr_cats_target" class="scriptInput" placeholder="15" value="15">
                    <a href="#" onclick="UI.InfoMessage('${tt("show building target if the number of catapults is greater than your selection")}',5000)"><img src="https://dsen.innogamescdn.com/asset/dbeaf8db/graphic/questionmark.png" style="width: 13px; height: 13px"/>
        
                    </div>
                </td>
                <td class="ui-sortable-settings" ><a href="#" ><img src="https://www.tribalwars.net/graphic/sorthandle.png"/></a></td>
            </tr>`,
        tr_troops:`
            <tr class="tr_settings" tr-name='tr_troops'>
                <td><input type="checkbox"  value="show_troops"></td>
                <td>${tt("show troops")}</td>
                <td class="ui-sortable-settings" ><a href="#" ><img src="https://www.tribalwars.net/graphic/sorthandle.png"/></a></td>
            </tr>`,
        tr_type:`
            <tr class="tr_settings" tr-name='tr_type'>
                <td><input type="checkbox"  value="show_type"></td>
                <td>${tt("show type")}</td>
                <td class="ui-sortable-settings"><a href="#" ><img src="https://www.tribalwars.net/graphic/sorthandle.png"/></a></td>
            </tr>`,
        tr_packets:`
        <tr class="tr_settings" tr-name='tr_packets'>
            <td><input type="checkbox"  value="show_packets"></td>

            <td>${tt("show packets")}<a href="#" onclick="UI.InfoMessage('${tt("this option is only for support commands")}',3000)"><img src="https://dsen.innogamescdn.com/asset/dbeaf8db/graphic/questionmark.png" style="width: 13px; height: 13px"/></a></td>
            <td class="ui-sortable-settings" ><a href="#" ><img src="https://www.tribalwars.net/graphic/sorthandle.png"/></a></td>
        </tr>`
    }

    let list_tr=["tr_type","tr_population","tr_troops","tr_buildings","tr_packets"]


    //initialize order
    if(localStorage.getItem(game_data.world+"command_renamer_settings_table")!=null ){
        list_tr=JSON.parse(localStorage.getItem(game_data.world+"command_renamer_settings_table"))[3]
    }


    let html_table=`
    <table id="settings_table"  class="scriptTable" style="width:50%">
        <tr class="disabled">
            <tdcolspan="3">
                <center style="margin:10px">
                    <select  id="select_command">
                        <option value="all">all</option>
                        <option value="offensive">offensive</option>
                        <option value="defensive">defensive</option>
                    </select>
                </center>
            </td>
        </tr>`
        html_table+=`<tr class="disabled"><td colspan="3"><center style="margin:5px">min population to label <input type="number" id="min_pop" class="scriptInput" min="0" placeholder="${DEFAULT_MIN_POP}" value="${getMinPop()}"> <a href="#" onclick="UI.InfoMessage('commands with a total population below this number are skipped (not labelled). Use 0 to label everything',5000)"><img src="https://dsen.innogamescdn.com/asset/dbeaf8db/graphic/questionmark.png" style="width: 13px; height: 13px"/></a></center></td></tr>`
        if(list_tr!=undefined){
            for(let i=0;i<list_tr.length;i++){
                html_table+=obj_tr[list_tr[i]]
            }
        }


    html_table+=`</table>`
    if(document.getElementById("settings_table")==null){
        document.getElementById("div_settings").innerHTML=html_table
    
    
        if(localStorage.getItem(game_data.world+"command_renamer_settings_table")!=null ){
            //initialize checkbox
            let list_checkbox=JSON.parse(localStorage.getItem(game_data.world+"command_renamer_settings_table"))[0]
            $('#div_settings input[type=checkbox]').each(function (index,elem) {
                this.checked=list_checkbox[index]
                // console.log(elem.value)
            });
            //initialize dropdown
            let list_select=JSON.parse(localStorage.getItem(game_data.world+"command_renamer_settings_table"))[1]
            $('#div_settings select').each(function (index,elem) {
                this.value=list_select[index]
                // console.log(elem.value)
            });

            //initialize input numbers
            let list_input=JSON.parse(localStorage.getItem(game_data.world+"command_renamer_settings_table"))[2]
            $('#div_settings input[type=number]:not(#min_pop)').each(function (index,elem) {
                // console.log(elem)
                this.value=list_input[index]
            });


        }
        //save settings
        $("#div_settings input[type=checkbox],#div_settings input[type=number],#div_settings select").on("click input change",()=>{
            saveLocalSettings();
        })


        $('#settings_table tbody').sortable({
            refreshPositions: true,
            opacity: 0.5,
            scroll: true,
            handle:".ui-sortable-settings",
            items: "tr:not(.disabled)",
            containment: 'parent',
            placeholder: 'ui-placeholder',
            tolerance: 'pointer',
            update: function( event, ui ) {
                console.log("update settings i hope")
                saveLocalSettings();
            },
        })

    }
    else{
        $("#div_import").hide()
        $("#div_export").hide()
        $("#div_settings").toggle(500)
    }

}



function createTableImport(){
    let html_table=`
    <table id="table_import" class="scriptTable" style="width:50%">
        <tr>
            <td><input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_import" style="margin:10px" value="${tt("import")}"></td>
            <td><textarea id="textarea_import"  rows="10"></textarea></td>
        </tr>
       
    </table>

    `
    if(document.getElementById("table_import")==null){
        document.getElementById("div_import").innerHTML=html_table

        $("#btn_import").click(function(){
            try{
                let data=JSON.parse($("#textarea_import").val())
                console.log("data",data)
    
                //update and save settings
                if(data.length==2){
                    let settings=data.pop();
                    document.getElementById("settings_table").remove()
                    localStorage.setItem(game_data.world+"command_renamer_settings_table",settings)
                    createTableSettings()
    
                }
    
                //update and save conditions
                let conditons=data.pop()
                $(".tr_condition").remove()
                localStorage.setItem(game_data.world+"command_renamer_conditions",JSON.stringify(conditons))
                initializationConditions()
    
    
                UI.SuccessMessage("settings have been imported",2000)

            }catch(error){
                UI.ErrorMessage(error)
            }
       
        });
  
    }else{
        $("#div_export").hide()
        $("#div_settings").hide()
        $("#div_import").toggle(500)
    }
    







}


function createTableExport(){
    let html_table=`
    <table id="export_table" class="scriptTable"  style="width:50%">
        <tr>
            <td><input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_export" style="margin:10px" value="${tt("export")}"></td>
            <td><textarea id="export_settings"   rows="10"></textarea></td>
        </tr>
    </table>`
    if(document.getElementById("export_table")==null){
        document.getElementById("div_export").innerHTML=html_table

        $("#btn_export").click(function(){
            let list_export=[getConditions()]
            let data_localStorage=localStorage.getItem(game_data.world+"command_renamer_settings_table")
            if(data_localStorage!=null){
                list_export.push([data_localStorage])
            }
            
            UI.SuccessMessage("settings have been copied",1000)
            $("#export_settings").val(JSON.stringify(list_export))
            $("#export_settings").select();
            document.execCommand('copy');
        });
    }
    else{
        $("#div_import").hide()
        $("#div_settings").hide()
        $("#div_export").toggle(500)
    }
     
}



function saveConditions(){
    let list_condition=getConditions()
    let data=JSON.stringify(list_condition)
    UI.SuccessMessage("configuration saved",1000)
    localStorage.setItem(game_data.world+"command_renamer_conditions",data)

}

function getConditions(){
    let table_condition=$("#table_main .tr_condition")
    let list_condition=[]

    for(let i=0;i<table_condition.length;i++){
        let type=table_condition[i].getElementsByClassName("condition_type")[0].value
        if(type==""){
            UI.ErrorMessage("set TYPE for each row",1500)
            throw new Error("set TYPE type for each row")
        }

        let table_values=$(table_condition[i]).find(".value_condition")
        if(table_values.length==0){
            UI.ErrorMessage("set CONDITIONS for each row",1500)
            throw new Error("set CONDITIONS for each row")
        }

        console.log("table_values",table_values)
        let list_values=[]
        for(let j=0;j<table_values.length;j++){
            // console.log(table_values[j])
            let select_troop=table_values[j].getElementsByTagName("select")[0].value
            let select_operation=table_values[j].getElementsByTagName("select")[1].value
            let nr_troops=table_values[j].getElementsByTagName("input")[0].value
            nr_troops=(nr_troops<0)?0:nr_troops

            list_values.push({
                select_troop:select_troop,
                select_operation:select_operation,
                nr_troops:nr_troops
            })
        }
        list_condition.push({
            type:type,
            list_values:list_values
        })
    }
    console.log(list_condition)
    return list_condition
}

// minimum total population a command needs to be labelled (smaller commands, e.g. farming runs, are skipped)
var DEFAULT_MIN_POP=200
function getMinPop(){
    let elem=document.getElementById("min_pop")
    let value=parseInt(elem!=null ? elem.value : localStorage.getItem(game_data.world+"command_renamer_min_pop"))
    return (Number.isNaN(value) || value < 0) ? DEFAULT_MIN_POP : value
}

function saveLocalSettings(){
    if(document.getElementById("min_pop")!=null)
        localStorage.setItem(game_data.world+"command_renamer_min_pop",getMinPop())
    console.log("save settings")
    let list_checkbox=[]
    let select_command_value=[]
    let list_input=[]
    let list_order=[]
    //save checkbox
    $('#div_settings input[type=checkbox]').each(function () {
        var checked = this.checked
        // console.log(this)
        list_checkbox.push(checked)
    });
    //save dropdown
    $('#div_settings select').each(function () {
        var value = this.value
        select_command_value.push(value)
    });
    //save inputs
    $('#div_settings input[type=number]:not(#min_pop)').each(function () {
        // var checked = this.checked
        var value=this.value
        // console.log(value)
        list_input.push(value)
    });

    //save order tr
    $('#div_settings .tr_settings').each(function () {
        let name=this.getAttribute("tr-name")
        list_order.push(name)
        console.log(name)
    });



    let list_final=[list_checkbox,select_command_value,list_input,list_order]
    let data=JSON.stringify(list_final)
    let data_localStorage=localStorage.getItem(game_data.world+"command_renamer_settings_table")
    console.log(data)
    console.log(data_localStorage)
    if(data!=data_localStorage){
        localStorage.setItem(game_data.world+"command_renamer_settings_table",data)
    }       
}



function initializationConditions(){
    let data=localStorage.getItem(game_data.world+"command_renamer_conditions")
    if(data!=null){
        let list_condition=JSON.parse(data)
        console.log("list_condition",list_condition)

        //initialize each row =>img delete/all conditions/img draggable
        for(let i=0;i<list_condition.length;i++){
            addNewRow()
        }

        let table_condition=$("#table_main .tr_condition")
        for(let i=0;i<table_condition.length;i++){
            table_condition[i].getElementsByClassName("condition_type")[0].value=list_condition[i].type
            let list_values=list_condition[i].list_values

            //initialize each condition =>select troop/select operation/nr troops
            //only pressing on the image and add another inside row for a new condition
            for(let j=0;j<list_values.length;j++){
                table_condition[i].getElementsByClassName("img_add_condition")[0].click()
            }

            //the actual initialisation
            let table_value=$(table_condition[i]).find(".value_condition")
            console.log(table_value)
            for(let j=0;j<table_value.length;j++){
                table_value[j].getElementsByClassName("select_troop")[0].value=list_values[j].select_troop
                table_value[j].getElementsByClassName("select_operation")[0].value=list_values[j].select_operation
                table_value[j].getElementsByTagName("input")[0].value=list_values[j].nr_troops
            }



        }


    }
}



function defaultSettings(){

    var default_settings=[[{"type":"NUKE","list_values":[{"select_troop":"pop_off","select_operation":">","nr_troops":"12000"}]},{"type":"HALF NUKE","list_values":[{"select_troop":"pop_total","select_operation":"<=","nr_troops":"12000"},{"select_troop":"axe","select_operation":">","nr_troops":"1500"}]},{"type":"FANG","list_values":[{"select_troop":"pop_total","select_operation":"<=","nr_troops":"10000"},{"select_troop":"pop_total","select_operation":">","nr_troops":"500"},{"select_troop":"catapult","select_operation":">","nr_troops":"50"}]},{"type":"FAKE","list_values":[{"select_troop":"pop_total","select_operation":"<=","nr_troops":"150"},{"select_troop":"catapult","select_operation":">","nr_troops":"0"}]},{"type":"FAKE","list_values":[{"select_troop":"pop_total","select_operation":"<=","nr_troops":"150"},{"select_troop":"ram","select_operation":">","nr_troops":"0"}]},{"type":"LOOT","list_values":[{"select_troop":"light","select_operation":"<=","nr_troops":"40"},{"select_troop":"ram","select_operation":"=","nr_troops":"0"},{"select_troop":"catapult","select_operation":"=","nr_troops":"0"},{"select_troop":"snob","select_operation":"=","nr_troops":"0"},{"select_troop":"light","select_operation":">","nr_troops":"0"}]},{"type":"NOTYPE","list_values":[{"select_troop":"pop_def","select_operation":">","nr_troops":"200"},{"select_troop":"pop_off","select_operation":"<=","nr_troops":"20"}]}],["[[true,true,true,true,true],[\"all\"],[\"15\"],[\"tr_packets\",\"tr_type\",\"tr_population\",\"tr_troops\",\"tr_buildings\"]]"]]
    
    //save and update settings
    if(document.getElementById("settings_table")!=null)
        document.getElementById("settings_table").remove()

    localStorage.setItem(game_data.world+"command_renamer_settings_table",default_settings[1])
    localStorage.setItem(game_data.world+"command_renamer_min_pop",DEFAULT_MIN_POP)
    createTableSettings()

    //save and update conditions
    $(".tr_condition").remove()
    localStorage.setItem(game_data.world+"command_renamer_conditions",JSON.stringify(default_settings[0]))
    initializationConditions()
}




function httpGet(theUrl){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}



function ajaxCatapultTarget(commandId){
    return new Promise((resolve,reject)=>{
        let units=game_data.units.slice()
        if(units.includes("militia")){
            units.pop()
        }

        let startAjax=new Date().getTime()
        $.ajax({
            url: game_data.link_base_pure+`info_command&ajax=details&id=${commandId}`,
            method: 'get',
            success: (data) => {
                let catapult_target={
                    id:"none",
                    name:"none"
                }

                if(data.catapult_target!=undefined){
                    catapult_target.id = data.catapult_target.id
                    catapult_target.name = data.catapult_target.name
                }

                let stopAjax=new Date().getTime()
                let difAjax=stopAjax-startAjax
                // console.log("wait ajax cats",difAjax)
                window.setTimeout(()=>{
                    resolve(catapult_target)
                },200-difAjax)

            },error:(data)=>{
                reject(data)
            }

        })
    })
}

function getAllCommands(){

    return new Promise((resolve,reject)=>{

    let show_building = $("input[type=checkbox][value=show_building]").prop("checked");
    let nr_cats_target = parseInt(document.getElementById("nr_cats_target").value)
    nr_cats_target=(Number.isNaN(nr_cats_target) || nr_cats_target <= 0) ? 15 : nr_cats_target

    //create link
    let linkCommand=game_data.link_base_pure+"overview_villages&mode=commands&type=support&group=0&page=-1&"
    console.log(linkCommand)
    let dataPage = httpGet(linkCommand)
    document.body.innerHTML = dataPage
    const parserSupport = new DOMParser();
    const htmlDocSupport = parserSupport.parseFromString(dataPage, 'text/html');
    
    
    //get pages for all incoming
    let list_pages=[]

    if($(htmlDocSupport).find(".paged-nav-item").parent().find("select").length>0){
        Array.from($(htmlDocSupport).find(".paged-nav-item").parent().find("select")).forEach(function(item){
            list_pages.push({
                href: item.value,
                commandType: "support"
            })
        })
        list_pages.pop();
    }
    else if(htmlDocSupport.getElementsByClassName("paged-nav-item").length>0){//all pages from the current folder
        let nr=0;
        Array.from(htmlDocSupport.getElementsByClassName("paged-nav-item")).forEach(function(item){
            let current=item.href;
            current=current.split("page=")[0]+"page="+nr
            nr++;
            list_pages.push({
                href: current,
                commandType: "support"
            })
        })
    }
    else{
        // let current_link=window.location.href;
        list_pages.push({
            href: linkCommand,
            commandType: "support"
        })
    }


    linkCommand=game_data.link_base_pure+"overview_villages&mode=commands&type=attack&group=0&page=-1&"
    console.log(linkCommand)
    dataPage = httpGet(linkCommand)
    document.body.innerHTML = dataPage
    const parserAttack = new DOMParser();
    const htmlDocAttack = parserAttack.parseFromString(dataPage, 'text/html');
    
    
    //get pages for all incoming

    if($(htmlDocAttack).find(".paged-nav-item").parent().find("select").length>0){
        Array.from($(htmlDocAttack).find(".paged-nav-item").parent().find("select").find("option")).forEach(function(item){
            list_pages.push({
                href: item.value,
                commandType: "attack"
            })
        })
        list_pages.pop();
    }
    else if(htmlDocAttack.getElementsByClassName("paged-nav-item").length>0){//all pages from the current folder
        let nr=0;
        Array.from(htmlDocAttack.getElementsByClassName("paged-nav-item")).forEach(function(item){
            let current=item.href;
            current=current.split("page=")[0]+"page="+nr
            nr++;
            list_pages.push({
                href: current,
                commandType: "attack"
            })
        })
    }
    else{
        // let current_link=window.location.href;
        list_pages.push({
            href: linkCommand,
            commandType: "attack"
        })
    }




    list_pages=list_pages.reverse();
    console.log(list_pages)

    let serverTime=document.getElementById("serverTime").innerText
    let serverDate=document.getElementById("serverDate").innerText.split("/")
    serverDate=serverDate[1]+"/"+serverDate[0]+"/"+serverDate[2]
    let date_current=new Date(serverDate+" "+serverTime).getTime()
    
    let rows=[]
    let units=[...game_data.units.slice()]
    let map_Idcommands=new Map()
    
    let data=localStorage.getItem(game_data.world+"command_renamer_Idcommands")
    new Map(JSON.parse(data))
    if(data!=null){
        map_Idcommands=new Map(JSON.parse(data))

        Array.from(map_Idcommands.keys()).forEach(key=>{
            let obj=map_Idcommands.get(key)
            if(date_current > obj.date_read){
                map_Idcommands.delete(key)
                console.log("delete",key)
            }
        })
        data=JSON.stringify(Array.from(map_Idcommands.entries()))
        localStorage.setItem(game_data.world+"command_renamer_Idcommands",data)
        

    }
    
    let nr_page=0
    let total_pages = list_pages.length
    function ajaxRequest (urls) {
        let current_url,commandType
        if(urls.length>0){
            let obj = urls.pop()
            current_url = obj.href
            commandType = obj.commandType
        }
        else{
            current_url="stop"
        }
        // console.log(current_url)
        if (urls.length >= 0 && current_url!="stop") {// go to every page and get all rows
            nr_page++
            let start = new Date()
            $.ajax({
                url: current_url,
                method: 'get',
                success: async (data) => {
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(data, 'text/html');

                    // if(htmlDoc.getElementById("commands_table")==null){
                    //     alert("support coming none")
                    // }
                    if(game_data.device == "desktop"){

                        let table_commands=$(htmlDoc).find(".row_ax, .row_bx")
                        for(let i=0;i<table_commands.length;i++){
                            let commandId=table_commands[i].getElementsByClassName("own_command")[0].getAttribute("data-command-id")
                            let availableTroops={}
                            let label=table_commands[i].children[0].innerText.trim()
                            let targetBuilding="none"
                            let coord=""
    
                            // if(label.match(/[0-9]{3}\|[0-9]{3}/g)==null){
                            //     reject("all labels must contains destination coord")
                            // }
                            if(label.match(/[0-9]{3}\|[0-9]{3}/g)!=null){
                                if(label.match(/[0-9]{3}\|[0-9]{3}/g).length>0){
                                    coord = Array.from(label.match(/[0-9]{3}\|[0-9]{3}/g)).pop()
                                }
                            }
                            
                            if(!table_commands[i].getElementsByTagName("img")[0].src.includes("return")){//ignore returned commands
                                let pop_total=0
                                let pop_off=0
                                let pop_def=0
                                $(table_commands[i]).find(".unit-item").each((index,item)=>{
                                    availableTroops[units[index]]=parseInt(item.innerText)
                                    pop_total += troopsPop[units[index]] * parseInt(item.innerText)
                                    if(units[index]=="spear" || units[index]=='sword' || units[index]=="archer" || units[index]=="heavy"){
                                        pop_def+=troopsPop[units[index]] * parseInt(item.innerText)
                                    }
    
                                    if(units[index]=="axe" || units[index]=='light' || units[index]=="marcher" || units[index]=="ram" ){
                                        pop_off+=troopsPop[units[index]] * parseInt(item.innerText)
                                    }
    
                                })
                                availableTroops.pop_total=pop_total
                                availableTroops.pop_off=pop_off
                                availableTroops.pop_def=pop_def
    
                                UI.SuccessMessage(`page: ${nr_page}/ ${total_pages}`,1000)
    
                                if(show_building == true ){
                                    // console.log("show building is active")
    
                                    if(availableTroops["catapult"] > nr_cats_target){
                                        // console.log("available cats",availableTroops["catapult"])
    
    
                                        if(map_Idcommands.has(commandId)){
                                            targetBuilding=map_Idcommands.get(commandId).targetBuilding
                                            // console.log("targetBuilding (exist)",targetBuilding)
    
                                        }else{
                                            UI.SuccessMessage(`page: ${nr_page}, get building target ${i+1}/ ${table_commands.length-2}`,1000)
                                            console.log("targetBuilding",targetBuilding)
                                            targetBuilding = await ajaxCatapultTarget(commandId)
                                            let date_read=date_current+7*24*3600*1000// add a week
                                            map_Idcommands.set(commandId,{
                                                targetBuilding:targetBuilding,
                                                date_read:date_read
                                            })
                                            
                                            let data=JSON.stringify(Array.from(map_Idcommands.entries()))
                                            localStorage.setItem(game_data.world+"command_renamer_Idcommands",data)
                                        }
                                    }
                                }
    
    
    
                                rows.push({
                                    commandId:commandId,
                                    commandType:commandType,
                                    label:label,
                                    targetBuilding:targetBuilding,
                                    availableTroops:availableTroops,
                                    coord:coord,
                                    tr:table_commands[i]
                                })
                            }
    
                        }
                    }
                    else{
                        let table_commands=Array.from($(htmlDoc).find(".row_a, .row_b"))
                        for(let i=0;i<table_commands.length;i++){
                            let commandId=table_commands[i].getElementsByClassName("quickedit")[0].getAttribute("data-id")
                            let availableTroops={}
                            let label=table_commands[i].children[0].innerText.trim()
                            let targetBuilding="none"
                            let coord=""

                            if(label.match(/[0-9]{3}\|[0-9]{3}/g)!=null){
                                if(label.match(/[0-9]{3}\|[0-9]{3}/g).length>0){
                                    coord = Array.from(label.match(/[0-9]{3}\|[0-9]{3}/g)).pop()
                                }
                            }


                            let pop_total=0
                            let pop_off=0
                            let pop_def=0
                            $(table_commands[i].nextElementSibling).find(".unit-item").each((index,item)=>{
                                availableTroops[units[index]]=parseInt(item.innerText)
                                pop_total += troopsPop[units[index]] * parseInt(item.innerText)
                                if(units[index]=="spear" || units[index]=='sword' || units[index]=="archer" || units[index]=="heavy"){
                                    pop_def+=troopsPop[units[index]] * parseInt(item.innerText)
                                }

                                if(units[index]=="axe" || units[index]=='light' || units[index]=="marcher" || units[index]=="ram" ){
                                    pop_off+=troopsPop[units[index]] * parseInt(item.innerText)
                                }

                            })
                            availableTroops.pop_total=pop_total
                            availableTroops.pop_off=pop_off
                            availableTroops.pop_def=pop_def

                            UI.SuccessMessage(`page: ${nr_page}/ ${total_pages}`,1000)

                            if(show_building == true ){
                                // console.log("show building is active")

                                if(availableTroops["catapult"] > nr_cats_target){
                                    // console.log("available cats",availableTroops["catapult"])


                                    if(map_Idcommands.has(commandId)){
                                        targetBuilding=map_Idcommands.get(commandId).targetBuilding
                                        console.log("targetBuilding (exist)",targetBuilding)

                                    }else{
                                        targetBuilding = await ajaxCatapultTarget(commandId)
                                        // console.log("targetBuilding",targetBuilding)
                                        UI.SuccessMessage(`page: ${nr_page}, get building target ${i+1}/ ${table_commands.length-2}`,1000)
                                        let date_read=date_current+7*24*3600*1000// add a week
                                        map_Idcommands.set(commandId,{
                                            targetBuilding:targetBuilding,
                                            date_read:date_read
                                        })
                                        
                                        let data=JSON.stringify(Array.from(map_Idcommands.entries()))
                                        localStorage.setItem(game_data.world+"command_renamer_Idcommands",data)
                                    }
                                }
                            }



                            rows.push({
                                commandId:commandId,
                                commandType:commandType,
                                label:label,
                                targetBuilding:targetBuilding,
                                availableTroops:availableTroops,
                                coord:coord,
                                tr:table_commands[i]
                            })



                        }
                    }

                    let stop = new Date()
                    let diff = stop.getTime() - start.getTime()
                    console.log("wait: "+ diff)
                    window.setTimeout(()=>{
                        ajaxRequest (list_pages)
                    },200 - diff)

                }
            })
           
        }
        else//append all rows into table
        {
            console.log("done")
            UI.SuccessMessage("done")
            if(game_data.device == "desktop"){
                $(".row_ax").remove();
                $(".row_bx").remove();
            }else{
                Array.from($(".row_a, .row_b")).map(e=>e.nextElementSibling).forEach(elem=>elem.remove())
                $(".row_a, .row_b").remove()
            }
            resolve(rows)
        }
    }
    ajaxRequest(list_pages);
    })

}

async function start(){
    let select_command=document.getElementById("select_command").value
    let list_condition=getConditions()
    let settings_checkbox = Array.from($("#div_settings input[type=checkbox]:checked")).map(item=>item.value)
    let list_update_label=[]

    let rows = await getAllCommands().catch(e=>alert(e))

    console.log("rows",rows)
    console.log("settings_checkbox",settings_checkbox)
    console.log("list_condition",list_condition)
    console.log("select_command",select_command)

    //skip small commands (e.g. farming runs) below the minimum population
    let min_pop=getMinPop()
    rows=rows.filter(row=>row.availableTroops["pop_total"] >= min_pop)
    console.log("min_pop",min_pop,"rows left",rows.length)

    //remove all supports if offensive is selected
    if(select_command=="offensive"){
        for(let i=0;i<rows.length;i++){
            if(rows[i].commandType=="support"){
                rows.splice(i,1)
                i--;
            }
        }
    }
    //remove all attacks if offensive is selected
    if(select_command=="defensive"){
        for(let i=0;i<rows.length;i++){
            if(rows[i].commandType=="attack"){
                rows.splice(i,1)
                i--;
            }
        }
    }

    if(game_data.device == "desktop")
        document.body.innerHTML = httpGet(game_data.link_base_pure + "overview_villages&mode=commands&type=all")

    let table_commands=document.getElementById("commands_table")
    let length_columns=table_commands.getElementsByTagName("tbody")[0].children[0].children.length
    table_commands.getElementsByTagName("tbody")[0].children[1].remove();
    $(".row_ax, .row_bx").remove()





    // calculates type
    for(let i=0;i<rows.length;i++){//for every village
        let availableTroops=rows[i].availableTroops
        let type='none'


        for(let j=0;j<list_condition.length;j++){//for every condition
            let list_values=list_condition[j].list_values
            let hasType=true

            for(let k=0;k<list_values.length;k++){//for every value inside condition
                //every condition must be true for a type to be set
                if(checkCondition(list_values[k],availableTroops)==false){
                    hasType=false
                    // console.log(`condition ${j}: false`)
                }
            }
            if(hasType==true){// all conditions were true =>set type
                type=list_condition[j].type
                break
            }

        }
        rows[i].type=type
        let label=getLabel(rows[i],settings_checkbox)
        if(label!=rows[i].label){// modifiy label only if it's different from the prev label
            list_update_label.push({
                commandId:rows[i].commandId,
                label:label
            })
            // console.log(label)
            $(table_commands).append(`<tr class="nowrap row_ax"><td colspan="${length_columns}"> ${rows[i].tr.children[0].innerHTML} </td></tr>`)               
        }
        else{
            // console.log(label)
        }

    }
    table_commands.getElementsByTagName("tbody")[0].children[0].children[0].innerText="Command ("+list_update_label.length+")"
    $('.quickedit').QuickEdit({url: TribalWars.buildURL('POST', 'info_command', {ajaxaction: 'edit_own_comment', id: '__ID__'})});
    // console.log("list_update_label",list_update_label)


    //update labels
    for(let i=0;i<list_update_label.length;i++){
        let commandId=list_update_label[i].commandId
        let label=list_update_label[i].label
        await editLabel(commandId,label)
        UI.SuccessMessage(`labeled:  ${i+1}/${list_update_label.length}`)
    }

}


function checkCondition(obj_condition,availableTroops){
    let nr_troops=availableTroops[obj_condition.select_troop]

    if(obj_condition.select_operation==">"){
        // console.log(`condition: army ${obj_condition.select_troop}--> ${nr_troops} > ${obj_condition.nr_troops}`)
        return (nr_troops > obj_condition.nr_troops)?true:false
    }
    else if(obj_condition.select_operation=="<="){
        // console.log(`condition: army ${obj_condition.select_troop}--> ${nr_troops} <= ${obj_condition.nr_troops}`)
        return (nr_troops <= obj_condition.nr_troops)?true:false

    }
    else{//select_operation== "="
        // console.log(`condition: army ${obj_condition.select_troop}--> ${nr_troops} = ${obj_condition.nr_troops}`)
        return (nr_troops == obj_condition.nr_troops)?true:false
    }
}


function getLabel(obj_data, list_order){
    let result_label=""
    
    for(let i=0;i<list_order.length;i++){
        if(list_order[i]=="show_type"){
            if(obj_data.type!="NOTYPE"){
                result_label+=obj_data.type+" "
            }
        }
        else if(list_order[i]=="show_population"){
            let pop=((obj_data.availableTroops["pop_total"]/20000)*100).toFixed(1)
            result_label+=pop+"% "
        }
        else if(list_order[i]=="show_troops"){
            result_label+="("
            Object.keys(obj_data.availableTroops).forEach(key=>{
                let name=key
                let value=obj_data.availableTroops[key]
                if(name!="pop_total" && name!="pop_off" && name!="pop_def" && value > 0){
                    if(name=="noble"){
                        result_label+=`${troopsName["snob"]}:${value}, `
                    }
                    else
                        result_label+=`${troopsName[name]}:${value}, `
                }
            })
            result_label=result_label.substr(0, result_label.length-2)//eliminate the last ', '
            result_label+=") "

        }
        else if(list_order[i]=="show_building"){
            if(obj_data.targetBuilding.name!=undefined)
                result_label+=`[${obj_data.targetBuilding.name}] `
        }
        else if(list_order[i]=="show_packets"){
            if(obj_data.commandType == "support"){
                let nrPackets=(obj_data.availableTroops["pop_def"]/popPackets).toFixed(1)
                result_label+=`${troopsName["packets"]}:{${nrPackets}} `
            }
        }
    }
    result_label+=`(${obj_data.coord})`
    return result_label
}

function editLabel(commandId,new_label){
    let start=new Date().getTime()
    return new Promise((resolve,reject)=>{
        $(`.quickedit[data-id='${commandId}']`).find(".rename-icon").click()//click on the image notebook
        $(`.quickedit[data-id='${commandId}']`).find(".quickedit-edit input[type='text']").val(new_label)
        $(`.quickedit[data-id='${commandId}']`).find(".quickedit-edit input[type='button']").click()
        $(`.quickedit[data-id='${commandId}']`).parent().css("background-color","#ff8080")
        let stop=new Date().getTime()
        let diff=stop-start
        window.setTimeout(()=>{
            resolve("succes")
        },200-diff)
    })
}

function hitCountApi(){
    $.getJSON(`https://api.counterapi.dev/v1/${countNameSpace}/${countApiKey}/up`, response=>{
        console.log(`This script has been run: ${response.count} times`);
    });
    if(game_data.device !="desktop"){
        $.getJSON(`https://api.counterapi.dev/v1/${countNameSpace}/${countApiKey}_phone/up`, response=>{
            console.log(`This script has been run on mobile: ${response.count} times`);
        });
    }
 
    $.getJSON(`https://api.counterapi.dev/v1/${countNameSpace}/${countApiKey}_id2${game_data.player.id}/up`, response=>{
        if(response.count == 1){
            $.getJSON(`https://api.counterapi.dev/v1/${countNameSpace}/${countApiKey}_scriptUsers/up`, response=>{});
        }

    });

    try {
        $.getJSON(`https://api.counterapi.dev/v1/${countNameSpace}/${countApiKey}_scriptUsers`, response=>{
            console.log(`Total number of users: ${response.count}`);
        }); 
      
    } catch (error) {}

}


function insertJqueryTouch(){
    return new Promise((resolve,reject)=>{

        let start=new Date().getTime()
        let script = document.createElement('script');
        script.type="text/javascript"
        script.src="https://dl.dropboxusercontent.com/s/86e4fmk8754iwn3/jqueryTouch.js?dl=0"
        script.onload = function () {
            let stop=new Date().getTime()
            console.log(`insert idb library in ${stop-start} ms`)
            resolve("insert library")
        };
        document.getElementsByTagName("head")[0].appendChild(script);
    })
}

function tt(string) {
	var gameLocale = game_data.locale;

	if (translations[gameLocale] != undefined) {
		return translations[gameLocale][string];
	} else {
		return translations["en_DK"][string];
	}
}