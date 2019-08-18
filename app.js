var express = require('express');
var path = require('path');

const config = require('./config');

var bodyParser = require('body-parser')

var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({limit: '50mb'}));

app.get('/', function (req, res) {
  res.render('index');
});

const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

var status_parsing = true;

io.on('connection', socket => {
  console.log('Пользователь подключился');
  socket.on('disconnect', () => {
    console.log('Пользователь отключился');
  });
  socket.on('parsing', async (msg) => {
    if (msg == 'begin') {
      let options = new chrome.Options();
      options.addArguments("--headless");
      options.addArguments("--disable-gpu");
      options.addArguments("--no-sandbox");

      let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
      try {
          await driver.get('https://legalbet.ru/match-center/tournaments/liga-1/');
          io.emit('parsing status', 'Открыли браузер')
          let elements = await driver.findElements(By.className('link tab-title lazy'));
          elements[1].click();
          //await driver.findElement(By.xpath('//*[@id="archive-seasons"]/div/div[3]/i')).click();

          //*[@id="archive-seasons"]/div/div[2]/div[1]
          //*[@id="archive-seasons"]/div/div[2]/div[1]
          //*[@id="archive-seasons"]/div/div[2]/div[2]/div[2]

          await driver.sleep(2000);

          await driver.findElement(By.xpath('//*[@id="archive-seasons"]/div/div[2]/div[1]')).click();

          let select_options = await driver.findElements(By.xpath('//*[@id="archive-seasons"]/div/div[2]/div[2]/div'));
          let colss = select_options.length;
          for (let z=2; z < colss+1; z++) {
            
            await driver.findElement(By.xpath(`//*[@id="archive-seasons"]/div/div[2]/div[2]/div[${z}]`)).click();
            let block = await driver.findElements(By.xpath(`//*[@id="archive"]/div[${z}]/div[2]/div`));

            io.emit('parsing status', 'Обрабатываем данные');

            for (let x=0; x < block.length; x++) {
                let table = await block[x].findElement(By.xpath('table/tbody'));
                let tr = await table.findElements(By.tagName('tr'));

                for (let i=0; i < tr.length; i++) {
                    try {
                        let name = await tr[i].findElement(By.xpath('td[1]/a')).getText();
                        let p1 = await tr[i].findElement(By.xpath('td[3]')).getText();
                        let xx = await tr[i].findElement(By.xpath('td[4]')).getText();
                        let p2 = await tr[i].findElement(By.xpath('td[5]')).getText();
                        let tm25 = await tr[i].findElement(By.xpath('td[6]')).getText();
                        let tb25 = await tr[i].findElement(By.xpath('td[7]')).getText();

                        let clasP1 = await tr[i].findElement(By.xpath('td[3]')).getAttribute('class');
                        let clasXx = await tr[i].findElement(By.xpath('td[4]')).getAttribute('class');
                        let clasTm25 = await tr[i].findElement(By.xpath('td[6]')).getAttribute('class');

                        let item = [];

                        item.push(name);

                        item.push(p1);
                        item.push(xx);
                        item.push(p2);

                        if (String(clasP1).indexOf('green-text') != -1) {
                          item.push(p1);
                          item.push('П1');
                        } else if (String(clasXx).indexOf('green-text') != -1) {
                          item.push(xx);
                          item.push('Х');
                        } else {
                          item.push(p2);
                          item.push('П2');
                        }


                        // Для выявления победителя
                        /* if (String(clasP1).indexOf('green-text') != -1) {
                            item.push(p1);
                            item.push(0);
                            item.push(0);
                        } else if (String(clasXx).indexOf('green-text') != -1) {
                            item.push(0);
                            item.push(xx);
                            item.push(0);
                        } else {
                            item.push(0);
                            item.push(0);
                            item.push(p2);
                        }

                        if (String(clasTm25).indexOf('green-text') != -1) {
                            item.push(tm25);
                            item.push(0);
                        } else {
                            item.push(0);
                            item.push(tb25);
                        } */

                        io.emit('parsing data', JSON.stringify(item));

                    } catch (e) {
                        io.emit('parsing status', `Страница ${z-1} из ${colss}. Обработано ${x+1} из ${block.length}`);
                        continue;
                    }
                }

                io.emit('parsing status', `Страница ${z-1} из ${colss}. Обработано ${x+1} из ${block.length}`);
                
                if (!status_parsing) {
                  break;
                }
            }
            if (!status_parsing) {
              break;
            }
            await driver.sleep(2000);
            await driver.findElement(By.xpath('//*[@id="archive-seasons"]/div/div[2]/div[1]')).click();
          }

          driver.quit();

          io.emit('parsing status', 'Парсинг завершен');

      } catch (e) {
          console.log(e);
      }
    }
  });
  socket.on('parsing stop', (msg) => {
    status_parsing = false;
  })
});

http.listen(config.PORT, () =>
  console.log(`Example app listening on port ${config.PORT}!`)
);