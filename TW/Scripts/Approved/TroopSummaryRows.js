/*
* Script Name: New Barbs Attacker
* Version: 1.0.0
* Last Updated: 29th July 2023
* Author: higamy
* Author URL: 
* Author Contact: higamy#9637 (Discord)
* Approved: 
* Approved Date: 
* Mod: 
* 
*/

/* CHANGE LOG
29th July 2023 - Initial Release - v1.0.0
*/

/* Possible Improvements

*/

/*--------------------------------------------------------------------------------------
* This script can NOT be cloned and modified without permission from the script author.
--------------------------------------------------------------------------------------*/


const LOCAL_STORAGE_NAME = "TroopSummaryRowsConfig";
let config = JSON.parse(localStorage.getItem(LOCAL_STORAGE_NAME));
// If no config found then get default
if (config == null) {
    config = {
        "Row To Summarise": 4,
        "Open In New Tab": true,
    }
}
let openInNewWindow = config["Open In New Tab"];

// Redirect to overview troops page if not on it
const urlParams = new URLSearchParams(window.location.search);
const screenParam = urlParams.get('screen');
const modeParam = urlParams.get('mode');




if ((modeParam != 'units') | (screenParam != 'overview_villages')){
  UI.SuccessMessage("Redirecting to troops overview...", 1000)

  urlParams.set('mode', 'units');
  urlParams.set('screen', 'overview_villages');
  urlParams.set('page','-1');

  // Perform the redirect
  window.location.replace(`game.php?/${urlParams}`);
}

let plunderTable = $("#units_table")[0];

// Add the drop down for which row to summarise
let settingsDiv = document.createElement('div');
settingsDiv.setAttribute('style', 'margin: 10px 0px; background: #fff5da; padding: 10px');

let dropDownDiv = document.createElement('div');
let dropDownText = document.createElement('span');
dropDownText.innerText = "Select metric:";
dropDownText.setAttribute('style', 'font-weight: bold; margin-right: 10px;')
dropDownDiv.appendChild(dropDownText);

let dropDown = document.createElement('select');
dropDownDiv.appendChild(dropDown);

let idx = 0;
$($(plunderTable).find('tbody')[0]).find('td:not([class]):not([rowspan]').each((i,el) =>{
   if (el.querySelectorAll('a').length == 0){
      let option = document.createElement('option');
      option.innerText = el.innerText;
      option.setAttribute('value', idx);
      dropDown.appendChild(option);

      idx = idx + 1;
   }
})


dropDown.addEventListener('change', (event) =>{
  updateRows(event.target.value)
});

// Checkbox for whether to open links in a new tab or not
let newTabDiv = document.createElement('div');
newTabDiv.setAttribute('style', 'display: flex; align-items: center; margin-top: 10px;')

let newTabLabel = document.createElement('label');
newTabLabel.innerText = "Open in new tab:";
newTabLabel.setAttribute('for','newTabCheckbox');
newTabLabel.setAttribute('style', 'font-weight: bold; margin-right: 5px;')
newTabDiv.appendChild(newTabLabel);

let newTabCheckbox = document.createElement('input');

newTabCheckbox.setAttribute('type','checkbox');
newTabCheckbox.setAttribute('id','newTabCheckbox');
newTabCheckbox.checked = openInNewWindow;
newTabDiv.appendChild(newTabCheckbox);

// Add the settings options to the DOM  
settingsDiv.appendChild(dropDownDiv);
settingsDiv.appendChild(newTabDiv);
plunderTable.parentNode.insertBefore(settingsDiv,plunderTable)

// Update the urls to be opened in new tabs or not as set by the user
setUrlOpenBehaviour();

function sortRows(columnIndex){
  
  if (columnIndex!=currentIdx) descending = true; else descending =!descending;
  currentIdx = columnIndex;

  var rows = Array.from(plunderTable.getElementsByTagName('tbody'));

  
  rows.sort(function(rowA, rowB) {

    // Use the currently visible row to be the one to sort by
    var cellA = $($(rowA).find('tr:not(.invisible)')).find('td')[columnIndex].textContent;
    var cellB = $($(rowB).find('tr:not(.invisible)')).find('td')[columnIndex].textContent;

    if (descending){
      return cellB - cellA
    }
    else{
      return cellA - cellB
    }
    
  });
  
  // Reinsert the sorted rows into the table
  
  rows.forEach(function(row,i) {
    // Get the right shading styles in the table
    if (i%2 == 0){
      row.classList.remove("row_b");
      row.classList.add("row_a");
    }
    else{
      row.classList.remove("row_a");
      row.classList.add("row_b");
    }

    //tbody.appendChild(row);
    plunderTable.removeChild(row);
    plunderTable.appendChild(row);
  });
}
  
let currentIdx;
let descending = true;

// Set the preselected value to be total
dropDown.selectedIndex = config["Row To Summarise"];
updateRows(config["Row To Summarise"]);

const styleElement = document.createElement('style');
styleElement.textContent = `.invisible{ display:none }`;
document.head.appendChild(styleElement);

function prepareTable(){

  let headerEl;
 
  $(plunderTable).find('tbody').each((i, el) => {
  
      headerEl= $(el).find('td:first')[0]
      headerEl.setAttribute('rowSpan', 1); // Needed to fix formatting
  
          
      $(el).find('tr:nth-child(n+2)').each((i,el2) => {
        let headerCopy = headerEl.cloneNode(true);
        el2.insertBefore(headerCopy, el2.firstChild);
      })
    })

      // Add the sorting method to the header row
  $(plunderTable).find('tr:first>th').each((i, el) => {
    if ((i>1) & (i<plunderTable.rows[0].cells.length -1)) el.style.cursor = 'pointer';
    el.addEventListener('click',() => {sortRows(i)});
})
}

prepareTable();

function updateRows(rowNum = 0){

  // Update the config
  config["Row To Summarise"] = rowNum;
  localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(config));

  $(plunderTable).find('tbody').each((i, el) => {
  

      let rowsToRemove = $(el).find(`tr:not(:nth-child(5n+${parseInt(rowNum) + 1}))`);
      rowsToRemove.each((j,el2) =>{
        el2.classList.add('invisible');
      })

      let rowsToKeep = $(el).find(`tr:nth-child(5n+${parseInt(rowNum) + 1})`);
      rowsToKeep.each((j,el2) =>{
        el2.classList.remove('invisible');
      })
      //rowsToRemove.remove()
  
      //lastRow = $(el).find('tr:last');
  
      //$(lastRow).prepend(headerEl)
  })
  
}


// Whether to open in a new tab or not
function setUrlOpenBehaviour (){


  if (newTabCheckbox.checked){
    $(plunderTable).find('.quickedit-content>a:not(.rename-icon)').each((i, el) => {
      el.setAttribute('target', '_blank');
      openInNewWindow = true;
    })
  }
  else{
    $(plunderTable).find('.quickedit-content>a:not(.rename-icon)').each((i, el) => {
      el.removeAttribute('target');
      openInNewWindow = false;
    })
  }

    // Update the config
    config["Open In New Tab"] = openInNewWindow;
    localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(config));
}

newTabCheckbox.addEventListener('change',setUrlOpenBehaviour)


