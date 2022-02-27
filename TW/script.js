var jqxhr = $.get("http://www.twstats.co.uk/uk60/index.php?page=player&id=920079&tab=history", function () {
    alert("success");
})

$('.vis').find('tr.row_a, tr.row_b').find('td:nth-of-type(1)').each((i, el) => console.log($(el).text().trim()))