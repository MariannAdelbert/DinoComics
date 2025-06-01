import * as cheerio from 'cheerio';
import fs from 'fs';
import fetch from 'node-fetch';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function getCache(name){
    if(fs.existsSync(`./cache/${name}.html`)){
        return fs.readFileSync(`./cache/${name}.html`, 'utf8');
    }
    return false;
}

function setCache(name, value){
    if(!fs.existsSync(`./cache/`)){
        fs.mkdirSync('./cache');
    }
    fs.writeFileSync(`./cache/${name}.html`, value);
}

async function downloadImage(url, filename){
    if (!fs.existsSync('./images')) {
        fs.mkdirSync('./images');
    }
    const res = await fetch(url);
    const buffer = await res.buffer();
    fs.writeFileSync(`./images/${filename}`, buffer);
}

async function scrapeComics(start, end) {
    for (let i = start; i >= end; i--) {
        let data = getCache(i);
        if (!data) {
            await sleep(1000);
            console.log(`📥 LIVE FETCH: comic ${i}`);
            const res = await fetch(`https://www.qwantz.com/index.php?comic=${i}`);
            data = await res.text();
            setCache(i, data);
        }

        const $ = cheerio.load(data);
        const img = $('img[src^="comics/"]');

        if (img.length === 0) {
            console.log(`⚠️ Comic ${i} not found or no image.`);
            continue;
        }

        const imgSrc = img.attr('src');
        const title = img.attr('title');
        const alt = img.attr('alt');
        const fullImgUrl = `https://www.qwantz.com/${imgSrc}`;

        console.log(`🦕 Comic ${i}`);
        console.log(`URL: ${fullImgUrl}`);
        console.log(`Title: ${title}`);
        console.log(`Alt: ${alt}`);
        console.log('---');

        await downloadImage(fullImgUrl, `comic-${i}.png`);
    }
}

scrapeComics(4365, 4360);
