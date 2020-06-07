const Discord = require('Discord.js');
const client = new Discord.Client();
const { config } = require('dotenv')
const request = require('request');
const cheerio = require('cheerio');

var titles = [];
var titlesSoon = [];
var popularList = [];

require("http").createServer(async (req,res) => { 
    res.statusCode = 200; res.write("ok"); res.end(); }).listen(3000, () => console.log("Now listening on port 3000"));

function text() {
    request('https://www.whats-on-netflix.com/', function(err, resp, body) {
        if(!err && resp.statusCode == 200) {
            var $ = cheerio.load(body)
            $('a', '#header-bottom').each(function() {
                var url = $(this).attr('href');
                var urls = []; 
                urls.push(url);

                request(url, function (error, response, body) {
                    if (url.includes('whats-new')) {
                        var $page = cheerio.load(body);
                        var links = [];
                        var relNumbers = [];
                        var numOfReleases = [];
                        var dateRange = "";

                        /* the range in dates in which a title was released.
                           the range of dates' length is 7 days 
                           (ex: released between 05/16/20 - 05/09/20) */
                        dateRange = $page('b', '.notification-area').text();

                        $page('em').each(function() {
                            if ($page(this).text().includes('no new titles')) {
                                relNumber = '0 TV series added and 0 movies added';
                                relNumbers.push(relNumber);
                            }
                            else {
                                relNumber = $page(this).text();
                                relNumbers.push(relNumber);
                            }
                        });

                        // get the sum of total number of releases (TV shows and movies) for a day
                        for (var i = 0; i < relNumbers.length; i++) {
                            var strReleases = String(relNumbers[i].match(/\d+/g));
                            var integerReleases = strReleases.split(',').map(Number);
                            var sumReleases = arr => arr.reduce((a, b) =>  a + b, 0);
                            numOfReleases.push(sumReleases(integerReleases));
                            var totalSumReleases = sumReleases(numOfReleases);
                        }

                        // obtain title name
                        $page('.new-title-right').each(function() {
                            var title = $page(this).find('h5').text();
                            titles.push(title);
                        })

                        // obtain link to netflix 
                        $page('.title-buttons').each(function(){
                            var link = $page(this).find('a').attr('href');
                            links.push(link);
                        })

                        //string modification
                        for (var i = 0; i < titles.length; i++) {
                            titles[i] = "\n***" + titles[i] + "***\nLink: " + links[i];
                        } 

                    } 
                    else if (url.includes('coming-soon')) {
                        var $page = cheerio.load(body);

                        //for each title, get the closest date (the h4 date that is above)
                        $page('.title').each(function() {
                            var dateRelease = $page(this).prev('.date-header').text();
                            var soonTitles = $page(this).find('h5').text();
                            // if the release date is the same for multiple titles, only include the first date (for formatting purposes)
                            if (dateRelease !== '') {
                                titlesSoon.push("\n**" + dateRelease + "**");
                            }
                            titlesSoon.push(soonTitles);
                        });
                    }

                    else if (url.includes('most-popular')) {
                        var $page = cheerio.load(body);
                        var top10 = [];

                        $page('table').first().find('th').each(function(){
                            top10.push($page(this).text());
                        });

                        $page('table').first().find('td').each(function(){
                            top10.push($page(this).text());
                        });

                        while (top10.length != 0) {
                            var desiredRow = [];
                            desiredRow = top10.slice(0, 3);
                            popularList.push(desiredRow);
                            top10.splice(0, 3);
                        }  
                        
                    }
                })
            })
        }
    }); 
}

text()

config({
    path: __dirname + "/.env";
});

client.on("ready", () => {
    console.log("I'm online!");

});

client.on("message", async message => {
    const prefix = "!";

    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    
    switch(args[0]) {
        case 'new':
            message.channel.send(dateRange)
            for (var i = 0; i < titles.length; i++){
                //titles.tostring().length
                if(titles[i].length > 2000) {
                    //let half = Math.floor(titles.length / 2)
                    var firstHalf = titles[i].substring(0, 1999);
                    var secondHalf = titles[i].substring(1999, titles[i].length);
                    /* titlesFirstHalf = titles.slice(0, half)
                    titlesSecondHalf = titles.slice(half, titles.length) */
                    message.channel.send(firstHalf);
                    message.channel.send(secondHalf);
                }
                else {
                    message.channel.send(titles[i]);
                }
           }
            break;
        case 'soon':
            message.channel.send(titlesSoon);
            break;

        case 'popular':
            message.channel.send("**" + popularList[0][0] + " " + popularList[0][1] + "    /    " + popularList[0][2] + "**");
            for (var i = 1; i < popularList.length; i++) {
                message.channel.send(popularList[i][0] + ": " + popularList[i][1] + " / " + popularList[i][2]);
            }
            break;


    }

    
});

client.login(process.env.TOKEN);
