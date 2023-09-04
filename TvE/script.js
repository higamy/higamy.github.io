gold_wisps = [
    {
        'Name': 'Wisp 1',
        'Count': 0,
        'Gold': 512,
        'LumberGain': 0.125
    },
    {
        'Name': 'Wisp 2',
        'Count': 0,
        'Gold': 1024,
        'LumberGain': 0.25
    },
    {
        'Name': 'Wisp 3',
        'Count': 0,
        'Gold': 2048,
        'LumberGain': 0.5
    },
    {
        'Name': 'Wisp 4',
        'Count': 0,
        'Gold': 4096,
        'LumberGain': 1
    },
    {
        'Name': 'Wisp 5',
        'Count': 0,
        'Gold': 20480,
        'LumberGain': 6
    },
    {
        'Name': 'Wisp 6',
        'Count': 2,
        'Gold': 81920,
        'LumberGain': 36
    },
    {
        'Name': 'Wisp 7',
        'Count': 1,
        'Gold': 262144,
        'LumberGain': 216
    }
]

gold_mines = [
    {
        'Name': 'Mine 1',
        'Count': 0,
        'Lumber': 6,
        'GoldGain': 1,
        'Duration': 8 * 60
    },
    {
        'Name': 'Mine 2',
        'Count': 15,
        'Lumber': 64,
        'GoldGain': 8,
        'Duration': 8 * 60
    },
    {
        'Name': 'Mine 3',
        'Count': 30,
        'Lumber': 1024,
        'GoldGain': 32,
        'Duration': 8 * 60
    },
    {
        'Name': 'Mine 4',
        'Count': 30,
        'Lumber': 4096,
        'GoldGain': 128,
        'Duration': 8 * 60
    },
    {
        'Name': 'Mine 5',
        'Count': 30,
        'Lumber': 16384,
        'GoldGain': 512,
        'Duration': 8 * 60
    },
    {
        'Name': 'Mine 6',
        'Count': 0,
        'Lumber': 65356,
        'GoldGain': 2048,
        'Duration': 16 * 60
    },
    {
        'Name': 'Mine 7',
        'Count': 0,
        'Lumber': 262144,
        'GoldGain': 8192,
        'Duration': 4 * 60
    },
    {
        'Name': 'Mine 8',
        'Count': 0,
        'Lumber': 999999,
        'GoldGain': 32768,
        'Duration': 2 * 60
    }
]

class GoldMine {
    Duration;
    GoldRate;
    constructor(goldRate, duration) {
        this.GoldRate = goldRate;
        this.Duration = duration;
    }
}

let allLinkInputs = [];


class LinkedInput {
    InputObject;
    InputRange;
    CurrentValue;

    constructor(inputObj, mainContainer) {
        const container = document.createElement('div');

        const curVal = document.createElement('span');

        let inputRange = document.createElement('input');
        inputRange.setAttribute("max", "30");
        inputRange.setAttribute("min", "0");
        inputRange.setAttribute("value", inputObj["Count"].toString());
        inputRange.setAttribute("type", "range");

        const label = document.createElement('label');
        label.innerHTML = inputObj["Name"];

        container.appendChild(label);
        container.appendChild(inputRange);
        container.appendChild(curVal);
        container.classList.add("inputContainer");


        mainContainer.appendChild(container);


        allLinkInputs.push(this);

        // Assign properties
        this.CurrentValue = curVal;
        this.InputObject = inputObj;
        this.InputRange = inputRange;

        this.UpdateLabelValue();

        inputRange.addEventListener("input", () => {

            this.UpdateLabelValue()
            updateAllInputs();
            calculateData();
        })
    }

    UpdateLabelValue() {
        this.CurrentValue.innerHTML = this.InputRange.value;
    }

    SetValueFromRange() {
        this.InputObject['Count'] = this.InputRange.value;
    }
}



function updateAllInputs() {
    for (let linkedInput of allLinkInputs) {
        linkedInput.SetValueFromRange();
    }
}

let controlsContainer = document.getElementById('controlsContainer');
let wispContainer = document.getElementById('wispContainer');
let mineContainer = document.getElementById('mineContainer');

// Set up the sliders
for (let wisp of gold_wisps) {
    new LinkedInput(wisp, wispContainer)
}

for (let mine of gold_mines) {
    new LinkedInput(mine, mineContainer)
}



let options = {
    chart: {
        backgroundColor: 'rgba(0,0,0,0)',
    },

    title: {
        text: 'Time to Wisp 9'
    },
    subtitle: {
        text: ''
    },

    yAxis: {
        title: {
            text: 'Resource'
        }
    },

    xAxis: {
        title: {
            text: 'Time (mins)'
        },
        accessibility: {
            rangeDescription: ''
        },
        labels: {
            formatter: function () {
                return this.value;
            }
        }
    },

    series: [{
        name: 'Gold',
        data: [],
        color: '#cfaf0c',
        lineWidth: 4
    }, {
        name: 'Lumber',
        data: [],
        color: '#3ed914',
        lineWidth: 4
    }],

    annotations: [{
        draggable: '',
        labelOptions: {
            backgroundColor: 'rgba(255,255,255,0.5)',
            verticalAlign: 'bottom',
            y: -30
        },
        labels: [{}]
    }],

    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
    },

    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            },
            pointStart: 1
        }
    },

    responsive: {
        rules: [{
            condition: {
                maxWidth: 500
            },
            chartOptions: {
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                }
            }
        }]
    }
}



let chart = Highcharts.chart('imageContainer', options)



let x_series;

function zip(arrays) {
    return arrays[0].map(function (_, i) {
        return arrays.map(function (array) { return array[i] })
    });
}

function calculateData() {
    let allGoldMines = [];
    targetGold = 999999
    LumberGain = 0

    gold = 0
    Lumber = 0
    time = 0

    goldVals = [gold]
    lumberVals = [Lumber]
    timeVals = [time]

    goldTarget = 999999

    labels = []

    // Extract the multiplier
    const multiplier = parseInt(document.querySelector('input[type="radio"]:checked').value);

    let goldGainPassive = 512 * multiplier;

    while (gold < goldTarget) {

        // Update the gains
        for (let wisp of gold_wisps) {
            if ((wisp['Count'] > 0) & (gold > wisp['Gold'])) {
                // Add the annotation
                label = {
                    point: {
                        xAxis: 0,
                        yAxis: 0,
                        x: time / 60,
                        y: gold
                    },
                    text: wisp['Name']
                }
                labels.push(label)

                // Perform calculations
                gold = gold - wisp['Gold']
                wisp['Count'] = wisp['Count'] - 1
                LumberGain = LumberGain + wisp['LumberGain'] * multiplier
            }

        }


        for (let mine_config of gold_mines) {
            if ((mine_config['Count'] > 0) & (Lumber > mine_config['Lumber'])) {
                let goldMine = new GoldMine(mine_config['GoldGain'], mine_config['Duration']);
                allGoldMines.push(goldMine);

                // Perform calculations
                Lumber = Lumber - mine_config['Lumber']
                mine_config['Count'] = mine_config['Count'] - 1
                //goldGain = goldGain + mine_config['GoldGain']
            }
        }

        let goldGain = goldGainPassive

        for (let mine of allGoldMines) {
            goldGain = goldGain + mine.GoldRate * multiplier;
            mine.Duration = mine.Duration - 1 * multiplier;

            // Expire mines when run out of time
            if (mine.Duration < 0) {
                allGoldMines = allGoldMines.filter(function (item) {
                    return item !== mine
                })
            }

        }



        // Increment values
        gold = gold + goldGain
        Lumber = Lumber + LumberGain
        time = time + 1

        // Store values
        lumberVals.push(Lumber)
        goldVals.push(gold)
        timeVals.push(Math.round(100 * time / 60) / 100)
    }


    /*
        labels: [{
            point: {
                xAxis: 0,
                yAxis: 0,
                x: 5,
                y: 5
            },
            text: 'blah blah blah'
        }]*/

    chart.update({
        series: [{
            name: 'Gold',
            data: zip([timeVals, goldVals])
        },
        {
            name: 'Lumber',
            data: zip([timeVals, lumberVals])
        }]
        , title: {
            text: `Time to Wisp 8: ${Math.round(10 * time / 60) / 10} minutes`
        },
        annotations: [{
            draggable: '',
            labelOptions: {
                backgroundColor: 'rgba(255,255,255,0.5)',
                verticalAlign: 'top',
                borderColor: '#3ed914',
                borderRadius: 15,
                borderWidth: 3
            },
            labels: labels
        }]
    })

    // Convert to minutes
    timeVals = timeVals / 60
}
updateAllInputs();
calculateData();

const allRadios = document.querySelectorAll("input[type='radio'")
for (let radioInput of allRadios) {
    radioInput.addEventListener('change', () => {
        updateAllInputs();
        calculateData();
    })
}

setChartSize = function () {

    let height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    height = height - controlsContainer.scrollHeight;
    height = Math.min(height, 800); // Cap the size

    chart.setSize(null, height)
}
window.onresize = setChartSize;


// Set the height to be full screen
var body = document.body,
    html = document.documentElement;
setChartSize();

//print(f"Time to reach {goldTarget} gold: {round(timeVals[-1],1)}")


/*
chart.options = {


};*/