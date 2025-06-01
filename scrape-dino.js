import * as cheerio from 'cheerio';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function getCache(name){
    if(fs.existsSync(`./cache/${name}.html`)){
        return fs.readFileSync(`./cache/${name}.html`, 'utf-8');
    }
    return false;
}

function setCache(name, value){
    if(!fs.existsSync('./cache')){
        fs.mkdirSync('./cache');
    }
    fs.writeFileSync(`./cache/${name}.html`, value);
}

async function downloadImage(url, filename) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    if (!fs.existsSync('./images')) {
        fs.mkdirSync('./images');
    }
    fs.writeFileSync(`./images/${filename}`, Buffer.from(buffer));
}

function generateIndexHtml(imageFiles) {
    const html = `
<!DOCTYPE html>
<html lang="et">
<head>
  <meta charset="UTF-8" />
  <title>DinoComics - Esimesed 30 koomiksit</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f0f0f0; }
    img { max-width: 100%; margin: 2rem auto; display: block; border: 1px solid #ccc; }
    h1 { text-align: center; }
  </style>
</head>
<body>
  <h1>DinoComics - Esimesed 30 koomiksit</h1>
  ${imageFiles.map(file => `<img src="images/${file}" alt="${file}">`).join('\n  ')}
</body>
</html>
`;
    fs.writeFileSync('index.html', html);
    console.log('\n✅ index.html loodud!');
}

async function main(){
    const maxComic = 4337;
    const countToDownload = 30;
    let savedImages = [];

    for (let comicId = maxComic - countToDownload + 1; comicId <= maxComic; comicId++) {
        let data = getCache(comicId);
        if (!data) {
            await sleep(1000);
            const url = `https://qwantz.com/index.php?comic=${comicId}`;
            console.log(`Laen lehe: ${url}`);
            const res = await fetch(url);
            data = await res.text();
            setCache(comicId, data);
        } else {
            console.log(`Leht ${comicId} võetud cache-st.`);
        }

        const $ = cheerio.load(data);
        const img = $('img[src^="comics/comic2-"]');
        const imgSrc = img.attr('src');

        if (!imgSrc) {
            console.log(`❌ Koomiksi pilt puudub lehel ${comicId}`);
        } else {
            const imgUrl = `https://qwantz.com/${imgSrc}`;
            const filename = path.basename(imgSrc);

            console.log(`\n--- Koomiks #${comicId} ---`);
            console.log(`Pildi URL: ${imgUrl}`);
            console.log(`Salvestan: images/${filename}`);

            await downloadImage(imgUrl, filename);
            savedImages.push(filename);
        }
    }

    generateIndexHtml(savedImages);
}

main();
