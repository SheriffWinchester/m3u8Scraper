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

const list = [
    'https://www.osmosis.org/learn/Coronary_circulation?from=/md/organ-systems/cardiovascular-system/physiology/anatomy-and-physiology',
    'https://www.osmosis.org/learn/Cardiac_work?from=/md/organ-systems/cardiovascular-system/physiology/cardiac-cycle-and-pressure-volume-loops',
    'https://www.osmosis.org/learn/Normal_heart_sounds?from=/md/organ-systems/cardiovascular-system/physiology/auscultation-of-the-heart',
    'https://www.osmosis.org/learn/Abnormal_heart_sounds?from=/md/organ-systems/cardiovascular-system/physiology/auscultation-of-the-heart',
    'https://www.osmosis.org/learn/Action_potentials_in_myocytes?from=/md/organ-systems/cardiovascular-system/physiology/myocyte-electrophysiology',
    'https://www.osmosis.org/learn/Electrical_conduction_in_the_heart?from=/md/organ-systems/cardiovascular-system/physiology/electrocardiography/electrical-conduction-in-the-heart',
    'https://www.osmosis.org/learn/Cardiac_conduction_velocity?from=/md/organ-systems/cardiovascular-system/physiology/electrocardiography/electrical-conduction-in-the-heart',
    'https://www.osmosis.org/learn/ECG_rate_and_rhythm?from=/md/organ-systems/cardiovascular-system/physiology/electrocardiography/introduction-to-electrocardiography',
    'https://www.osmosis.org/learn/ECG_cardiac_infarction_and_ischemia?from=/md/organ-systems/cardiovascular-system/physiology/electrocardiography/introduction-to-electrocardiography',
    'https://www.osmosis.org/learn/ECG_cardiac_hypertrophy_and_enlargement?from=/md/organ-systems/cardiovascular-system/physiology/electrocardiography/introduction-to-electrocardiography',
    'https://www.osmosis.org/learn/Pheochromocytoma?from=/md/organ-systems/cardiovascular-system/pathology/vascular-disorders/hypertension',
    'https://www.osmosis.org/learn/Atrial_flutter?from=/md/organ-systems/cardiovascular-system/pathology/cardiac-arrhythmias/supraventricular-tachycardias',
    'https://www.osmosis.org/learn/Rheumatic_heart_disease?from=/md/organ-systems/cardiovascular-system/pathology/cardiac-infections',
    'https://www.osmosis.org/learn/Peripheral_artery_disease:_Pathology_review?from=/md/organ-systems/cardiovascular-system/pathology/cardiovascular-system-pathology-review',
    'https://www.osmosis.org/learn/Valvular_heart_disease:_Pathology_review?from=/md/organ-systems/cardiovascular-system/pathology/cardiovascular-system-pathology-review',
    'https://www.osmosis.org/learn/Ventricular_arrhythmias:_Pathology_review?from=/md/organ-systems/cardiovascular-system/pathology/cardiovascular-system-pathology-review',
    'https://www.osmosis.org/learn/Vasculitis:_Pathology_review?from=/md/organ-systems/cardiovascular-system/pathology/cardiovascular-system-pathology-review',
    'https://www.osmosis.org/learn/Positive_inotropic_medications?from=/md/organ-systems/cardiovascular-system/pharmacology/positive-inotropic-medications',
];

await page.goto('https://www.osmosis.org/login', {waitUntil: 'networkidle2'});
await page.waitForSelector(".login-content-container");
await page.type('input[type="email"]', process.env.OSM_EMAIL);
await page.keyboard.down('Tab');
await page.keyboard.type(process.env.OSM_PWD);
setTimeout(() => {page.click('button[type="submit"]')}, 1000);
await page.waitForNavigation();

// Navigate to the selected page
//await page.goto(url);

async function scrapeFunction(){
    //Main system page, capture an element, check whether the link has a video and retrieve the video links, return an array
    /*let urls =  await page.$$eval('.subtopic-checkbox', links => {
        try {
            //Check whether the link has .svg image, which determines that this link doesn't have a video
            links = links.filter(link => link.querySelector('.thumbnail-image img[src$=".svg"]') === null)
            links = links.map(el => el.querySelector('.subtopic-checkbox a[href*="/learn"]').href)
            return links //array
        } catch(err) {
            alert(err)
        }
    });*/

    //Loop through all links
    async function pagePromise(link){        
        page.on('response', async response => {
            if(
            status = response.status() // we actually have an status for the response
            && !(status > 299 && status < 400) // not a redirect
            && !(status === 204) // not a no-content response
            && response.url().match('data:application/x-mpegURL')
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
    for (links in list) {
        await pagePromise(list[links]);
    }
}
await scrapeFunction();
console.log('Download completed.');
browser.close();
})();