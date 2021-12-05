const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const { request } = require('http');
puppeteer.use(StealthPlugin());

(async() => {
const browser = await puppeteer.launch({
    executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
    headless:false, 
    defaultViewport:null,
    devtools: true,
    //args: ['--window-size=1920,1170','--window-position=0,0']
    args: ["--window-size=1920,1080", "--window-position=1921,0"]
}); 
const page = await browser.newPage();
let url = 'https://www.osmosis.org/library/md/organ-systems/cardiovascular-system';
let urlPlaylist;
let enckey;
let status;
let text;
const regex = /(?<=URI=")(.*?)(?=")/;

// Navigate to the selected page
await page.goto(url);

async function scrapeFunction(){
    //Main system page, capture an element, check whether the link has a video and retrieve the video links, return an array
    let urls =  await page.$$eval('.subtopic-checkbox', links => {
        try {
            //Check whether the link has .svg image, which determines that this link doesn't have a video
            links = links.filter(link => link.querySelector('.thumbnail-image img[src$=".svg"]') === null)
            links = links.map(el => el.querySelector('.subtopic-checkbox a[href*="/learn"]').href)
            return links //array
        } catch(err) {
            alert(err)
        }
    });

    //Loop through all links
    async function pagePromise(link){        
        page.on('response', async response => {
            if(
            status = response.status() // we actually have an status for the response
            && !(status > 299 && status < 400) // not a redirect
            && !(status === 204) // not a no-content response
            && response.url().match('data:application')
            ) {
                text =  await response.text();
            }
        });    
        //Navigate to the video page for retrieving the playlist link and the encryption key link
        await page.goto(link, {waitUntil: 'networkidle2'});

        /*if(response.status) {
            status = response.status();
        }*/
        await page.waitForSelector('.flex-wrapper');
        let titlePage = await page.$eval('.video-header .title h1', title => {
            title = title.textContent;
            return title;
        });
        //--------------------- page.goto DOESN'T WORK for urlPlaylist(data:application) ---------------------
        //--------------------- Use page._client.send() ---------------------
        /*await page._client.send('Page.navigate', {
            url: urlPlaylist,
        })*/
        fs.writeFile(`/Users/sheriff/Desktop/osm/${titlePage}.m3u8`, text, 'utf8', function(err) {
            if(err) {
                return console.log(err);
            }
            console.log(`The data has been scraped and saved successfully! View it at '/Users/sheriff/Desktop/osm/${titlePage}.m3u8'`);
        });
    }
    for (links in urls) {
        await pagePromise(urls[links]);
    //browser.close();
    }
}
await scrapeFunction();
})();