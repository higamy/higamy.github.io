let troopCounts = []
let villageNames = []
let villageCoords = []

$('#units_table').find('.row_marker').each((i, el) => {
    let name = $(el).find('.quickedit-label').text().trim()
    let coordPos = name.indexOf("|") - 3;

    // Extract the name and the co-ordinates
    let villageName = name.slice(0, coordPos - 2);
    let villageCoord = name.slice(coordPos, coordPos + 7);

    villageNames.push(villageName);
    villageCoords.push(villageCoord);

    let troopCountVillage = []

    $($(el).find('tr:nth-of-type(5)')).find('td.unit-item').each((j, el2) => {
        troopCountVillage.push(parseInt($(el2).text()))
    })
    troopCounts.push(troopCountVillage)
})


// Get the image links
let troop_icons = []
let troop_names = []
$($('#units_table').find('thead')).find('img').each((i, el) => {
    troop_names.push($(el).attr('title'));
    troop_icons.push($(el).attr('src'));
})

// Generate an array with the total troop counts
let totalTroopCounts = []
for (i = 0; i < troop_names.length; i++) {
    let totalTroopCount = 0
    for (j = 0; j < troopCounts.length; j++) {
        totalTroopCount = totalTroopCount + troopCounts[j][i]
    }
    totalTroopCounts.push(totalTroopCount)
}

let tHead = $($('#units_table').find('thead'))[0]
let topRow = $($('#units_table').find('thead')).find('tr')[0]
let newRow = topRow.cloneNode(true)

// Add the total troop counts
for (i = 0; i < troop_names.length; i++) {
    let tableCell = $(newRow).find(`th:nth-of-type(${i + 3})`)
    tableCell.html(totalTroopCounts[i])
}
$(newRow).find(`th:nth-of-type(1)`).html('Total')
$(newRow).find(`th:last`).html('')

// Insert the new row into the table
tHead.appendChild(newRow)

