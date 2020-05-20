
const Discord = require('Discord.js');
const client = new Discord.Client();
const { config } = require('dotenv')

const request = require('request');
const cheerio = require('cheerio');


var urls = [];
var dates = [];
var relNumbers = [];
var numOfReleases = [];
var sumReleases = [];
var releases = [];
var titles = [];

var dateRange = "";
var dateRelease = "";
var titleMovie = "";
var som = "";
var totalSumReleases = "";
var acc = 0;

var dateObj = new Date();
var month = ('0' + (dateObj.getUTCMonth() + 1)).slice(-2);
var date = ('0' + dateObj.getUTCDate()).slice(-2);
var year = dateObj.getUTCFullYear();
var shortDate = year + '-' + month + '-' + date;
var divId = "#" + shortDate;


require("http").createServer(async (req,res) => { 
    res.statusCode = 200; res.write("ok"); res.end(); }).listen(3000, () => console.log("Now listening on port 3000"));

function text() {
    request('https://www.whats-on-netflix.com/', function(err, resp, body) {
        if(!err && resp.statusCode == 200) {
            var $ = cheerio.load(body)
            $('a', '#header-bottom').each(function() {
                var url = $(this).attr('href');
                urls.push(url);

                request(url, function (error, response, body) {
                    if (url.includes('whats-new')) {
                        var $page = cheerio.load(body);

                        /* the range in dates in which a title was released.
                           the range of dates' length is 7 days 
                           (ex: released between 05/16/20 - 05/09/20) */
                        var dateRange = $page('b', '.notification-area').text();
                        var d8 = $page(divId).text()
                        
                        for (var i = 0; i < 7; i++) {
                            var dateRelease = $page('h4').eq(i).text()
                            dates.push(dateRelease);
                        }    

                        var test = $page('.pad, .group').nextUntil('hr').html()
                        var test1 = $page('.pad, .group').nextUntil('hr').text()

                        $page('em').each(function() {
                            if ($page(this).text().includes('no new titles')) {
                                relNumber = '0 TV series added and 0 movies added';
                                relNumbers.push(relNumber)
                            }
                            else {
                                relNumber = $page(this).text();
                                relNumbers.push(relNumber)
                            }
                        })

                        // get the sum of total number of releases (TV shows and movies) for a day
                        for (var i = 0; i < relNumbers.length; i++) {
                            var strReleases = String(relNumbers[i].match(/\d+/g))
                            var integerReleases = strReleases.split(',').map(Number);
                            var sumReleases = arr => arr.reduce((a, b) =>  a + b, 0);
                            numOfReleases.push(sumReleases(integerReleases));
                            var totalSumReleases = sumReleases(numOfReleases)
                        }

                        $page('.new-title-right').each(function() {
                            var title = $page(this).text()
                            releases.push(title);
                        })

                    for (var i = 0; i < numOfReleases.length; i++) {
                        console.log(dates[i])
                        for (var j = acc; j < acc + numOfReleases[i]; j++){ 
                            titles.push($page('.new-title').eq(j).text())
                            //console.log($page('.new-title').eq(j).text())
                        }
                        acc += numOfReleases[i] 
                             
                    }

                    //string modification
                    for (var i = 0; i < releases.length; i++) {
                        releases[i] = releases[i].replace('Watch on Netflix', '');
                    }

                    } 
                })
            })
        }
    }); 
}

text()

config({
    path: __dirname + "/.env"
});

client.on("ready", () => {
    console.log("I'm online!")

});

client.on("message", async message => {
    const prefix = "!";

    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    
    switch(args[0]) {
        case 'new':
            for (var i = 0; i < titles.length; i++){
                if(titles[i].length > 2000) {
                    var firstHalf = titles[i].substring(0, 1999);
                    var secondHalf = titles[i].substring(1999, titles[i].length);
                    message.channel.send(firstHalf);
                    message.channel.send(secondHalf)
                }
                else {
                    message.channel.send(titles[i]);
                }
                //message.channel.send("done")
            }
            message.channel.send("done")
    }

    
});

client.login(process.env.TOKEN);
