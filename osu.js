require("dotenv").config()
const fs = require('fs').promises;

async function getTopBeatmapset(access_token){
    if (!access_token) {
        console.error('Access token is missing.');
        return;
    }

    let beatmapData = {};
    let cursorString = null;
    let page = 0;

    while (Object.keys(beatmapData).length < 1000) {
        try {
            const url = new URL('https://osu.ppy.sh/api/v2/beatmapsets/search');
            url.searchParams.append('sort', 'plays_desc');
            if (cursorString) {
                url.searchParams.append('cursor_string', cursorString);
            }

            const request = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            if (!request.ok) {
                throw new Error(`Request failed with status ${request.status}`);
            }

            const data = await request.json();

            if (!data.beatmapsets || data.beatmapsets.length === 0) {
                console.log('No more beatmapsets found.');
                break;
            }

            data.beatmapsets.forEach(beatmapset => {
                beatmapData[beatmapset.id] = {
                    playcount: beatmapset.play_count,
                    cover: beatmapset.covers['cover@2x'],
                    title: beatmapset.title,
                    creator: beatmapset.creator,
                    audio: beatmapset.preview_url
                };
            });

            console.log(`On page ${++page}`);

            cursorString = data.cursor_string;

            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Error fetching beatmapsets:', error);
            break;
        }
    }

    // Trim to exactly 1000 entries if we got more
    const limitedBeatmapData = Object.fromEntries(
        Object.entries(beatmapData).slice(0, 1000)
    );

    try {
        // Write to mapData.json
        await fs.writeFile('mapData.json', JSON.stringify(limitedBeatmapData, null, 2));
        console.log(`Saved data for ${Object.keys(limitedBeatmapData).length} maps to mapData.json`);
    } catch (error) {
        console.error('Error writing to mapData.json:', error);
    }
}



getTopBeatmapset(process.env.ACCESS_TOKEN)