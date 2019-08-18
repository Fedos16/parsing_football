$(document).ready(() => {

    $(document).delegate('#open_browser_x', 'click', () => {
        $('.status p').text('Пожалуйста подождите ...');
        let start = new Date();
        $.ajax({
            type: 'POST',
            url: "/api/events/open",
            success: data => {
                if (!data.ok) {
                    $('.status p').text(`Упс! Произошла ошибка.`);
                } else {
                    $('.status p').text(`Парсинг завершен. Затрачено времени: ${(new Date()-start)/1000} сек.`);
                    let arr = data.arr;
                    $('.content table tbody').text('');
                    for (let i=0; i < arr.length; i++) {
                        if (arr[i].length == 6) {
                            $('.content table tbody').append(`
                                <tr>
                                    <td>${i+1}</td>
                                    <td>${arr[i][0]}</td>
                                    <td>${arr[i][1]}</td>
                                    <td>${arr[i][2]}</td>
                                    <td>${arr[i][3]}</td>
                                    <td>${arr[i][4]}</td>
                                    <td>${arr[i][5]}</td>
                                </tr>
                            `);
                        }
                    }
                    $('.content table').show();
                    console.log(data);
                }
            }
        });
    });

    var socket = io();

    $(document).delegate('#open_browser', 'click', (e) => {
        $('.status p').text('Начинаем парсить данные ...');
        $(e.target).attr('disabled', 'disabled');
        $(e.target).text('Загрузка данных ...');
        $('#parsing_stop').removeAttr('disabled');
        socket.emit('parsing', 'begin');
        $('.content table tbody').html('');
    });

    socket.on('parsing status', msg => {

        $('.status p').text(msg);
        
        if (msg == 'Парсинг завершен') {
            $('#open_browser').removeAttr('disabled');
            $('#open_browser').text('Начать парсинг');
        }
    });

    socket.on('parsing data', data => {
        let arr = JSON.parse(data);
        if (data.length > 0) {
            $('.content table').show();
            let col = $('.content table tbody tr').length + 1;
            $('.content table tbody').append(`
                <tr>
                    <td>${col}</td>
                    <td>${arr[0]}</td>
                    <td>${arr[1]}</td>
                    <td>${arr[2]}</td>
                    <td>${arr[3]}</td>
                    <td>${arr[4]}</td>
                    <td>${arr[5]}</td>
                </tr>
            `);
        }
    });

    $(document).delegate('#parsing_stop', 'click', (e) => {
        socket.emit('parsing stop');
        $(e.target).attr('disabled', 'disabled');
    });

});