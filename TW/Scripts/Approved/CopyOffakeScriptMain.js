var dropboxToken="",databaseName="",worldNumber="",adminBoss=""
var filename_ally,filename_admin,filename_fakes1,filename_fakes2,filename_fakes3,filename_fakes4,filename_fakes5,filename_fakes6,filename_fakes7,filename_fakes8,filename_fakes9,filename_fakes10

var units=game_data.units;
var unitsLength=units.length;
if(units.includes("snob"))
    unitsLength--;
if(units.includes("militia"))
    unitsLength--;
if(units.includes("knight"))
    unitsLength--;
  
var nrTabs=10;
 
var troupesPop = {
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
};
 

var speedWorld=getSpeedConstant().worldSpeed;
var speedTroupes=getSpeedConstant().unitSpeed;
var nobleSpeed=2100*1000/(speedWorld*speedTroupes)//ms
var ramSpeed=1800*1000/(speedWorld*speedTroupes)//ms
var swordSpeed=1320*1000/(speedWorld*speedTroupes)//ms
var axeSpeed=1080*1000/(speedWorld*speedTroupes)//ms
var lightSpeed=600*1000/(speedWorld*speedTroupes)//ms
var scoutSpeed=540*1000/(speedWorld*speedTroupes)//ms


var countApiKey = "fakeScriptInterface";
var countNameSpace="madalinoTribalWarsScripts"


var headerWood="#001a33"
var headerWoodEven="#002e5a"
var headerStone="#3b3b00"
var headerStoneEven="#626200"
var headerIron="#1e003b"
var headerIronEven="#3c0076"


var defaultTheme= '[["theme1",["#E0E0E0","#000000","#C5979D","#2B193D","#2C365E","#484D6D","#4B8F8C","50"]],["currentTheme","theme1"],["theme2",["#E0E0E0","#000000","#F76F8E","#113537","#37505C","#445552","#294D4A","50"]],["theme3",["#E0E0E0","#000000","#ACFCD9","#190933","#665687","#7C77B9","#623B5A","50"]],["theme4",["#E0E0E0","#000000","#181F1C","#60712F","#274029","#315C2B","#214F4B","50"]],["theme5",["#E0E0E0","#000000","#9AD1D4","#007EA7","#003249","#1F5673","#1C448E","50"]],["theme6",["#E0E0E0","#000000","#EA8C55","#81171B","#540804","#710627","#9E1946","50"]],["theme7",["#E0E0E0","#000000","#754043","#37423D","#171614","#3A2618","#523A34","50"]],["theme8",["#E0E0E0","#000000","#9E0031","#8E0045","#44001A","#600047","#770058","50"]],["theme9",["#E0E0E0","#000000","#C1BDB3","#5F5B6B","#323031","#3D3B3C","#575366","50"]],["theme10",["#E0E0E0","#000000","#E6BCCD","#29274C","#012A36","#14453D","#7E52A0","50"]]]'
var localStorageThemeName = "fakesTheme"
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
var localStorageThemeName = "fakesTheme"
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


var nrTroopSelect=13
var list_filename_fakes


var dropbox_admin,dropbox_ally
var loginAlly,loginAdmin
(async () => {
    dropbox_admin= await getAdmin()
    dropbox_ally= await getAlly()


    filename_ally=`${databaseName}/ally.txt`
    filename_admin=`${databaseName}/admin.txt`

    filename_fakes1=`${databaseName}/fakes1.txt`
    filename_fakes2=`${databaseName}/fakes2.txt`
    filename_fakes3=`${databaseName}/fakes3.txt`
    filename_fakes4=`${databaseName}/fakes4.txt`
    filename_fakes5=`${databaseName}/fakes5.txt`
    filename_fakes6=`${databaseName}/fakes6.txt`
    filename_fakes7=`${databaseName}/fakes7.txt`
    filename_fakes8=`${databaseName}/fakes8.txt`
    filename_fakes9=`${databaseName}/fakes9.txt`
    filename_fakes10=`${databaseName}/fakes10.txt`
    list_filename_fakes=[filename_fakes1, filename_fakes2, filename_fakes3, filename_fakes4, filename_fakes5, filename_fakes6,filename_fakes7,filename_fakes8,filename_fakes9,filename_fakes10]
    // console.log("adminBOss: "+adminBoss + " == "+game_data.player.id.toString())
    // console.log("runWorld: "+runWorld)
    loginAlly=JSON.parse((dropbox_ally=="")?"[]":dropbox_ally ).map(e=>{return e.allyId})
    loginAdmin=JSON.parse((dropbox_admin=="")?"[]":dropbox_admin ).map(e=>{return e.adminId})

    if(!((loginAlly.includes(game_data.player.ally)==true || game_data.player.id.toString()==adminBoss ) && game_data.world.match(/\d+/)[0]==runWorld)){
        UI.ErrorMessage("you don't have access")
        throw new Error("you don't have access");
    }
    
    
    checkPageRun()
    main()
})();





async function main(){
    initializationTheme()
    let status = await $.getScript("https://dl.dropboxusercontent.com/s/i5c0so9hwsizogm/styleCSSGlobal.js?dl=0");
    

    hitCountApi()
    createMainInterface()
    changeTheme()
    addEventPanel();
    addNewPanel();
    getCoordsEvent();
    initializationOwnTabs()
    saveNrFakes();
    initializationNrFakes()
    initializationTroupes()
    initializationOptionAttack();
    getCoordDropbox()
    getFakeLimit()
    
    

    if(((loginAdmin.includes(game_data.player.id.toString())==true || game_data.player.id.toString()==adminBoss) &&  game_data.world.match(/\d+/)[0]==runWorld)){
        $("#div_ally").show()
        $("#div_ally").on("mouseup",()=>{
            adminInterfaceAlly()
            $("#div_ally").off("mouseup")
        })

        $("#div_admin").show()
        $("#div_admin").on("mouseup",()=>{
            adminInterface()
            $("#div_admin").off("mouseup")
        })
    }
    if(((loginAdmin.includes(game_data.player.id.toString())==true || game_data.player.id.toString()==adminBoss) &&  game_data.world.match(/\d+/)[0]==runWorld)){
        saveCoordDropbox();
    }

}



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




function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
 


//////////////////////////////////////////////////////////// interface /////////////////////////////////////////////////////////
async function createMainInterface(){
    let fakeLimit=getFakeLimit()
    console.log("createInterface")

    html = `
    <div id="div_container" class="scriptContainer" >
        <div class="scriptHeader">
            <div style=" margin-top:10px;"><h2>Fakes/Nukes/Fangs Script</h2></div>
            <div style="position:absolute;top:10px;right: 10px;"><a href="#" onclick="$('#div_container').remove()"><img src="https://img.icons8.com/emoji/24/000000/cross-mark-button-emoji.png"/></a></div>
            <div style="position:absolute;top:8px;right: 35px;" id="div_minimize"><a href="#"><img src="https://img.icons8.com/plasticine/28/000000/minimize-window.png"/></a></div>
            <div style="position:absolute;top:10px;right: 60px;" id="div_theme"><a href="#" onclick="$('#theme_settings').toggle()"><img src="https://img.icons8.com/material-sharp/24/fa314a/change-theme.png"/></a></div>
            <div class="close-btn" id="page_admin"  style="position:absolute;top:10px;left: 10px;">
                <div style="background-color:white" id="div_ally" hidden>
                    <b><a href=#><img src="https://img.icons8.com/emoji/16/000000/plus-emoji.png" onclick="$('#table_admin2').hide();"/></a></b>
                </div>
            </div>
            <div class="close-btn" id="page_admin2"  style="position:absolute;top:10px;left: 40px;">
                <div style="background-color:white" id="div_admin" hidden>
                    <b><a href=#><img src="https://img.icons8.com/emoji/16/000000/plus-emoji.png" onclick="$('#table_admin').hide();"/></a></b>
                </div>
            </div> 

            <div style="margin:0px;position:absolute;top:10px;left: 70px;" class="set_troops">
                <select  id="select_type_attack">
                    <option value="fakes">fakes</option>
                    <option value="nukes">nukes</option>
                    <option value="fangs">fangs</option>
                </select>
            </div>       
        </div>
        <div id="theme_settings"></div>

        <div id="div_body" style="height: 750px; overflow-y: auto">
        <br>
            <p style="color:#ff4d4d" id="update_message">Generate a new script by the end of this month using the script generator from TW forum , this script may stop working</p>

            <div id="div_admin_show">
            </div>
            <br>


        <table id="table_upload" class="scriptTable"> 
        <tr>
            <td></td>`;
    for(let i=0;i<units.length;i++){
    if(units[i]!="militia" && units[i]!="snob"){
            html+=`<td class="fm_unit hide_${units[i]}"><img src="https://dsen.innogamescdn.com/asset/1d2499b/graphic/unit/unit_${units[i]}.png"></td>`
        }
    }
    //create select for fakes
    html+=`</tr>
            <tr id="allSelectTroupes" class="set_troops hide_fakes">
                <td>send</td>`
    for(let i=0;i<units.length;i++){
        if(units[i]!="militia" && units[i]!="snob"){
            html+=`
                <td class="hide_${units[i]}">
                    <select id="${units[i]}Troupe" class='allTroupes' >
                        <option value="min" >min</option>`
                        for(let j=0;j<nrTroopSelect;j++){
                            html+=`<option value="${j}">${j}</option>
                            `
                        }
                    `</select>
                </td>`       
              
        }
    }     

    html+=`
            </tr>
                <tr class="set_troops hide_fakes" >
                <td colspan="6">fakes per village (only if interval time is on)</td>
                <td colspan="3">
                    <input class="scriptInput" type="number" id="nr_fakes_per_village" placeholder="5" value="5">
                </td>   
            </tr>



            <tr class="set_troops hide_fakes">
                <td colspan="3">
                <input type="checkbox"  value="land_specific"><font color="${textColor}"> attacks land between:</font>
                </td>
                <td colspan="3">
                <input type="datetime-local" class="start_window" style="text-align:center;" >
                </td>   
                <td colspan="3">
                <input type="datetime-local" class="stop_window" style="text-align:center;" >
                </td>   
            </tr>
    `

    //create inputs for nukes   
    html+=`<tr hidden> </tr>
            <tr class="set_troops hide_nukes allinputTroops" >
                <td>send</td>`
            
    for(let i=0;i<units.length;i++){
        if( units[i]!="militia" && units[i]!="snob"){
            html+=`
                <td  class="hide_${units[i]}">
                    <input class="scriptInput" type="number" placeholder="0" value="0">
                </td>`
        
        }
    }        
    html+=`</tr>
            <tr class="set_troops hide_nukes allinputTroopsRes">
                <td>reserve</td>`
    for(let i=0;i<units.length;i++){
        if(units[i]!="militia" && units[i]!="snob"){
            html+=`
                <td class="hide_${units[i]}">
                    <input class="scriptInput" type="number"  placeholder="0" value="0">
                </td>`
        
        }
    }   
    html+=`
            </tr>
                <tr class="set_troops hide_nukes" >
                <td colspan="5">min population(nukes/fangs only)</td>
                <td colspan="4">
                    <input class="scriptInput min_pop" type="number"  placeholder="500" value="500">
                </td>   
            </tr>

            <tr class="set_troops hide_nukes">
                <td colspan="3">
                <input type="checkbox"  value="land_specific"><font color="${textColor}"> attacks land between:</font>
                </td>
                <td colspan="3">
                <input type="datetime-local" class="start_window" style="text-align:center;" >
                </td>   
                <td colspan="3">
                <input type="datetime-local" class="stop_window" style="text-align:center;" >
                </td>   
            </tr>
    
    `
    //create inputs for fangs
    html+=`</tr >
    <tr class="set_troops hide_fangs allinputTroops" >
        <td>send</td>`
    
    for(let i=0;i<units.length;i++){
        if( units[i]!="militia" && units[i]!="snob"){
            html+=`
            <td align='center' class="hide_${units[i]}">
                <input class="scriptInput" type="number" placeholder="0" value="0">
            </td>`
        }
    }        
    html+=`</tr>
        <tr class="set_troops hide_fangs allinputTroopsRes">
            <td>reserve</td>`
    for(let i=0;i<units.length;i++){
        if(units[i]!="militia" && units[i]!="snob"){
            html+=`
            <td class="hide_${units[i]}">
                <input class="scriptInput" type="number" placeholder="0" value="0">
            </td>`
        }
    }  
    



    html+=`
        <tr class="set_troops hide_fangs" >
            <td colspan="5">min population(nukes/fangs only)</td>
            <td colspan="4">
                <input class="scriptInput min_pop" type="number"  placeholder="500" value="500">
            </td>   
        </tr>
        <tr class="set_troops hide_fangs">
            <td colspan="3">
               <input type="checkbox"  value="land_specific"><font color="${textColor}"> attacks land between:</font>
            </td>
            <td colspan="3">
               <input type="datetime-local" class="start_window" style="text-align:center;" >
            </td>   
            <td colspan="3">
               <input type="datetime-local" class="stop_window" style="text-align:center;" >
            </td>   
        </tr>
    </table>
    <br>

    `



        
    //create panels
    html+=`   

        <div class="tab-panels" id="tabs_coord" >
            <ul class="tabs">
                <li class="update_tab own active" rel="panel${nrTabs}" ><font >panel${nrTabs} </font > <img class="remove_tab" src="https://img.icons8.com/doodle/16/000000/delete-sign.png"/>  </li>
                <li id="add_tab"><img src="https://img.icons8.com/color/16/000000/add-tab.png"/> </li>
            </ul>
        
            <div id="all_tabs">`
    for(let i=0;i<nrTabs;i++){
        html+=`
        <div id="panel${i}" class="panel">
            <p style="color:${textColor};font-weight: bold;">saved by player on date</p>
            <p style="color:${textColor};font-weight: bold;">nr coords:</p>
            <center style="margin:5px"><textarea class="scriptInput" rows="10">panelTribe${i}</textarea></center>`
            // console.log("adminBoss: "+adminBoss + " == "+ game_data.player.id.toString())
            // console.log("nr: "+ game_data.world+ " == " + runWorld)
            if(((loginAdmin.includes(game_data.player.id.toString())==true || game_data.player.id.toString()==adminBoss) && game_data.world.match(/\d+/)[0]==runWorld)){
                
                html+=`<center style="margin:5px">
                        <input class="btn evt-confirm-btn btn-confirm-yes" type="button"  value="Save">
                        <input class="btn evt-confirm-btn btn-confirm-yes coord_grabber" type="button"   value="Coord grabber">
                        <select class="select_get_coord">
                            <option value="dropbox">dropbox</option>
                            <option value="coordGrabber">coordGrabber</option>
                        </select>
                    </center>`
            }
            else{
                html+=`<center style="margin:5px" hidden>
                <input class="btn evt-confirm-btn btn-confirm-yes" type="button"  value="Save">
                <input class="btn evt-confirm-btn btn-confirm-yes coord_grabber" type="button"   value="Coord grabber">
                <select class="select_get_coord">
                    <option value="dropbox">dropbox</option>
                    <option value="coordGrabber">coordGrabber</option>
                </select>
            </center>`
            }
        html+='</div>'
    }
    html+=`    <div id="div_get_coords" style="margin:10px" hidden> </div>`
    html+=`
        <div id="panel${nrTabs}" class="panel own active">
            <p style="color:${textColor};font-weight: bold;">nr coords:</p>
            <center style="margin:5px"><textarea class="scriptInput" rows="10">panel${nrTabs}</textarea><center>
        </div>
        </div>

        <ul class="tabs">`

    for(let i=0;i<nrTabs;i++){
        html+=`<li class="li_tribe" rel="panel${i}" ><font>panelTribe${i}</font></li>`
    }


    html+=`</ul>

                <br>
                <table class="scriptTableAlternate" style="width:95%">
                    <tr hidden><tr>
                    <tr >
                        <td class="hide_fakes">nr fakes:</td>
                        <td class="hide_fakes"><input class="scriptInput" id="nr_fakes" type="number" value="1"></td>
                        <td class="hide_fakes"></td>
                        <td class="hide_fakes"></td>
                    </tr>
                    <tr >
                        <td>split tabs:</td>
                        <td><input class="scriptInput" id="nr_split" type="number" value="20"></td>
                        <td>                
                        <select id="select_option_fakes" >
                            <option value="open tabs">open tabs</option>
                            <option value="go to rally">go to rally</option>
                        </select>  
                    </td >
                    <td><input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_start" onclick="startFakes()" value="Start"></td>
                    <td class="hide_btn_show" hidden><input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_show" value="Show" ></td>
                    <td class="hide_btn_delete" hidden><input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_delete" value="Delete" ></td>
                    </tr>
                    <tr >
                        <td>delay open tabs[ms]:</td>
                        <td><input class="scriptInput" id="delay_tabs" type="number" value="200"></td>
                        <td></td>
                        <td></td>
                    </tr>
                    </table>

                <div id="div_open_tabs" >
                    <h2 id="h2_tabs"><center style="margin:10px"><u><font color="${textColor}">Open Tabs</font></u></center></h2>
                </div>
            </div>
        </div>
        <div class="scriptFooter">
            <div style=" margin-top:5px;"><h5>made by Costache</h5></div>
        </div>
    </div>

    `;
    ////////////////////////////////////////add and remove window from page///////////////////////////////////////////



    $("#div_container").remove()
    $("#contentContainer").eq(0).prepend(html);
    $("#mobileContent").eq(0).prepend(html);

    
    $("#div_container").css("position","fixed");
    $("#div_container").draggable();
    

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
    //disable selects if fake limit is off
    if(fakeLimit==0){
        for(let i=0;i<units.length;i++){
            if(units[i]!="spy" && units[i]!="ram" && units[i]!="catapult"){
                // console.log($(`${units[i]}Troupe`))
                $(`#${units[i]}Troupe`).attr("disabled", true);
            }
        }
    }
    let select_type=document.getElementById("select_type_attack").value
    if(select_type == "fakes" && localStorage.getItem(game_data.world+"troopTemplatesFakes")==null){
        $(".hide_nukes").hide()
        $(".hide_fangs").hide()
        $(".hide_knight").hide()
        $(".hide_snob").hide()
    }
    if($(".coord_grabber").length>0){
        $(".coord_grabber").on("click",()=>{
            createTableGetCoords()
        })
        createTableGetCoords()
    }
    if(databaseName.split("/").length > 2){
        $("#update_message").hide()
    }

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

        backgroundAlternateTableEven=backgroundContainer;
        backgroundAlternateTableOdd=getColorDarker(backgroundContainer,headerColorAlternateTable);  
    }

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
        console.log(response)
        if(response.count == 1){
            console.log("here")
            $.getJSON(`https://api.counterapi.dev/v1/${countNameSpace}/${countApiKey}_scriptUsers/up`, response=>{});
        }

    });

    try {
        $.getJSON(`https://api.counterapi.dev/v1/${countNameSpace}/${countApiKey}_scriptUsers`, response=>{
            console.log(`Total number of users: ${response.count}`);
        }); 
      
    } catch (error) {}

}



///////////////////////////////////////////////////////////get admins from dropbox////////////////////////////////////
async function getAdmin(){
    await insertCryptoLibrary();
    var decrypted = CryptoJS.AES.decrypt(encryptedData, "automateThisAnnoyingPart");
    decrypted =decrypted.toString(CryptoJS.enc.Utf8);
    // console.log(decrypted)
    new Function(decrypted)()

    var filename_admin=`${databaseName}/admin.txt`;


    return new Promise((solve,reject)=>{
        $.ajax({
            url: "https://content.dropboxapi.com/2/files/download",
            method: 'POST',
            dataType: "text",
            async: false,
            headers: { 'Authorization': 'Bearer ' + dropboxToken,
                        'Dropbox-API-Arg': JSON.stringify({path: "/"+filename_admin})},
            
            success: (data) => {
                data = data.replace(/</g, "").replace(/>/g, "")
                solve(data)
                
            },error:(err)=>{
                alert(err)
                reject(err)
            }
        })
    })
}



function insertCryptoLibrary(){
    return new Promise((resolve,reject)=>{

        let start=new Date().getTime()
        let script = document.createElement('script');
        script.type="text/javascript"
        script.src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.2/rollups/aes.js"
        script.onload = function () {
            let stop=new Date().getTime()
            console.log(`insert crypto-js library in ${stop-start} ms`)
            resolve("done")
        };
        document.head.appendChild(script);
    })
}



///////////////////////////////////////////////////////////get ally from dropbox////////////////////////////////////
function getAlly(){
    let filename_ally =`${databaseName}/ally.txt`
    return new Promise((solve,reject)=>{
        $.ajax({
            url: "https://content.dropboxapi.com/2/files/download",
            method: 'POST',
            dataType: "text",
            async: false,
            headers: { 'Authorization': 'Bearer ' + dropboxToken,
                        'Dropbox-API-Arg': JSON.stringify({path: "/"+filename_ally})},
            
            success: (data) => {
                data = data.replace(/</g, "").replace(/>/g, "")
                solve(data)
                
            },error:(err)=>{
                alert(err)
                reject(err)
            }
        })
    })
}



///////////////////////////////////////////////////events for interface tribes///////////////////////////////////////////////
function adminInterfaceAlly(){
    $(document).ready(async function() { 
        let infoVillages = await getInfoVIllages();
        let set = new Set()
        let map_tribe = new Map()
        Array.from(infoVillages.keys()).forEach(key=>{
            let obj = infoVillages.get(key)
            set.add(obj.tribeName.toLowerCase())
            map_tribe.set(obj.tribeName.toLowerCase(), obj.allyId)
        })


        let admin=true;
        let ally_tribe=JSON.parse((dropbox_ally=="")?"[]":dropbox_ally )
        let dataTribes=Array.from(set)
     

        if(admin){
            let page_admin=document.getElementById("page_admin")
            let htmlTable= `
            <div id="table_admin">
            <table  class="scriptTable" >
                <tr>
                    <td colspan="2" >ally tribes</td>
                    <td  colspan="2">remove ally</td> 
                </tr>`
            
            for(let i=0;i<ally_tribe.length;i++){
                htmlTable+=`        
                <tr>    
                    <td colspan="2"><font class="all_ally"color="${textColor}">${ally_tribe[i].name} </font></td>
                    <td colspan="2">
                        <input class="btn evt-confirm-btn btn-confirm-yes" type="button" onclick='$(this).closest("tr").remove()' value="remove">
                    </td>  
                </tr>
                `
            }
            htmlTable+=`
                <tr>    
                    <td colspan="2">
                        <input class="scriptInput" type="text" id="name_tribe" placeholder="name tribe" >
                    </td>
    
                    <td colspan="2">
                        <input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_add" value="add">
                    </td>  
                </tr>
    
    
                </table>
                <center style="margin:5px"><input class="btn evt-confirm-btn btn-confirm-yes" id='btn_save_ally' type="button"  value="Save"></center>
                </div>
            ` 

            $("#div_admin_show").append(htmlTable)
            $("#table_admin").hide();
            $("#table_admin2").hide();
            $("#page_admin").on("click",()=>{
                $("#table_admin").toggle(300)
            })
    
            autocomplete(document.getElementById("name_tribe"),dataTribes)




            
            // upload in dropbox
            document.getElementById("btn_save_ally").addEventListener("click",function(){
                let ally=document.getElementsByClassName("all_ally")
                let list_ally=[]
                for(let i=0;i<ally.length;i++){
                    list_ally.push({
                        name:ally[i].innerText.toLowerCase(),
                        allyId:map_tribe.get(ally[i].innerText)
                    })
                }
                uploadFile(JSON.stringify(list_ally),filename_ally,dropboxToken)
                console.log(list_ally)
            })

            document.getElementById("btn_add").addEventListener("click",function(){
                let name_tribe=document.getElementById("name_tribe").value.toLowerCase()

                if(map_tribe.has(name_tribe)){
                    let table=document.getElementById("table_admin").getElementsByTagName("table")[0]
                    let tr=table.getElementsByTagName("tr")
                    let exist=false;
                    for(let i=1;i<tr.length-1;i++){
                        console.log(tr[i].innerText.includes(name_tribe))
                        if(tr[i].innerText.includes(name_tribe)){
                            exist=true;
                            break;
                        }
                    }
                    if(exist==false){
                        let newTr=document.createElement("tr")
                        newTr.innerHTML=`
                        <td colspan="2"><font class="all_ally"color="${textColor}">${name_tribe} </font></td>
                        <td colspan="2"><input class="btn evt-confirm-btn btn-confirm-yes" type="button" onclick='$(this).closest("tr").remove()' value="remove"></td> `
                        console.log(newTr)
                        let addTr=table.insertRow(tr.length-1)
                        addTr.innerHTML=newTr.innerHTML
                    }
                    else{
                        UI.ErrorMessage("this tribe already exist1",1000)
                    }
                }else{
                    UI.ErrorMessage("this tribe doesn't exist2",1000)
                }
            })
        

            
        }
        
    });

}
/////////////////////////////////////////////////events for interface admin/////////////////////////////////////////////
function adminInterface(){
$(document).ready(async function() {
    
    let infoVillages = await getInfoVIllages();
    let set = new Set()
    let map_tribe = new Map()
    Array.from(infoVillages.keys()).forEach(key=>{
        let obj = infoVillages.get(key)
        set.add(obj.playerName.toLowerCase())
        map_tribe.set(obj.playerName.toLowerCase(), obj.playerId)
    })


    let admin=true;
    let admin_tribe=JSON.parse((dropbox_admin=="")?"[]":dropbox_admin )
    let dataTribes=Array.from(set)

  
    console.log("AICI ba admin")
    console.log(dataTribes)
    console.log(map_tribe)

    if(admin){
        let page_admin=document.getElementById("page_admin2")
        let htmlTable= `
        <div id="table_admin2">
        <table  class="scriptTable" >
        <tr>
            <td colspan="2" >admins</td>
            <td  colspan="2">remove admin</td> 
        </tr>`
        
        for(let i=0;i<admin_tribe.length;i++){
            htmlTable+=`        
            <tr>    
                <td colspan="2"><font class="all_admin"color="${textColor}">${admin_tribe[i].name} </font></td>

                <td colspan="2">
                    <input class="btn evt-confirm-btn btn-confirm-yes" type="button" onclick='$(this).closest("tr").remove()' value="remove">
                </td>  
            </tr>
            `
        }
        htmlTable+=`
            <tr>    
            <td colspan="2" >
                <input class="scriptInput" id="name_admin" placeholder="name player">
            </td>
            <td colspan="2">
                <input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_add_admin" value="add">
            </td>  
            </tr>


            </table>
            <center style="margin:5px"><input class="btn evt-confirm-btn btn-confirm-yes" id='btn_save_admin' type="button"  value="Save"></center>
            </div>
        ` 

        $("#div_admin_show").append(htmlTable)
        $("#table_admin2").hide();
        $("#page_admin2").on("click",()=>{
            $("#table_admin2").toggle(300)
        })

        autocomplete(document.getElementById("name_admin"),dataTribes)




        
        // upload in dropbox
        document.getElementById("btn_save_admin").addEventListener("click",function(){
            let admin=document.getElementsByClassName("all_admin")
            let list_admin=[]
            for(let i=0;i<admin.length;i++){
                list_admin.push({
                    name:admin[i].innerText.toLowerCase(),
                    adminId:map_tribe.get(admin[i].innerText)
                })
            }
            uploadFile(JSON.stringify(list_admin),filename_admin,dropboxToken)
            console.log(list_admin)
        })

        document.getElementById("btn_add_admin").addEventListener("click",function(){
            let name_admin=document.getElementById("name_admin").value.toLowerCase()

            if(map_tribe.has(name_admin)){
                let table=document.getElementById("table_admin2").getElementsByTagName("table")[0]
                let tr=table.getElementsByTagName("tr")
                let exist=false;
                for(let i=1;i<tr.length-1;i++){
                    console.log(tr[i].innerText.includes(name_admin))
                    if(tr[i].innerText.includes(name_admin)){
                        exist=true;
                        break;
                    }
                }
                if(exist==false){
                    let newTr=document.createElement("tr")
                    newTr.innerHTML=`
                    <td colspan="2"><font class="all_admin"color="${textColor}">${name_admin} </font></td>
                    <td colspan="2"><input class="btn evt-confirm-btn btn-confirm-yes" type="button" onclick='$(this).closest("tr").remove()' value="remove"></td> `
                    console.log(newTr)
                    let addTr=table.insertRow(tr.length-1)
                    addTr.innerHTML=newTr.innerHTML
                }
                else{
                    UI.ErrorMessage("this player already exist",1000)
                }
            }else{
                UI.ErrorMessage("this player doesn't exist",1000)
            }
        })
    

        
    }
    
});

}




function addEventPanel(){
    $('.tab-panels .tabs li').each((index,item)=>{
        // console.log(item.id)
        if(item.id!="add_tab"){
            $(item).off("click")
        }
    })
    $('.tab-panels .tabs li').not("#add_tab").on('click', function(event) {
        // console.log("addEventPanel")
        if(event.target.src==undefined){
            // console.log("inside if")
            if($(this).hasClass("active")==false ){

                var $panel = $(this).closest('.tab-panels');
                $panel.find('.tabs li.active').removeClass('active');
                $(this).addClass('active');
        
                //figure out which panel to show
                var panelToShow = $(this).attr('rel');
                if(panelToShow!=undefined){
                    //hide current panel
                    $panel.find('.panel.active').slideUp(300, showNextPanel);
            
                    //show next panel
                    function showNextPanel() {
                        $(this).removeClass('active');
            
                        $('#'+panelToShow).slideDown(300, function() {
                            $(this).addClass('active');
                        });
                    }
                }
            }
            else{
                let value=window.prompt("change name tab")
                // console.log(value)
                if(value!="" && value!=null){
                    // console.log(this)
                    if(this.children.length>0)
                        this.children[0].innerText=value
                    else
                        this.innerText=value
                    saveOwnData();
                }
            }
        }

    });
}

function addNewPanel(){
    $("#add_tab").on("click",function(){
        
        let idNewPanel=parseInt($(".tabs").eq(0).find("li").last().prev().attr("rel").replace("panel",""))+1
        let htmlLI=`<li class="update_tab own" rel="panel${idNewPanel}"> <font> panel${idNewPanel}</font> <img class="remove_tab" src="https://img.icons8.com/doodle/16/000000/delete-sign.png"/> </li>`;
        $("#add_tab").before(htmlLI);

        let htmlDIV=`
        <div id="panel`+idNewPanel+`" class="panel">
            <p style="color:${textColor};font-weight: bold;">nr coords:</p>
            <center style="margin:5px"><textarea id="input_coord${idNewPanel}" class="scriptInput" rows="10">panel${idNewPanel}</textarea><center>
        </div>`

        $("#all_tabs").append(htmlDIV)
        addEventPanel();
        removePanel()
        getCoordsEvent();
    })
}


function removePanel(){
    $('.remove_tab').off('click');
    $(".remove_tab").on("click",function(){
        var confirm=window.confirm("are you sure?")
        if(confirm==true && $('.remove_tab').length>1){
            let removePanel=$(this).parent().attr('rel')
            $(this).parent().remove();
            $("#"+removePanel).remove();
    
            if($(".active").length==0){
                let lastTab=$(".update_tab").last()
                lastTab.addClass("active");
                let panelId=lastTab.attr("rel")
                $("#"+panelId).addClass("active");
                $("#"+panelId).slideDown(300);
            }
        }

    })
}
////////////////////////////////////////////////// save and set data /////////////////////////////////////////////////////////////
function getCoordsEvent(){
    console.log("getCoordEvent")
    $("#all_tabs .panel").off("mouseout");
    $("#all_tabs .panel").mouseout(function(){
        let current_value=this.getElementsByTagName("textarea")[0].value
        if(current_value.match(/\d+\|\d+/)!=null){
            let coords=current_value.match(/\d+\|\d+/g)
            this.getElementsByTagName("textarea")[0].value=Array.from(coords).join(" ")
            $(this).find("p").last().text("nr coords: "+coords.length)
        }
        saveOwnData();
    })
}



function saveOwnData(){
    // console.log("save coords")
    let name_tabs=$(".tabs").eq(0).find(".own")
    let textarea_tabs=$("#all_tabs").eq(0).find(".own").find("textarea")
    let listInfoTabs=[];
    for(let i=0;i<name_tabs.length;i++){
        let objInfo={};
        objInfo.name=name_tabs.eq(i).text().trim()
        if(textarea_tabs.eq(i).val()!=undefined)
            objInfo.coords=textarea_tabs.eq(i).val();
        else
            objInfo.coords="add coords"
        listInfoTabs.push(objInfo)
    }
    // console.log(listInfoTabs)
    localStorage.setItem(game_data.world+"ownTabs",JSON.stringify(listInfoTabs))

}

function initializationOwnTabs(){
    var listInfoTabs=JSON.parse(localStorage.getItem(game_data.world+"ownTabs"))

    if(listInfoTabs.length>0){
    for(let i=0;i<listInfoTabs.length;i++){
            let idNewPanel=parseInt($(".tabs").eq(0).find("li").last().prev().attr("rel").replace("panel",""))+1
            let htmlLI=`<li class="update_tab own" rel="panel${idNewPanel}"> <font> ${listInfoTabs[i].name} </font> <img class="remove_tab" src="https://img.icons8.com/doodle/16/000000/delete-sign.png"/> </li>`;
            $("#add_tab").before(htmlLI);
            let coords=""

            if(listInfoTabs[i].coords!="undefined")
                coords=listInfoTabs[i].coords
            let nrCoords=0;
            if(coords!=undefined)
                if(coords.split(" ")[0]!="")  
                    nrCoords=coords.split(" ").length
            let htmlDIV=`
            <div id="panel${idNewPanel}" class="panel own">
                <p style="color:${textColor};font-weight: bold;">nr coords: ${nrCoords}</p>
                <center style="margin:5px"><textarea class="scriptInput" rows="10">${coords}</textarea><center>
            </div>`

            $("#all_tabs").append(htmlDIV)
        } 
        //remove first own tab
        document.getElementsByClassName("tabs")[0].firstElementChild.remove();
        document.getElementById("all_tabs").getElementsByClassName("active")[0].remove();
        //active last own tab
        document.getElementsByClassName("tabs")[0].lastElementChild.previousSibling.classList.add("active")
        document.getElementById("all_tabs").lastElementChild.classList.add("active")
    }
    console.log("initialization!")
    addEventPanel();
    removePanel()
    getCoordsEvent();
    document.querySelectorAll(".scriptInput").forEach(function(box, index){
        // console.log(box)
        box.style.width = "100%";
    })
      document.querySelectorAll(".scriptInput").forEach(function(box, index){
        // console.log(box)
        box.classList.add()
    })
}


function saveNrFakes(){
    let inputFakes=document.getElementById("nr_fakes")
    let inputSplit=document.getElementById("nr_split")
    let inputDelay=document.getElementById("delay_tabs")
    inputFakes.addEventListener("mouseout",()=>{
        // console.log()
        if(inputFakes.value<0 || inputFakes.value=="")
            inputFakes.value=1;
        localStorage.setItem(game_data.world+"nr_fakes",inputFakes.value)
    })
    inputSplit.addEventListener("mouseout",()=>{
        // console.log(inputSplit.value)
        if(inputSplit.value<0 || inputSplit.value=="")
            inputSplit.value=5;
        localStorage.setItem(game_data.world+"nr_split",inputSplit.value)
    })
    inputDelay.addEventListener("mouseout",()=>{
        // console.log(inputDelay.value)
        if(inputDelay.value<200 || inputDelay.value=="")
            inputDelay.value=200;
        localStorage.setItem(game_data.world+"delay_tabs",inputDelay.value)
    })
    
}

function initializationNrFakes(){
    let nrFakes=localStorage.getItem(game_data.world+"nr_fakes")
    let nrSplit=localStorage.getItem(game_data.world+"nr_split")
    let nrDelay=localStorage.getItem(game_data.world+"delay_tabs")
    if(nrFakes!=undefined){
        document.getElementById("nr_fakes").value=nrFakes
    }
    if(nrSplit!=undefined){
        document.getElementById("nr_split").value=nrSplit
    }
    if(nrSplit!=undefined){
        document.getElementById("delay_tabs").value=nrDelay
    }
}



function initializationTroupes(){
    localStorage.removeItem(game_data.world+"troopTemplate")//old variable

    if(localStorage.getItem(game_data.world+"troopTemplatesFakes")!=null ){
        //initialize checkbox
        let list_checkbox=JSON.parse(localStorage.getItem(game_data.world+"troopTemplatesFakes"))[0]
        $('.set_troops input[type=checkbox]').each(function (index,elem) {
            this.checked=list_checkbox[index]
            // console.log(elem.value)
        });
        //initialize dropdown
        let list_select=JSON.parse(localStorage.getItem(game_data.world+"troopTemplatesFakes"))[1]
        $('.set_troops select').each(function (index,elem) {
            this.value=list_select[index]
            // console.log(elem.value)
        });

        //initialize input numbers
        let list_input=JSON.parse(localStorage.getItem(game_data.world+"troopTemplatesFakes"))[2]
        $('.set_troops input[type=number]').each(function (index,elem) {
            // console.log(elem)
            this.value=list_input[index]
        });
        //initialize input datetime-local
        let list_datetime=JSON.parse(localStorage.getItem(game_data.world+"troopTemplatesFakes"))[3]
        $('.set_troops input[type=datetime-local]').each(function (index,elem) {
            // console.log(elem)
            this.value=list_datetime[index]
        });

        //hide for fakes or nukes
        let select_type=document.getElementById("select_type_attack").value
        // console.log("select_type22",select_type)
        if(select_type == "fakes"){
            $(".hide_nukes").hide()
            $(".hide_fangs").hide()
            $(".hide_knight").hide()
            $(".hide_snob").hide()
            $(".hide_btn_delete").hide()
        }
        else if(select_type == "nukes"){
            $(".hide_fakes").hide()
            $(".hide_fangs").hide()
        }
        else{
            $(".hide_fakes").hide()
            $(".hide_nukes").hide()
        }

    }


    $(".set_troops select, .set_troops input[type=number], .set_troops input[type=checkbox], .set_troops input[type=datetime-local]").on("click input change",()=>{
        let select_command_value=[]
        let list_input=[]
        let list_checkbox=[]
        let list_datetime=[]

        //save checkbox
        $('.set_troops input[type=checkbox]').each(function () {
            // console.log("AICI")
            var checked = this.checked
            // console.log(this)
            list_checkbox.push(checked)
        });
        //save dropdown
        $('.set_troops select').each(function () {
            var value = this.value
            select_command_value.push(value)
        });
        //save inputs
        $('.set_troops input[type=number]').each(function () {
            // var checked = this.checked
            var value=this.value
            // console.log(value)
            list_input.push(value)
        });
    
        //save datetime-local
        $('.set_troops input[type=datetime-local]').each(function () {
            // var checked = this.checked
            var value=this.value
            // console.log(value)
            list_datetime.push(value)
        });
    

        
    
        let list_final=[list_checkbox,select_command_value,list_input,list_datetime]
        let data=JSON.stringify(list_final)
        let data_localStorage=localStorage.getItem(game_data.world+"troopTemplatesFakes")
        // console.log(data)
        if(data!=data_localStorage){
            localStorage.setItem(game_data.world+"troopTemplatesFakes",JSON.stringify(list_final))
        }

        // hide fakes or nukes
        let select_type=document.getElementById("select_type_attack").value
        // console.log("select_type sa mor",select_type)
        if(select_type == "fakes"){
            $(".hide_nukes").hide()
            $(".hide_fangs").hide()
            $(".hide_fakes").show()

            $(".hide_knight").hide()
            $(".hide_snob").hide()
            $(".hide_btn_delete").hide()

        }
        else if(select_type == "nukes"){
            $(".hide_fakes").hide()
            $(".hide_fangs").hide()
            $(".hide_nukes").show()

            $(".hide_knight").show()
            $(".hide_snob").show()
        }
        else {
            $(".hide_fakes").hide()
            $(".hide_nukes").hide()
            $(".hide_fangs").show()

            $(".hide_knight").show()
            $(".hide_snob").show()
        }
        

    })

}



function initializationOptionAttack(){
    let list_select=document.getElementById("select_option_fakes")
    let list_stored=localStorage.getItem(game_data.world+"optionAttack")
    list_select.value=list_stored

    $("#select_option_fakes").change(()=>{
        console.log("save attack")
        let option=document.getElementById("select_option_fakes").value
        localStorage.setItem(game_data.world+"optionAttack",option)
    })
}


function saveCoordDropbox(){
    let tabs_tribe=document.getElementsByClassName("li_tribe")
    // console.log(tabs_tribe)
    for(let i=0;i<tabs_tribe.length;i++){
        let idDivParent=tabs_tribe[i].getAttribute("rel");
        document.getElementById(idDivParent).getElementsByClassName("btn")[0].addEventListener("click",()=>{
            let coords=document.getElementById(idDivParent).getElementsByTagName("textarea")[0].value
            let sourceCoord = document.getElementById(idDivParent).getElementsByClassName("select_get_coord")[0].value

            let list_input=[]
            $('#table_get_coords input[type=number], #table_get_coords input[type=text]').each(function () {
                var value=this.value
                list_input.push(value)
            });
    
            
            let obj={
                coords:coords,
                playerId:game_data.player.id.toString(),
                playerName:game_data.player.name,
                data:document.getElementById("serverDate").innerText+" "+document.getElementById("serverTime").innerText,
                nameTab:tabs_tribe[i].innerText,
                sourceCoord:sourceCoord,
                list_input:list_input,
            }
            console.log("saved")
            console.log(obj)
            uploadFile(JSON.stringify(obj),list_filename_fakes[i],dropboxToken)
        })
    }


    
 


    
}



async function getCoordDropbox(){
    console.log(filename_fakes1)
    let tabs_tribe=document.getElementsByClassName("li_tribe")
    let [file_fakes1, file_fakes2, file_fakes3, file_fakes4, file_fakes5, file_fakes6,file_fakes7,file_fakes8,file_fakes9,file_fakes10,mapVillage]=await Promise.all(
        [readFileDropbox(filename_fakes1),readFileDropbox(filename_fakes2),readFileDropbox(filename_fakes3),readFileDropbox(filename_fakes4),readFileDropbox(filename_fakes5),readFileDropbox(filename_fakes6),readFileDropbox(filename_fakes7),readFileDropbox(filename_fakes8),readFileDropbox(filename_fakes9),readFileDropbox(filename_fakes10),getInfoVIllages()])
    
    let list_files=[file_fakes1, file_fakes2, file_fakes3, file_fakes4, file_fakes5, file_fakes6,file_fakes7,file_fakes8,file_fakes9,file_fakes10]

    for(let i=0;i<tabs_tribe.length;i++){
        let idDivParent=tabs_tribe[i].getAttribute("rel");

        let textarea=document.getElementById(idDivParent).getElementsByTagName("textarea")[0]
        let paragraph_saved_by=document.getElementById(idDivParent).getElementsByTagName("p")[0]
        let paragraph_nr_coord=document.getElementById(idDivParent).getElementsByTagName("p")[1]
        let dropdown_source=document.getElementById(idDivParent).getElementsByClassName("select_get_coord")[0]
        
        //initialize panels tribe when mouse is up
        tabs_tribe[i].addEventListener("mouseup",async function(){
            if(tabs_tribe[i].classList.contains("active")==false){
                try{
                    let data_coord=await readFileDropbox(list_filename_fakes[i])
                    data_coord = data_coord.replace(/</g, "").replace(/>/g, "")
                    let obj=JSON.parse(data_coord)
                    obj.coords = obj.coords.replace(/"/g, "").replace(/'/g, "").replace(/`/g, "")
                    obj.dat = obj.data.replace(/"/g, "").replace(/'/g, "").replace(/`/g, "")

                    textarea.value=obj.coords
                    obj.playerName = obj.playerName.replace(/"/g, "").replace(/'/g, "").replace(/`/g, "")
                    paragraph_saved_by.innerText="saved by "+ obj.playerName +" on "+obj.data
                    paragraph_nr_coord.innerText="nr coords "+obj.coords.split(" ").length
                    tabs_tribe[i].innerText=obj.nameTab

                    if(obj.list_input != undefined){
                        $('#table_get_coords input[type=number], #table_get_coords input[type=text]').each(function (index,elem) {
                            this.value=obj.list_input[index]
                        });
                    }
                    else{
                        $('#table_get_coords input[type=number], #table_get_coords input[type=text]').each(function (index,elem) {
                            this.value=""
                        }); 
                    }
                    if(obj.sourceCoord != undefined){
                        dropdown_source.value=obj.sourceCoord
                        if(obj.sourceCoord == "coordGrabber"){
                            textarea.value = getCoordsGrabber(mapVillage)
                            paragraph_nr_coord.innerText="nr coords "+textarea.value.split(" ").length
                        }
                    }
                    // console.log(obj)
                    UI.SuccessMessage("get coords",1000)
                }catch(e){
                    UI.ErrorMessage("error coords2",1000)
                }

            }

        }) 
        // initialize the first time when the script is run
        if(tabs_tribe[i].classList.contains("active")==false){
            try{
                let obj=JSON.parse(list_files[i])
                // console.log(obj)
                textarea.value=obj.coords;
                paragraph_saved_by.innerText="saved by "+obj.playerName+" on "+obj.data
                paragraph_nr_coord.innerText="nr coords "+obj.coords.split(" ").length
                tabs_tribe[i].innerText=obj.nameTab
 

                if(obj.list_input != undefined){
                        // console.log(obj)
                    $('#table_get_coords input[type=number], #table_get_coords input[type=text]').each(function (index,elem) {
                        this.value=obj.list_input[index]
                    });
                }
                else{
                    $('#table_get_coords input[type=number], #table_get_coords input[type=text]').each(function (index,elem) {
                        this.value=""
                    }); 
                }
                if(obj.sourceCoord != undefined){
                    dropdown_source.value=obj.sourceCoord
                    if(obj.sourceCoord == "coordGrabber"){
                        textarea.value = getCoordsGrabber(mapVillage)
                        paragraph_nr_coord.innerText="nr coords "+textarea.value.split(" ").length

                    }
                }

                // console.log(obj)
                UI.SuccessMessage("upload coords",1000)
            }catch(e){
                UI.ErrorMessage("save coords",1000)
                console.log(e)
            }
        }


    }
}



async function getInfoVIllages(){
    
    return new Promise(async(resolve,reject)=>{
        let filename_innoDB=game_data.world+"infoVillages"
        await insertlibraryLocalBase().catch(err=>{alert(err)})
        let data = await localBase.getItem(filename_innoDB).catch(err=>{alert(err)})

        console.log("get info VIllages")
        let mapVillage=new Map();
        let obj={};
        let server_date=document.getElementById("serverDate").innerText.split("/")
        let server_time=document.getElementById("serverTime").innerText
        let current_date=new Date(server_date[1]+"/"+server_date[0]+"/"+server_date[2]+" "+server_time);
        let url=window.location.href.split("/game.php")[0]
        let mapPlayer=new Map();
        let mapAlly=new Map();


        if(data==undefined){

            let dataVillage=httpGet(url+"/map/village.txt").split(/\r?\n/);
            let dataPlayer=httpGet(url+"/map/player.txt").split(/\r?\n/);
            let dataAlly=httpGet(url+"/map/ally.txt").split(/\r?\n/);

            for(let i=0;i<dataAlly.length-1;i++){
                // console.log(dataPlayer[i].split(",")[1])
                let tribeName=innoReplaceSpecialCaracters(dataAlly[i].split(",")[1])
                mapAlly.set(dataAlly[i].split(",")[0],tribeName)
            }
            for(let i=0;i<dataPlayer.length-1;i++){
                // console.log(dataPlayer[i].split(",")[1])
                let playerName=innoReplaceSpecialCaracters(dataPlayer[i].split(",")[1])
                let tribeName= (mapAlly.get(dataPlayer[i].split(",")[2]) == undefined)? "none":mapAlly.get(dataPlayer[i].split(",")[2])
                mapPlayer.set(dataPlayer[i].split(",")[0],{
                    allyId:dataPlayer[i].split(",")[2],
                    playerName:playerName,
                    tribeName: tribeName
                })
            }

    
            for(let i=0;i<dataVillage.length;i++){
                if(mapPlayer.get(dataVillage[i].split(",")[4])!=undefined){
                    mapVillage.set(dataVillage[i].split(",")[2]+"|"+dataVillage[i].split(",")[3],{
                        villageId:dataVillage[i].split(",")[0],
                        playerId:dataVillage[i].split(",")[4],
                        points:dataVillage[i].split(",")[5],
                        allyId:mapPlayer.get(dataVillage[i].split(",")[4]).allyId,
                        playerName:mapPlayer.get(dataVillage[i].split(",")[4]).playerName,
                        tribeName:mapPlayer.get(dataVillage[i].split(",")[4]).tribeName
                    })
                }
            }
            obj.datetime=current_date
            obj.data=Array.from(mapVillage.entries())

            let data=JSON.stringify(obj)
            data=replaceSpecialCaracters(data)
        
            await localBase.setItem(filename_innoDB,data)
        
        }else{
            // console.log("i am herererere")
            let ino_db= JSON.parse(data)
            let db_date=ino_db.datetime
            mapVillage=new Map(ino_db.data)

            // console.log("mapVillage",mapVillage)
            

            console.log("updating")

            // console.log(mapVillage)
            if(new Date(current_date).getTime()-new Date(db_date)>3600*1000){
                console.log("update database inno")

                let dataVillage=httpGet(url+"/map/village.txt").split(/\r?\n/);
                let dataPlayer=httpGet(url+"/map/player.txt").split(/\r?\n/);
                let dataAlly=httpGet(url+"/map/ally.txt").split(/\r?\n/);
    
                for(let i=0;i<dataAlly.length-1;i++){
                    // console.log(dataPlayer[i].split(",")[1])
                    let tribeName=innoReplaceSpecialCaracters(dataAlly[i].split(",")[1])
                    mapAlly.set(dataAlly[i].split(",")[0],tribeName)
                }
                for(let i=0;i<dataPlayer.length-1;i++){
                    // console.log(dataPlayer[i].split(",")[1])
                    let playerName=innoReplaceSpecialCaracters(dataPlayer[i].split(",")[1])
                    let tribeName= (mapAlly.get(dataPlayer[i].split(",")[2]) == undefined)? "none":mapAlly.get(dataPlayer[i].split(",")[2])
                    mapPlayer.set(dataPlayer[i].split(",")[0],{
                        allyId:dataPlayer[i].split(",")[2],
                        playerName:playerName,
                        tribeName: tribeName
                    })
                }
    
        
                for(let i=0;i<dataVillage.length;i++){
                    if(mapPlayer.get(dataVillage[i].split(",")[4])!=undefined){
                        mapVillage.set(dataVillage[i].split(",")[2]+"|"+dataVillage[i].split(",")[3],{
                            villageId:dataVillage[i].split(",")[0],
                            playerId:dataVillage[i].split(",")[4],
                            points:dataVillage[i].split(",")[5],
                            allyId:mapPlayer.get(dataVillage[i].split(",")[4]).allyId,
                            playerName:mapPlayer.get(dataVillage[i].split(",")[4]).playerName,
                            tribeName:mapPlayer.get(dataVillage[i].split(",")[4]).tribeName
                        })
                    }
                }
                obj.datetime=current_date
                obj.data=Array.from(mapVillage.entries())
                
                let data=JSON.stringify(obj)
                data=replaceSpecialCaracters(data)
                await localBase.setItem(filename_innoDB,data)

                console.log("upload new data")

            }
            else{
                console.log("already exist")
            }
        }
        resolve(mapVillage)


    })


}

function insertlibraryLocalBase(){
    return new Promise((resolve,reject)=>{

        let start=new Date().getTime()
        let script = document.createElement('script');
        script.type="text/javascript"
        script.src="https://dl.dropboxusercontent.com/s/22qgnhyxnyono68/libraryIndexedDB.js?dl=0"
        script.onload = function () {
            let stop=new Date().getTime()
            console.log(`insert idb library in ${stop-start} ms`)
            resolve("insert library")
        };
        document.getElementsByTagName("head")[0].appendChild(script);
    })
}

function innoReplaceSpecialCaracters(text){//ino database has special characters
    text=text.replaceAll("+"," ")
    text=text.replaceAll("%21","!")
    text=text.replaceAll("%23","#")
    text=text.replaceAll("%24","$")
    text=text.replaceAll("%25","%")

    text=text.replaceAll("%28","(")
    text=text.replaceAll("%29",")")
    text=text.replaceAll("%2A","*")
    text=text.replaceAll("%2B","+")
    text=text.replaceAll("%2C",",")
    text=text.replaceAll("%2F ","/")


    text=text.replaceAll("%3A",":")
    text=text.replaceAll("%3B","}")
    text=text.replaceAll("%3D","=")
    text=text.replaceAll("%3F","?")

    text=text.replaceAll("%40","@")

    text=text.replaceAll("%5B","[")
    text=text.replaceAll("%5D","]")

    text=text.replaceAll("%7B","_")
    text=text.replaceAll("%7C","|")
    text=text.replaceAll("%7D","|")
    
    text=text.replaceAll("%7E","{")

    text=text.replaceAll("%C3%84","Ä")
    text=text.replaceAll("%C3%85","Å")
    text=text.replaceAll("%C3%86","Æ")
    text=text.replaceAll("%C3%A2","â")
    text=text.replaceAll("%C3%A4","ä")
    text=text.replaceAll("%C3%A5","å")
    text=text.replaceAll("%C3%A6","æ")
    text=text.replaceAll("%C3%B6","ö")
    text=text.replaceAll("%C3%B8","ø")
    text=text.replaceAll("%C3%BC","ü")

    text=text.replaceAll("%C4%83","ă")

    text=text.replaceAll("%C8%99","ș")
    text=text.replaceAll("%C5%A3","ţ")
    text=text.replaceAll("%C8%9B","ț")

    return text
}


function getFakeLimit(){//get and save locally fake limit
    let fake_limit=0;
    if(localStorage.getItem(game_data.world+"fake_limit")!=null){
        fake_limit=parseInt(localStorage.getItem(game_data.world+"fake_limit"))
        console.log("already exist")
    }
    else{
        let data=httpGet("/interface.php?func=get_config").split("\n");
        for(let i=0;i<data.length;i++){
            if(data[i].includes("fake_limit")){
                fake_limit=data[i].split("<fake_limit>")[1]
                fake_limit=fake_limit.split("</fake_limit>")[0]
                console.log("get limit fake")
                break;
            }
        }
        localStorage.setItem(game_data.world+"fake_limit",fake_limit)
    }
    console.log("fake limit "+fake_limit)
    return fake_limit
}




function autocomplete(inp, arr) {//autocomplete for adding tribes or admins
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        var counter=0;
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if(arr[i]==undefined)
            continue
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {

            /*create a DIV element for each matching element:*/
            b = document.createElement("DIV");
            b.style.backgroundColor=backgroundInput
            /*make the matching letters bold:*/
            b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].substr(val.length);
            /*insert a input field that will hold the current array item's value:*/
            b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
            /*execute a function when someone clicks on the item value (DIV element):*/
            b.addEventListener("click", function(e) {
                /*insert the value for the autocomplete text field:*/
                inp.value = this.getElementsByTagName("input")[0].value;
                /*close the list of autocompleted values,
                (or any other open lists of autocompleted values:*/
                closeAllLists();
            });
            counter++;
            if(counter<=5)
                a.appendChild(b);
            }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
            /*and simulate a click on the "active" item:*/
            if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
            x[i].parentNode.removeChild(x[i]);
        }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
    }

function shuffleArray(array) {//randomize coords from vector
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getBonusNight() { //get bonus night
    if (localStorage.getItem(game_data.world+"nightBonus") !== null) {
        let obj=JSON.parse(localStorage.getItem(game_data.world+"nightBonus"))
        console.log("speed world already exist")
        return obj
    }
    else { //Get data from xml and save it in localStorage to avoid excessive XML requests to server
            let data=httpGet("/interface.php?func=get_config") //Load world data
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(data, 'text/html');
            let obj={}
            //active = 0-> bonus night off, active = 1-> bonus night static,active = 2-> bonus night dynamic
            let active = htmlDoc.getElementsByTagName("night")[0].getElementsByTagName("active")[0].innerHTML
            let start_hour = htmlDoc.getElementsByTagName("night")[0].getElementsByTagName("start_hour")[0].innerHTML
            let end_hour = htmlDoc.getElementsByTagName("night")[0].getElementsByTagName("end_hour")[0].innerHTML
            obj.active=active
            obj.start_hour=start_hour
            obj.end_hour=end_hour

            
            localStorage.setItem(game_data.world+"nightBonus",JSON.stringify(obj));
            console.log("save speed world")
        return obj
    }
}


function getBonusNightForEach(list_href){// return bonus night interval for each player
    return new Promise((solve,reject)=>{
        var counter=0;
        var map_idPlayers=new Map()
        function ajaxRequest (urls) {
            let villageId
            let playerId
            if(urls.length>0){
                let obj=urls.pop()
                villageId=obj.villageId
                playerId=obj.playerId
            }
            else{
                villageId="stop"
            }
            let start_ajax=new Date().getTime()
            if (urls.length >= 0 && villageId!="stop") {
                $.ajax({
                    url: game_data.link_base_pure + `map&ajax=map_info&source=${villageId}&target=${villageId}&`,
                    method: 'get',
                    success: (data) => {
                        let night_bonus_interval=data.night_bonus.current_interval.match(/[0-9]{2}:[0-9]{2}/g)
                        map_idPlayers.set(playerId,{
                            start_hour:night_bonus_interval[0],
                            end_hour:night_bonus_interval[1],

                        })
            
                        let stop_ajax=new Date().getTime();
                        let diff=stop_ajax-start_ajax
                        console.log("wait: "+diff)
                        window.setTimeout(function(){
                            ajaxRequest (list_href)
                            UI.SuccessMessage("get bonus: "+urls.length)
                            counter++;
                        },200-diff)
                    }
                })
                
            }
            else
            {
                UI.SuccessMessage("done")
                solve(map_idPlayers)
            }
        }
        ajaxRequest(list_href);

    })
}


function getSpeedConstant() { //Get speed constant (world speed * unit speed) for world
    if (localStorage.getItem(game_data.world+"speedWorld") !== null) {
        let obj=JSON.parse(localStorage.getItem(game_data.world+"speedWorld"))
        console.log("speed world already exist")
        return obj
    }
    else { //Get data from xml and save it in localStorage to avoid excessive XML requests to server
            let data=httpGet("/interface.php?func=get_config") //Load world data
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(data, 'text/html');
            let obj={}
            let worldSpeed = Number(htmlDoc.getElementsByTagName("speed")[0].innerHTML)
            let unitSpeed = Number(htmlDoc.getElementsByTagName("unit_speed")[0].innerHTML);
            obj.unitSpeed=unitSpeed
            obj.worldSpeed=worldSpeed

            localStorage.setItem(game_data.world+"speedWorld",JSON.stringify(obj));
            console.log("save speed world")
        return obj
    }
}

function calcDistance(coord1,coord2)
{
    let x1=parseInt(coord1.split("|")[0])
    let y1=parseInt(coord1.split("|")[1])
    let x2=parseInt(coord2.split("|")[0])
    let y2=parseInt(coord2.split("|")[1])

    return Math.sqrt( (x1-x2)*(x1-x2) +  (y1-y2)*(y1-y2) );


}

function intervalHour(time_start,time_end,time_target){//check if attack lands on bonus time
    if(time_start==0)
        time_start=23*3600*1000+40*60000;
    else
        time_start-=20*60000;

    if(time_start<time_end){
        return(time_target>time_start && time_target<time_end)?true:false
    }
    else{
        return ((time_target>time_end && time_target<time_start))?false:true
    }
}


function uploadFile(data,filename,dropboxToken){ // upload file into dropbox
    return new Promise((resolve,reject)=>{
        var file = new Blob([data], {type: "plain/text"});
        var nr_start1=new Date().getTime();
        file.name=filename;

        //stop refreshing the page
        $(document).bind("keydown", disableF5);
        window.onbeforeunload = function (e) {
            console.log("is uploading");
            return "are you sure?";
        };

        var xhr = new XMLHttpRequest();
        xhr.upload.onprogress = function(evt) {
            console.log(evt)
            var percentComplete = parseInt(100.0 * evt.loaded / evt.total);
            console.log(percentComplete)
            UI.SuccessMessage("progress upload: "+percentComplete+"%")
        };

        xhr.onload = function() {
            if (xhr.status === 200) {
                var fileInfo = JSON.parse(xhr.response);
                // Upload succeeded. Do something here with the file info.
                UI.SuccessMessage("upload succes")
                var nr_stop1=new Date().getTime();
                console.log("time upload: "+(nr_stop1-nr_start1))

                //enable refresh page
                window.onbeforeunload = function (e) {
                    console.log("done");
                };
                $(document).unbind("keydown", disableF5);

                resolve("succes")

            }
            else {
                var errorMessage = xhr.response || 'Unable to upload file';
                // Upload failed. Do something here with the error.
                UI.SuccessMessage("upload failed")
                reject(errorMessage)
            }
        };

        xhr.open('POST', 'https://content.dropboxapi.com/2/files/upload');
        xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({
            path: '/' +  file.name,
            mode: 'add',
            autorename: true,
            mode:'overwrite',
            mute: false
        }));

        xhr.send(file)
    })
}

function disableF5(e) { if ((e.which || e.keyCode) == 116 || (e.which || e.keyCode) == 82) e.preventDefault(); };


function readFileDropbox(filename){// read file from dropbox
    return new Promise((resolve,reject)=>{
        $.ajax({
            url: "https://content.dropboxapi.com/2/files/download",
            method: 'POST',
            dataType: "text",
            headers: { 'Authorization': 'Bearer ' + dropboxToken,
                        'Dropbox-API-Arg': JSON.stringify({path: "/"+filename})},
            
            success: (data) => {
                data = data.replace(/</g, "").replace(/>/g, "");
                resolve(data)
            },error: (err)=>{
                console.log(err)
                reject(err)
            }
        })
    })
}


function lzw_encode (s) {//data compression
    if (!s) return s;
    var dict = new Map(); // Use a Map!
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i = 1; i < data.length; i++) {
        currChar = data[i];
        if (dict.has(phrase + currChar)) {
            phrase += currChar;
        } else {
            out.push (phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
            dict.set(phrase + currChar, code);
            code++;
            if (code === 0xd800) { code = 0xe000; }
            phrase = currChar;
        }
    }
    out.push (phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
    for (var i = 0; i < out.length; i++) {
        out[i] = String.fromCodePoint(out[i]);
    }
    //console.log ("LZW MAP SIZE", dict.size, out.slice (-50), out.length, out.join("").length);
    return out.join("");
}

function lzw_decode (s) {//data decompression
    var dict = new Map(); // Use a Map!
    var data = Array.from(s + "");
    //var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i = 1; i < data.length; i++) {
        var currCode = data[i].codePointAt(0);
        if (currCode < 256) {
            phrase = data[i];
        } else {
            phrase = dict.has(currCode) ? dict.get(currCode) : (oldPhrase + currChar);
        }
        out.push(phrase);
        var cp = phrase.codePointAt(0);
        currChar = String.fromCodePoint(cp); //phrase.charAt(0);
        dict.set(code, oldPhrase + currChar);
        code++;
        if (code === 0xd800) { code = 0xe000; }
        oldPhrase = phrase;
    }
    return out.join("");
}

function replaceSpecialCaracters(data){//some special data cannot be compressed
    let result=""
    for(let i=0;i<data.length;i++){
        if(data[i]=="ț")
            result+='t'
        else if(data[i]=="Ț")
            result+="T"
        else if(data[i]=="Ă")
            result+="A"
        else if(data[i]=="ă")
            result+="a"
        else if(data[i]=="Â")
            result+="A"
        else if(data[i]=="Ș")
            result+="S"
        else if(data[i]=="ș")
            result+="s"
        else if(data[i]=="Î")
            result+="I"
        else if(data[i]=="î")
            result+="i"
        else
            result+=data[i]
    }
    return result




}

function checkPageRun(){//check if the script is run on the right page
    let href=window.location.href
    if(href.includes("screen=place")){
        let list_href=JSON.parse(localStorage.getItem(game_data.world+"launchFakes"));
        if(list_href.length>0){
            let current_href=list_href.pop();
            localStorage.setItem(game_data.world+"launchFakes",JSON.stringify(list_href));
            UI.SuccessMessage("left "+list_href.length+" fakes",1000);
    
            window.open(current_href,"_self");
            throw new Error("fake sent");// i don't like this throw error here

    
        }
    }
    else if(document.getElementById("combined_table")==null){
        alert("the script must be run from overview_villages&mode=combined ")
        window.location.href=game_data.link_base_pure+"overview_villages&mode=combined"
        throw new Error("wrong page");

    }
    
}


async function startFakes(){
    try {
        let mapTroupes=new Map();
        let mapInfoVillages=await getInfoVIllages();
        let selectModLaunch=document.getElementById("select_option_fakes").value
        let selectAttack=document.getElementById("select_type_attack").value
        let landSpecific=$(".set_troops  input[type=checkbox][value=land_specific]:visible").prop("checked")
        let nrFakesPerVillage=parseInt(document.getElementById("nr_fakes_per_village").value)
        
        
        let nrFakes=parseInt(document.getElementById("nr_fakes").value)
        let nrSplits=parseInt(document.getElementById("nr_split").value)
        let minPop=parseInt($(".min_pop:visible").val())
        nrSplits=(Number.isNaN(nrSplits)==true || nrSplits==0)?5:nrSplits
        nrFakes=(Number.isNaN(nrFakes)==true || nrFakes==0)?1:nrFakes
        minPop=(Number.isNaN(minPop)==true || minPop==0)?200:minPop
        nrFakesPerVillage=(Number.isNaN(nrFakesPerVillage)==true || nrFakesPerVillage==0)?4:nrFakesPerVillage
        nrFakesPerVillage--

        let start_window = new Date($(".set_troops .start_window:visible").val())
        let stop_window  = new Date($(".set_troops .stop_window:visible").val())
        if(start_window == "Invalid Date" && $( "input[value='land_specific']:visible").get(0).checked == true){
            UI.ErrorMessage("set start window",1500)
            throw new Error("set start window")
        }
        if(stop_window == "Invalid Date" && $( "input[value='land_specific']:visible").get(0).checked == true){
            UI.ErrorMessage("set stop window",1500)
            throw new Error("set stop window")
        }
        if(stop_window.getTime() - start_window.getTime() < 0){
            UI.ErrorMessage("right interval must be higher than left one",2000)
            throw new Error("right interval must be higher than left one")
        }


        let listFakesTemplate=[];
        let ally_tribe=JSON.parse((dropbox_ally=="")?"[]":dropbox_ally ).map(e=>{return e.allyId})

        let bonusNight=getBonusNight();
        console.log("mapInfoVillages",mapInfoVillages)



        //after btn open tab is pressed get tropps again
        if(document.getElementsByClassName("open_tab").length>0){
            let start=new Date().getTime();
            let text_page=httpGet(window.location.href)
            let table=text_page.match(/<table id="combined_table"((.|\n)+)/)[0].split("<\/table>")[0]+"</table>"
            document.getElementById("combined_table").innerHTML=table
            let stop=new Date().getTime();
            console.log("get combined page in: "+(stop-start)+" ms")
        }


    //////////////////////////////////////////////////////////////get template////////////////////////////////////////////////////////////////   
        let limitFake=getFakeLimit()/100;
        console.log(limitFake)
        for(let i=0;i<unitsLength;i++){
            let troupeName=units[i]
            let nrTroupe=document.getElementById(troupeName+"Troupe").value
            mapTroupes.set(troupeName,nrTroupe)
        }

        let table_combined=document.getElementById("combined_table").getElementsByTagName("tr")
        let select_type=document.getElementById("select_type_attack").value

        if(select_type=="fakes"){
            if(limitFake>0){
                for(let i=1;i<table_combined.length;i++){
                    let vectorTroupes=Array.from(table_combined[i].getElementsByClassName("unit-item")).map(e=>{return parseInt(e.innerText)})
                    let currentCoord=table_combined[i].getElementsByClassName("quickedit-label")[0].innerText.match(/\d+\|\d+/)[0]
                    let linkBase=table_combined[i].getElementsByClassName("quickedit-content")[0].getElementsByTagName("a")[0].href.replace("overview","place")
                    let villagePoints=mapInfoVillages.get(currentCoord).points
                    let villageId=mapInfoVillages.get(currentCoord).villageId
                    // console.log(linkBase)
                    let limitPop=parseInt(villagePoints*limitFake)+10;
                    // console.log("troupes available")
                    // console.log(vectorTroupes)
                    let availableTroupes={}
                    let totalPop=0;
                    Array.from(mapTroupes.keys()).forEach((key,index)=>{
                        let selectNameTroupe=key;
                        let selectValueTroupe=mapTroupes.get(key)
                        let currentTroupe=vectorTroupes[index]
                        
                        if(selectValueTroupe!=0){
                            if(currentTroupe>nrFakes){
                                if(selectValueTroupe>0 && currentTroupe >= selectValueTroupe * nrFakes){
                                    availableTroupes[selectNameTroupe]={
                                        value:selectValueTroupe * nrFakes,
                                        static:"true"
                                    }
                                    totalPop+=nrFakes*troupesPop[selectNameTroupe]*selectValueTroupe
                                }
                                else{
                                    availableTroupes[selectNameTroupe]={
                                        value:currentTroupe,
                                        static:"false"
                                    }
                                    totalPop+=currentTroupe*troupesPop[selectNameTroupe]
        
                                }
                            }
                        }
        
                    })
                    let availableFakesTotal=totalPop/limitPop;
                    // console.log("current coord "+currentCoord)
                    // console.log(availableTroupes)
                    // console.log("limit pop "+limitPop)
                    // console.log("total pop "+totalPop)
                    // console.log("nr possible fakes "+availableFakesTotal)
                    let templateFakes={}
                    let totalPopTemplate=0;
                    Object.keys(availableTroupes).forEach(key=>{
                        if(availableFakesTotal>1.2){
                            if(availableTroupes[key].static=="false"){
                                let troupeTemplate=Math.ceil(availableTroupes[key].value/availableFakesTotal)
                                templateFakes[key]=troupeTemplate
                                totalPopTemplate+=troupeTemplate*troupesPop[key]
                            }else{
                                let troupeTemplate=availableTroupes[key].value/nrFakes
                                templateFakes[key]=troupeTemplate
                                totalPopTemplate+=troupeTemplate*troupesPop[key]
        
                            }
                        }
                    })
                    // console.log("templateFakes")
                    // console.log(templateFakes)
                    // console.log("total pop sent "+totalPopTemplate)
                    for(let k=0;k<30;k++){
                        Object.keys(templateFakes).forEach(key=>{
                            if(totalPopTemplate-limitPop>=1 && troupesPop[key]==1){
                                templateFakes[key]=templateFakes[key]-1;
                                totalPopTemplate--;
                            }
                            if(totalPopTemplate-limitPop>=2 && troupesPop[key]==2 && k%2==0 && availableTroupes[key].static=="false" ){
                                templateFakes[key]=templateFakes[key]-1;
                                totalPopTemplate-=2;
                            }
                            if(totalPopTemplate-limitPop>=4 && troupesPop[key]==4 && k%2==0){
                                templateFakes[key]=templateFakes[key]-1;
                                totalPopTemplate-=4;
                            }
                            if(totalPopTemplate-limitPop>=6 && troupesPop[key]==6 && k%4==0){
                                templateFakes[key]=templateFakes[key]-1;
                                totalPopTemplate-=6;
                            }
                            //rams 
                            if(totalPopTemplate-limitPop>=5 && troupesPop[key]==5 && k%5==0  && templateFakes[key]>1 ){
                                // console.log("remove ram")
                                templateFakes[key]=templateFakes[key]-1;
                                totalPopTemplate-=5;
                            }
                            //cats
                            if(totalPopTemplate-limitPop>=8 && troupesPop[key]==8 && k%5==0  && templateFakes[key]>1){
                                // console.log("remove cat")
                                templateFakes[key]=templateFakes[key]-1;
                                totalPopTemplate-=8;
                            }
        
                            
        
                            
        
                            if(templateFakes[key]==0){
                                delete templateFakes[key]
                            }
        
                        })
                        if(totalPopTemplate==limitPop)
                            break;
                    }
                    // console.log("templateFakes")
                    // console.log()
                    // console.log("total pop sent "+totalPopTemplate)
                    // Object.keys(templateFakes).forEach(key=>{console.log(key+" "+templateFakes[key])})
                    // console.log("-------------------------------------------------------------------------------")
                    let minFakes=Math.min(nrFakes,parseInt(availableFakesTotal))
        
                    if(availableFakesTotal>1.2 &&(templateFakes["ram"]>=1 || templateFakes["catapult"]>=1)){
                        listFakesTemplate.push({
                            templateFakes:templateFakes,
                            nrFakes:minFakes,
                            limitPop:limitPop,
                            totalPopTemplate:totalPopTemplate,
                            linkBase:linkBase,
                            coordOrigin:currentCoord,
                            speedTroop:ramSpeed,
                            nrCells:mapTroupes.size
                        })
                    }
                }
            }
            else{
                for(let i=1;i<table_combined.length;i++){
                
                    let vectorTroupes=Array.from(table_combined[i].getElementsByClassName("unit-item")).map(e=>{return parseInt(e.innerText)})
                    let currentCoord=table_combined[i].getElementsByClassName("quickedit-label")[0].innerText.match(/\d+\|\d+/)[0]
                    let linkBase=table_combined[i].getElementsByClassName("quickedit-content")[0].getElementsByTagName("a")[0].href.replace("overview","place")
                    console.log("linkBase",linkBase)
                    console.log("vectorTroupes",vectorTroupes)
                    let availableTroupes={}
                    Array.from(mapTroupes.keys()).forEach((key,index)=>{
                        let selectNameTroupe=key;
                        let selectValueTroupe=mapTroupes.get(key)
                        let currentTroupe=vectorTroupes[index]
                        
                        if(selectValueTroupe > 0 && selectValueTroupe != "min" && (selectNameTroupe=="spy" ||selectNameTroupe=="ram"|| selectNameTroupe=="catapult" )){
                            if(currentTroupe >= selectValueTroupe*nrFakes ){
                                availableTroupes[selectNameTroupe]=selectValueTroupe*nrFakes
                            }
                        }    
                    })
                    console.log("availableTroupes",availableTroupes)
                    let templateFakes={}

                    if(availableTroupes["spy"]>=nrFakes && availableTroupes["ram"]>=nrFakes){
                        templateFakes["spy"]=parseInt(availableTroupes["spy"]/nrFakes)
                        templateFakes["ram"]=parseInt(availableTroupes["ram"]/nrFakes)
                    }
                    else if(availableTroupes["spy"] >= nrFakes && availableTroupes["catapult"] >= nrFakes){
                        templateFakes["spy"] = parseInt(availableTroupes["spy"]/nrFakes)
                        templateFakes["catapult"] = parseInt(availableTroupes["catapult"]/nrFakes)
                    }
                    else if( availableTroupes["ram"]>=nrFakes){
                        templateFakes["ram"] = parseInt(availableTroupes["ram"]/nrFakes)
                    }
                    else if( availableTroupes["catapult"]>=nrFakes){
                        templateFakes["catapult"] = parseInt(availableTroupes["catapult"]/nrFakes)
                    }
        
                    console.log("-------------------------------------------------------------------------------")
                    if(templateFakes["ram"]>=1 || templateFakes["catapult"]>=1){
                        listFakesTemplate.push({
                            templateFakes:templateFakes,
                            nrFakes:nrFakes,
                            limitPop:0,
                            totalPopTemplate:0,
                            linkBase:linkBase,
                            coordOrigin:currentCoord,
                            speedTroop:ramSpeed,
                            nrCells:mapTroupes.size

                        })
                    }
                }
        
            }
        }
        else{//nukes/fangs
            let send_troops=Array.from($(".allinputTroops input:visible")).map(e=>parseInt(e.value))
            let reserve_troops=Array.from($(".allinputTroopsRes input:visible")).map(e=>parseInt(e.value))
            for(let i=0;i<unitsLength;i++){
                send_troops[i]=(Number.isNaN(send_troops[i])==true || send_troops[i]<0)?0:send_troops[i]
                reserve_troops[i]=(Number.isNaN(reserve_troops[i])==true || reserve_troops[i]<0)?0:reserve_troops[i]
            }
            console.log("send_troops",send_troops)
            console.log("reserve_troops",reserve_troops)

            for(let i=1;i<table_combined.length;i++){
                let vectorTroupes=Array.from(table_combined[i].getElementsByClassName("unit-item")).map(e=>{return parseInt(e.innerText)})
                let currentCoord=table_combined[i].getElementsByClassName("quickedit-label")[0].innerText.match(/\d+\|\d+/)[0]
                let linkBase=table_combined[i].getElementsByClassName("quickedit-content")[0].getElementsByTagName("a")[0].href.replace("overview","place")
                let villagePoints=mapInfoVillages.get(currentCoord).points
                let villageId=mapInfoVillages.get(currentCoord).villageId
                let availableTroupes={}

                let pop=0
                for(let j=0;j<send_troops.length;j++){

                    let name_troop = units[j]
                    vectorTroupes[j] -= reserve_troops[j]
                    let value_troop = Math.min(vectorTroupes[j], send_troops[j]) 
                    // console.log(`name ${name_troop}: value: ${value_troop}  vector:${vectorTroupes[i]}, send:${send_troops[j]}`)
                    value_troop = (value_troop<= 0) ? 0 : value_troop
                    availableTroupes[name_troop] = value_troop
                    pop+=troupesPop[name_troop] * value_troop
                }

                // console.log("vectorTroupes",vectorTroupes)

                // console.log("availableTroupes",availableTroupes)

                let speedTroop=ramSpeed
                if(availableTroupes["snob"] > 0)
                    speedTroop=nobleSpeed
                else if(availableTroupes["ram"] > 0 || availableTroupes["catapult"] > 0){
                    speedTroop=ramSpeed
                }
                else if(availableTroupes["sword"] > 0){
                    speedTroop=swordSpeed
                }
                else if(availableTroupes["spear"] > 0 || availableTroupes["axe"] > 0 || availableTroupes["archer"] > 0){
                    speedTroop=axeSpeed
                }
                else if(availableTroupes["light"] > 0 || availableTroupes["heavy"] > 0 || availableTroupes["marcher"] > 0){
                    speedTroop=axeSpeed
                }
                else{
                    speedTroop=scoutSpeed
                }

                    
                // console.log(`${pop} >= ${minPop}`)
                if(pop >= minPop){
                    // console.log(`availableTroupes:`,availableTroupes)
                    listFakesTemplate.push({
                        templateFakes:availableTroupes,
                        linkBase:linkBase,
                        coordOrigin:currentCoord,
                        speedTroop:speedTroop,
                        nrFakes:1,
                        nrCells:send_troops.length
                    })
                }
            }
        }


                

        shuffleArray(listFakesTemplate)
        console.log("listFakesTemplate",listFakesTemplate)

    /////////////////////////////////////////////////////////////////get list of coords/////////////////////////////////////////////////////////////////////
        let list_coords=document.getElementsByClassName("panel active")[0].getElementsByTagName("textarea")[0].value.match(/\d+\|\d+/g)
        if(list_coords==null){
            console.log("no coords")
            return
        }
        //eliminate duplicates only for fakes
        if(selectAttack == "fakes"){
            let set=new Set(list_coords)
            list_coords=Array.from(set)
            console.log("remove duplicates")
        }
        console.log("list_coords",list_coords)
        //eliminate non existent coords and barbs coords
        for(let i=0;i<list_coords.length;i++){
            if(!mapInfoVillages.has(list_coords[i])){//don't exist
                list_coords.splice(i,1);
                i--;
            }else if(mapInfoVillages.get(list_coords[i]).playerId=="0"){// it is a barb
                list_coords.splice(i,1);
                i--;
            }
        }
        //eliminate allies coords
        if(ally_tribe.length>0){
            for(let i=0;i<list_coords.length;i++){
                let infoVillage=mapInfoVillages.get(list_coords[i])
                if(infoVillage==undefined){
                    list_coords.splice(i,1)
                    i--; 
                }
                else if(ally_tribe.includes(infoVillage.allyId)){
                    list_coords.splice(i,1)
                    i--;
                }
            }
        }


        //add bonus night,if it is active, to each village 
        let map_idPlayers=new Map()
        if(bonusNight.active==2){
            for(let i=0;i<list_coords.length;i++){
                map_idPlayers.set(mapInfoVillages.get(list_coords[i]).playerId,{
                    playerId:mapInfoVillages.get(list_coords[i]).playerId,
                    villageId:mapInfoVillages.get(list_coords[i]).villageId
                })
            }
            map_idPlayers=await getBonusNightForEach(Array.from(map_idPlayers.values()))
            console.log(map_idPlayers)
            console.log("bonus level 2")
        }
        else if(bonusNight.active==1){
            map_idPlayers=new Map()
            for(let i=0;i<list_coords.length;i++){
                map_idPlayers.set(mapInfoVillages.get(list_coords[i]).playerId,{
                    start_hour:bonusNight.start_hour+":00",
                    end_hour:bonusNight.end_hour+":00"
                })
            }
            console.log(map_idPlayers)
            console.log("bonus level 1")


        }

        shuffleArray(list_coords)
        console.log(list_coords)
        let list_href=[];
        let k=0;

        let list_info_launch=[]
        let map_nr_destination=new Map()
        for(let i=0;i<listFakesTemplate.length;i++){
            let repeatforNukes=false

            let obj=listFakesTemplate[i]
            obj.nr_from=0
            for(let j=0;j<obj.nrFakes;j++){
                let found_target=false

                let href=obj.linkBase+"&";
                Object.keys(obj.templateFakes).forEach(key=>{
                    href+=key+"="+obj.templateFakes[key]+"&"
                })

                //if bonus night exist 
                if(bonusNight.active==1 || bonusNight.active==2){
                    for(let l=k;l<list_coords.length;l++){
                        let time_travel = calcDistance(obj.coordOrigin,list_coords[l]) * (ramSpeed)//time travel for ram speed
                        let serverTime=document.getElementById("serverTime").innerText
                        let serverDate=document.getElementById("serverDate").innerText.split("/")
                        serverDate=serverDate[1]+"/"+serverDate[0]+"/"+serverDate[2]

                        let date_current=new Date(serverDate+" "+serverTime).getTime()
                        date_current=new Date(date_current+time_travel)
                        console.log('coord '+list_coords[l])
                        console.log("landing time:"+date_current)

                        let start_hour=map_idPlayers.get(mapInfoVillages.get(list_coords[l]).playerId).start_hour
                        let end_hour=map_idPlayers.get(mapInfoVillages.get(list_coords[l]).playerId).end_hour
                        console.log("bonus night interval: "+start_hour+":"+end_hour)

                        let time_start=parseInt(start_hour.split(":")[0])*3600*1000+parseInt(start_hour.split(":")[1])*60000
                        let time_end=parseInt(end_hour.split(":")[0])*3600*1000+parseInt(end_hour.split(":")[1])*60000
                        let time_target=date_current.getHours()*3600*1000+date_current.getMinutes()*60000+date_current.getSeconds()*1000


                        //this part is for fakes
                        if(landSpecific==true){//only if checkbox for window si selected
                            let coord_origin=obj.coordOrigin
                            for(let l=k;l<list_coords.length;l++){
                                let coord_target=list_coords[l];
                                if(intervalHour(time_start,time_end,time_target)==false && checkWindow(start_window,stop_window,coord_origin,coord_target,obj.speedTroop)==true){//check if attack lands inside the window
                                    href+="x="+coord_target.split("|")[0]+"&y="+coord_target.split("|")[1]+"&"
                                    found_target=true

                                    if(select_type=="nukes" || select_type=="fangs"){
                                        list_coords.splice(k,1)
                                    }else{
                                        if(map_nr_destination.has(coord_target)){//check if coord dest exist and then check if there are enough fakes                                        
                                            if(map_nr_destination.get(coord_target)>=nrFakesPerVillage){
                                                list_coords.splice(k,1)
                                            }
                                            else
                                                k++
                                        }
                                        else
                                            k++
                                    }
                                    
                                    let landing_time=calculateLandingTime(coord_origin,coord_target,obj.speedTroop)
                                    obj.coordDestination=coord_target
                                    obj.nr_from = obj.nr_from + 1
                                    obj.landing_time=landing_time
                                    break;
                                }
                                k++  
                            }
                        }
                        else{
                            let coord_origin=obj.coordOrigin
                            let coord_target=list_coords[l];
                            if(intervalHour(time_start,time_end,time_target)==false){
                                console.log("it is not on bonus night")
                                href+="x="+list_coords[l].split("|")[0]+"&y="+list_coords[l].split("|")[1]+"&"
                                found_target=true

                                if(select_type=="nukes" || select_type=="fangs"){
                                    list_coords.splice(k,1)
                                }else{
                                    if(map_nr_destination.has(coord_target)){//check if coord dest exist and then check if there are enough fakes
                                        // console.log(`number baaaa: ${map_nr_destination.get(coord_origin)}`)
                                        
                                        if(map_nr_destination.get(coord_target)>=nrFakesPerVillage){
                                            list_coords.splice(k,1)
                                        }
                                        else
                                            k++

                                    }
                                    else
                                        k++
                                }
                                let landing_time=calculateLandingTime(coord_origin,coord_target,obj.speedTroop)
                                obj.coordDestination=coord_target
                                obj.nr_from = obj.nr_from + 1
                                obj.landing_time=landing_time
                                break;
                            }
                            k++;
                        }

                        //this part is for nukes
                        if(select_type=="nukes" && found_target==false){

                        }

                    }
                }
                else{  //sending fakes/nukes/fangs when bonus night is off

                    if(landSpecific==true){//only if checkbox for window si selected
                        let coord_origin=obj.coordOrigin
                        for(let l=k;l<list_coords.length;l++){
                            let coord_target=list_coords[l];
                            if(checkWindow(start_window,stop_window,coord_origin,coord_target,obj.speedTroop)==true){//check if attack lands inside the window
                                href+="x="+coord_target.split("|")[0]+"&y="+coord_target.split("|")[1]+"&"
                                found_target=true
                                if(select_type=="nukes" || select_type=="fangs"){
                                    list_coords.splice(k,1)
                                }else{
                                    if(map_nr_destination.has(coord_target)){//check if coord dest exist and then check if there are enough fakes
                                        // console.log(`number baaaa: ${map_nr_destination.get(coord_origin)}`)
                                        
                                        if(map_nr_destination.get(coord_target)>=nrFakesPerVillage){
                                            list_coords.splice(k,1)
                                            console.log(list_coords)

                                        }
                                        else
                                            k++

                                    }
                                    else
                                        k++
                                }
                                let landing_time=calculateLandingTime(coord_origin,coord_target,obj.speedTroop)
                                obj.coordDestination=coord_target
                                obj.nr_from = obj.nr_from + 1
                                obj.landing_time=landing_time
                                break;
                            }
                            k++  
                        }
                    }
                    else{//just land whenever is possible
                        if(list_coords.length==0)
                            break;


                        let coord_target=list_coords[k];
                        let coord_origin=obj.coordOrigin
                        href+="x="+coord_target.split("|")[0]+"&y="+coord_target.split("|")[1]+"&"
                        found_target=true
                        if(select_type=="nukes" || select_type=="fangs"){
                            list_coords.splice(k,1)
                        }else{
                            k++;
                        }

                        let landing_time=calculateLandingTime(coord_origin,coord_target,obj.speedTroop)
                        obj.coordDestination=coord_target
                        obj.nr_from = obj.nr_from + 1
                        obj.landing_time=landing_time



                    }
                }
                // console.log(list_coords)
                if(found_target==true){
                    if(map_nr_destination.has(obj.coordDestination)){//count +1 if exist
                        let nr_update=map_nr_destination.get(obj.coordDestination)+1
                        map_nr_destination.set(obj.coordDestination,nr_update)
                    }else{
                        map_nr_destination.set(obj.coordDestination,1)

                    }
                    obj.coordOriginId=mapInfoVillages.get(obj.coordOrigin).villageId
                    obj.coordDestinationId=mapInfoVillages.get(obj.coordDestination).villageId
                    list_info_launch.push(obj)
                    // console.log(obj)
                    list_href.push(href)
                }
                if(k==list_coords.length){
                    k=0;
                }

                // console.log(`${i} found_target: ${found_target}`)
                if(select_type=="nukes" && found_target==false && repeatforNukes==false){//if there is a nuke to send and it hasn't found a target yet repeat alg again one more time
                    // console.log(`repeat loop for ${i}`)
                    j--
                    repeatforNukes=true
                }

                
            }
        }
        //add number of attacks per village
        console.log("map_nr_destination",map_nr_destination)
        for(let i=0;i<list_info_launch.length;i++){
            let nr_to=map_nr_destination.get(list_info_launch[i].coordDestination)
            list_info_launch[i].nr_to=nr_to
        }
        console.log("list_info_launch",list_info_launch)


        list_info_launch.sort((o1,o2)=>{
            return (new Date(o1.landing_time).getTime() > new Date(o2.landing_time).getTime())?1:
            (new Date(o1.landing_time).getTime() < new Date(o2.landing_time).getTime())?-1:0
            
        })
        $(".hide_btn_show").show()
        if(document.getElementsByClassName("active")[0].classList.contains("own") && ( select_type=="nukes" || select_type=="fangs")){
            $(".hide_btn_delete").show()
        }else{
            $(".hide_btn_delete").hide()
        }

        $("#btn_show").off("click")
        $("#btn_show").on("click",()=>{
            showLaunches(list_info_launch)
        })

        //only for nukes/fangs , delete coord 
        $("#btn_delete").off("click")
        $("#btn_delete").on("click",()=>{
            if(confirm("are you sure you want to delete coords?")){
                console.log("delete coord")
                
                if(document.getElementsByClassName("active")[0].classList.contains("own") && ( select_type=="nukes" || select_type=="fangs")){
                    if($(".active textarea").val().match(/\d+\|\d+/g)!=null){
                        let coords=Array.from($(".active textarea").val().match(/\d+\|\d+/g))
                        for(let i=0;i<list_info_launch.length;i++){
                            let index = coords.indexOf(list_info_launch[i].coordDestination);
                            console.log("index",index)
                            if (index !== -1) {
                                coords.splice(index, 1);
                            }
                        }
                        console.log("coords",coords)
                        $(".active textarea").val(coords.join(" "))
                        saveOwnData()


                    }
                }

            }
        })

        console.log("nrFakesPerVillage",nrFakesPerVillage)



        shuffleArray(list_href)
        console.log(list_href)
        
        /////////////////////////////////////////////////////create button for tabs//////////////////////////////////////////
    
        $(".open_tab").remove();
        if(selectModLaunch=="open tabs"){
            
            let nr_buttons=Math.ceil(list_href.length/nrSplits);
            let delayTab=parseInt(document.getElementById("delay_tabs").value)
            delayTab=(Number.isNaN(delayTab)==true || delayTab<200)?200:delayTab


            for(let i=0;i<nr_buttons;i++){
                // console.log("createButton")
                let startFrom=i*nrSplits;
                let stopTo=(i*nrSplits)+nrSplits
                if((i*nrSplits)+nrSplits>list_href.length)
                    stopTo=list_href.length
    
                let btn=document.createElement("button")
                btn.classList="btn evt-confirm-btn btn-confirm-yes open_tab"
                btn.innerText="[ "+startFrom+" - "+stopTo+" ]";
                btn.style.margin="5px"
                btn.onclick=function(){
                    let current_hrefs= list_href.slice(startFrom,stopTo)
                    // console.log(current_hrefs)
                    // console.log(btn)
                    btn.classList.remove("evt-confirm-btn")
                    btn.classList.remove("btn-confirm-yes")
                    btn.classList.add("btn-confirm-no")
                    
                    for(let j=0;j<current_hrefs.length;j++){
                        window.setTimeout(()=>{
                            window.open(current_hrefs[j], '_blank')
                            console.log(new Date().getTime())
                        },delayTab*j)
                    
                    }
                    
                    $(".open_tab").prop('disabled', true)
                    window.setTimeout(()=>{
                        $(".open_tab").prop('disabled', false) 
                    },delayTab*(stopTo-startFrom))
    
    
                }
                document.getElementById("div_open_tabs").appendChild(btn)
                
            }

        }
        else if(selectModLaunch=="go to rally"){
            
            console.log("go to rally");
            let current_href=list_href.pop();
            localStorage.setItem(game_data.world+"launchFakes",JSON.stringify(list_href))
            window.open(current_href);
        }
        else{
            UI.ErrorMessage("select option fake!")
        }
    } catch (error) {
        console.log(error)
        if(error.toString().includes("points") || error.toString().includes("current_interval")){
            UI.ErrorMessage("database is not updated, run the script again",2000)
            let filename_innoDB=game_data.world+"infoVillages"
            localBase.removeItem(filename_innoDB)
            await getInfoVIllages()
            
        }
    }


}


function checkWindow(start_window,stop_window,coord_origin, coord_target,speedTroop){
    let field = calcDistance(coord_origin,coord_target)
    let time_travel = field * speedTroop
    let serverTime = document.getElementById("serverTime").innerText
    let serverDate = document.getElementById("serverDate").innerText.split("/")
    serverDate=serverDate[1]+"/"+serverDate[0]+"/"+serverDate[2]
    let date_current = new Date(serverDate+" "+serverTime).getTime()

    let date_land = new Date(date_current+time_travel).getTime()
    
    if(date_land >= start_window.getTime()  && date_land <= stop_window.getTime())
        return true
    else
        return false


}


function calculateLandingTime(coord_origin, coord_target,speedTroop){
    let field = calcDistance(coord_origin,coord_target)
    let time_travel = field * speedTroop
    let serverTime = document.getElementById("serverTime").innerText
    let serverDate = document.getElementById("serverDate").innerText.split("/")
    serverDate=serverDate[1]+"/"+serverDate[0]+"/"+serverDate[2]
    let date_current = new Date(serverDate+" "+serverTime).getTime()

    let date_land = new Date(date_current+time_travel).getTime()
    return parseDate(date_land)

}

function parseDate(time){
    let date=new Date(time)

    let year=date.getFullYear();
    let month=("00"+(date.getMonth()+1)).slice(-2)
    let day=("00"+date.getDate()).slice(-2)
    let hours=("00"+date.getHours()).slice(-2)
    let minutes=("00"+date.getMinutes()).slice(-2)
    let seconds=("00"+date.getSeconds()).slice(-2)
    let result=`${month}/${day}/${year} ${hours}:${minutes}:${seconds}`
    return result
}


function showLaunches(list_info_launch){
    // console.log("aici",list_info_launch)

    let html_table=`
    <table id="table_show" class=""  style="width:100%;height:700px; overflow:auto;background-color:${getColorDarker(backgroundAlternateTableOdd,headerColorDarken)};">
        <tr style="  position: sticky;top: 0;z-index: 10;">
        <td style="text-align:center; width:auto; background-color:${getColorDarker(backgroundAlternateTableOdd,headerColorDarken)};border: 1px solid ${borderColor}">
            <center style="margin:10px"><font color="${textColor}">nr</font></center>
        </td>
        <td style="text-align:center; width:auto; background-color:${getColorDarker(backgroundAlternateTableOdd,headerColorDarken)};border: 1px solid ${borderColor}" colspan="2">
            <a href="#" id="order_by_from"><center style="margin:10px"><font color="${textColor}">from</font></center></a>
        </td>
        <td style="text-align:center; width:auto; background-color:${getColorDarker(backgroundAlternateTableOdd,headerColorDarken)};border: 1px solid ${borderColor}" colspan="2">
            <a href="#" id="order_by_to"><center style="margin:10px"><font color="${textColor}">to</font></center></a>
        </td>

        `;
    for(let i=0;i<units.length;i++){
    if(units[i]!="militia" && units[i]!="snob"){
            html_table+=`<td class="fm_unit hide_${units[i]}" style="text-align:center;width:auto; background-color:${getColorDarker(backgroundAlternateTableOdd,headerColorDarken)};margin:2px;border: 1px solid ${borderColor}"><img src="https://dsen.innogamescdn.com/asset/1d2499b/graphic/unit/unit_${units[i]}.png"></td>`
        }
    }
    html_table+=`
        <td style="text-align:center; width:auto; background-color:${getColorDarker(backgroundAlternateTableOdd,headerColorDarken)};border: 1px solid ${borderColor}">
            <a href="#" id="order_by_landing"><center style="margin:10px"><font color="${textColor}">landing time</font></center></a>
        </td>
    </tr>
    `
    for(let i=0;i<list_info_launch.length;i++){
        let header=(i%2==0)?backgroundAlternateTableEven:backgroundAlternateTableOdd

        html_table+=`
            <tr>
                <td style="text-align:center; width:auto; background-color:${header};border: 1px solid ${borderColor}">
                    <center style="margin:5px"><font color="${textColor}">${i}</font></center>
                </td>
                <td style="text-align:center; width:auto; background-color:${header};border: 1px solid ${borderColor}" >
                    <a href="${game_data.link_base_pure}info_village&id=${list_info_launch[i].coordOriginId}"><center><font color="${textColor}">${list_info_launch[i].coordOrigin}</font></center></a>
                </td>
                <td style="text-align:center; width:auto; background-color:${header};border: 1px solid ${borderColor}" >
                    <center style="margin:5px"><font color="${textColor}">${list_info_launch[i].nr_from}</font></center>
                </td>
                <td style="text-align:center; width:auto; background-color:${header};border: 1px solid ${borderColor}" >
                    <a href="${game_data.link_base_pure}info_village&id=${list_info_launch[i].coordDestinationId}"><center><font color="${textColor}">${list_info_launch[i].coordDestination}</font></center></a>
                </td>
                <td style="text-align:center; width:auto; background-color:${header};border: 1px solid ${borderColor}" >
                    <center style="margin:5px"><font color="${textColor}">${list_info_launch[i].nr_to}</font></center>
                </td>`
            for(let j=0;j<list_info_launch[i].nrCells;j++){
                let value=list_info_launch[i].templateFakes[units[j]]
                value=(value==undefined)?0:value
                let title=(value==0)?"#4f2f2f":"#00bf00"


                html_table+=`
                <td style="text-align:center; width:auto; background-color:${header};border: 1px solid ${borderColor}" >
                    <center style="margin:5px;font-weight: bold"><font color="${title}">${value}</font></center>
                </td>`
            }        

            html_table+=`
            <td style="text-align:center; width:auto; background-color:${header};border: 1px solid ${borderColor}">
                <center style="margin:5px"><font color="${textColor}">${list_info_launch[i].landing_time}</font></center>
            </td>
            </tr>`
    }



    html_table+=`</tbody></table>`
    Dialog.show("content",html_table)
    if($("#select_type_attack").val()=="fakes"){
        $(".hide_knight").hide()
    }

    $("#order_by_from").on("click",()=>{
        list_info_launch.sort((o1,o2)=>{
            return (o1.nr_from > o2.nr_from)?-1:(o1.nr_from < o2.nr_from)?1:0
        })
        console.log("order by destination")
        $(".popup_box_close").click()
        showLaunches(list_info_launch)

    })
    $("#order_by_to").on("click",()=>{
        list_info_launch.sort((o1,o2)=>{
            return (o1.nr_to > o2.nr_to)?-1:(o1.nr_to < o2.nr_to)?1:0
        })
        console.log("order by origin")
        console.log(list_info_launch)
        $(".popup_box_close").click()
        showLaunches(list_info_launch)

    })
    $("#order_by_landing").on("click",()=>{
        list_info_launch.sort((o1,o2)=>{
            return (new Date(o1.landing_time).getTime() > new Date(o2.landing_time).getTime())?1:
            (new Date(o1.landing_time).getTime() < new Date(o2.landing_time).getTime())?-1:0
        })
        console.log("order by landing time")
        $(".popup_box_close").click()
        showLaunches(list_info_launch)

    })
}



function createTableGetCoords(){

    let html_table=`
    <center>
    <table id="table_get_coords"  border="1" style="width: 70%;" class="scriptTable">
        <tr>
            <td>Players:</td>
            <td colspan="4"><input type="text" style="text-align:left;width:98%;font-size:18px" id="input_players"  class="scriptInput" placeholder="name player1, name player2, name player3"></td>
        </tr>
        <tr>
            <td>Tribes:</td>
            <td colspan="4"><input type="text" style="text-align:left;width:98%;font-size:18px" id="input_tribes" class="scriptInput" placeholder="name tribe1, name tribe2, name tribe3"></td>
        </tr>
        <tr>
            <td>Continents:</td>
            <td colspan="4"><input type="text" style="text-align:left;width:98%;font-size:18px" id="input_continents" class="scriptInput" placeholder="54,55,65"></td>
        </tr>
        <tr>
            <td>Min coord:</td>
            <td colspan="2"><input type="number" class="scriptInput" style="text-align:center;font-size:18px" id="input_x_min" min="0" max="1000" placeholder="X"></td>
            <td colspan="2"><input type="number" class="scriptInput" style="text-align:center;font-size:18px" id="input_y_min" min="0" max="1000" placeholder="Y"></td>
        
        </tr>
        <tr>
            <td>Max coord:</td>
            <td colspan="2"><input type="number" style="text-align:center;font-size:18px" id="input_x_max" min="0" max="1000" class="scriptInput" placeholder="X"></td>
            <td colspan="2"><input type="number" style="text-align:center;font-size:18px" id="input_y_max" min="0" max="1000" class="scriptInput" placeholder="Y"></td>

        </tr>
        <tr>
            <td>Dist from center:</td>
            <td><input type="number" style="text-align:center;font-size:18px" id="input_radius" min="0" max="1000" class="scriptInput" placeholder="R"></td>
            <td>fields from:</td>
            <td><input type="number" style="text-align:center;font-size:18px" id="input_center_x" min="0" max="1000" class="scriptInput" placeholder="X"></td>
            <td><input type="number" style="text-align:center;font-size:18px" id="input_center_y" min="0" max="1000" class="scriptInput" placeholder="Y"></td>

 
        </tr>

    </table>

    </div></center>
    `

    if(document.getElementById("table_get_coords")==null)
        document.getElementById("div_get_coords").innerHTML=html_table
    else{

        $("#div_get_coords").toggle(500)
    }    

}

function getContinent(coord){
    let [x,y]=Array.from(coord.split("|")).map(e=>parseInt(e))
    for(let i=0;i<1000;i+=100){//x axes
        for(let j=0;j<1000;j+=100){//y axes
            if(i>=x && x<i+100   &&    j>=y && y<j+100){
                let nr_continent= parseInt(y/100)+""+parseInt(x/100)
                return nr_continent
            }
        }
    }
}

function getCoordsGrabber(mapVillage){
    let playersName= Array.from(document.getElementById("input_players").value.toLowerCase().split(",")).filter(item => item);
    let tribesName= Array.from(document.getElementById("input_tribes").value.toLowerCase().split(",")).filter(item => item)
    let continents= Array.from(document.getElementById("input_continents").value.split(",")).filter(item => item)
    let xMin= parseInt(document.getElementById("input_x_min").value)
    let yMin= parseInt(document.getElementById("input_y_min").value)
    let xMax= parseInt(document.getElementById("input_x_max").value)
    let yMax= parseInt(document.getElementById("input_y_max").value)

    let radius= parseInt(document.getElementById("input_radius").value)
    let xCenter= parseInt(document.getElementById("input_center_x").value)
    let yCenter= parseInt(document.getElementById("input_center_y").value)


    let result_coords=[]

    Array.from(mapVillage.keys()).forEach(coord=>{
        try {
            let obj=mapVillage.get(coord)
            let isValid=true



            // console.log(obj)
            //check for players names
            if(playersName.length>0){
                let found=false
                for(let j=0;j<playersName.length;j++){
                    if(playersName[j].trim() == obj.playerName.toLowerCase()){//let coord get through next filter
                        found=true
                        break;
                    }
                }
                if(found==false)
                    isValid=false
            }
            
            //check for tribes names
            if(tribesName.length>0){
                let found=false
                for(let j=0;j<tribesName.length;j++){
                    if(tribesName[j].trim() == obj.tribeName.toLowerCase()){//let coord get through next filter
                        found=true
                        break;
                    }
                }
                if(found==false)
                    isValid=false 
            }
            
            //check for continents
            if(continents.length>0){
                let found=false
                for(let j=0;j<continents.length;j++){
                    if(continents[j].trim() == getContinent(coord)){//let coord get through next filter
                        found=true
                        break;
                    }
                }
                if(found==false)
                    isValid=false 
            }
            

            let[x,y]=coord.split("|")
            //for x min
            if(Number.isNaN(xMin)==false && isValid==true){
                isValid = (x >= xMin)?true:false
            }
            //for y min
            if(Number.isNaN(yMin)==false && isValid==true){
                isValid = (y >= yMin)?true:false
            }
            //for x max
            if(Number.isNaN(xMax)==false && isValid==true){
                isValid = (x <= xMax)?true:false
            }
            //for y max
            if(Number.isNaN(yMax)==false && isValid==true){
                isValid = (y <= yMax)?true:false
            }


            if(Number.isNaN(radius)==false && Number.isNaN(xCenter)==false && Number.isNaN(yCenter)==false && isValid==true){
                isValid=(calcDistance( xCenter+"|"+yCenter, coord)<radius)?true:false
            }



            if(isValid==true){
                result_coords.push(coord)
            } 

        } catch (error) {}
        
    })
    
    // console.log("result_coords",result_coords)
    return result_coords.join(" ")
}


// javascript:$.getScript('https://dl.dropboxusercontent.com/s/2q29vaqbibe6tph/fakeScriptMain.js?dl=0');void(0)


