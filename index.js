const express = require('express');
const path = require('path');
const logger = require('./middleware/logger');
const fetch = require('node-fetch');
const bodyparser = require('body-parser');

const app = express();

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

//init middleware
//app.use(logger);

app.post('/champ-rotation', (req, res) => {
    let apikey = req.body['key'];
    console.log(apikey);
    //fetch json for champions
    fetch('http://ddragon.leagueoflegends.com/cdn/9.3.1/data/en_US/champion.json')
        //return the json
        .then(response => response.json())
        .then(champList => {
            //object to store the key:name of free champs
            let champs = {};
            //populate champs object
            Object.keys(champList['data']).forEach(champ => {
                champs[champList['data'][champ].key] = champList['data'][champ].id;
            });
            //fetch IDs for free champs
            fetch('https://na1.api.riotgames.com/lol/platform/v3/champion-rotations?api_key=' + apikey)
                //return the JSON
                .then(response => response.json())
                //get the names and icon of the free champs. set as 'unkown' with generic champion icon if not found
                .then(champsjson => {
                    let freeChamps = {
                        "freeChampionIds": [],
                        "freeChampionIdsForNewPlayers": []
                    };
                    champsjson["freeChampionIds"].forEach(id => {
                        imgid = (champs[id]) ? id : -1;
                        champName = (champs[id]) ? champs[id] : 'unknown';
                        freeChamps["freeChampionIds"].push({
                            'name': champName,
                            'icon': 'raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/' + imgid + '.png'
                        });
                    });
                    champsjson["freeChampionIdsForNewPlayers"].forEach(id => {
                        imgid = (champs[id]) ? id : -1;
                        champName = (champs[id]) ? champs[id] : 'unknown';
                        freeChamps["freeChampionIdsForNewPlayers"].push({
                            'name': champName,
                            'icon': 'raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/' + imgid + '.png'
                        });
                    });
                    //send JSON of free champs
                    console.log({ 'status': 'success', ...freeChamps });
                    res.json({ 'status': 'success', ...freeChamps });
                })
                //send error if caught
                .catch(e => {
                    res.json({ 'status': 'fail', 'error': 'invalid key' });
                });
        })
        .catch(e => {
            res.json({ 'status': 'fail', 'error': 'invalid key' });
        });
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`listening to port ${PORT}`));