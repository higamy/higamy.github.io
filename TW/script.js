$('.vis').find('tr.row_a, tr.row_b').find('td:nth-of-type(1)').each((i, el) => {
    let player_name = $(el).text().trim();
    console.log(player_name);

    let player_id = $(el).find('a').attr('href').split('&id=')[1];
    console.log(player_id);


    var jqxhr = $.get(`https://www.twstats.co.uk/uk60/index.php?page=player&id=${player_id}&tab=history`, function (data) {
        console.log(data)
    })

}
)