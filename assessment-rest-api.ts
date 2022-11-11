import https from 'https';
import path from 'path'

/**
 * #### APPROCH 1 is very slow: Runtime is 380 to 450 sec. ###
 * Recursively get all Episodes [Based on info.next from result] -> info.next returns null if no next url is present
 * Loop Through Every Episode.charcters array and get character info from api and store it [cache the character in CHARACTER_MAP]
 * API call: 3 episode request + 800+ character request
 * 
 * 
 * ### APPROCH 2 is very fast: Runtime is 5 to 6 second. ###
 * Recursively get all Episodes [Based on info.next from result] -> info.next returns null if no next url is present
 * Store all character id in CHARACTER_SET
 * Chunk it by 100 and send 100 chunk to get 100 character in 1 api request in total there 800+ characters to 8 api request
 * API call: 3 episode request + 8 character request
 * 
 */
let APPROCH = 2;

const CHARACTER_SET = new Set<string>();
const CHARACTER_STORE: { [key: string]: ICharacter } = {};


/**
 * Runtime = 380 to 450 sec.
 * @param currentResult: Array<IEpisode>
 * @returns newcurrentResult: Array<IEpisode>
 */
async function approch1(currentResult: Array<IEpisode>) {
    for (let x = 0; x < currentResult.length; x++) {
        if (currentResult[x].characters && currentResult[x].characters.length) {
            for (let y = 0; y < currentResult[x].characters.length; y++) {
                if (CHARACTER_STORE[currentResult[x].characters[y]]) {
                    currentResult[x].characters[y] = CHARACTER_STORE[currentResult[x].characters[y]]
                } else {
                    const characterApi: ICharacter = await makeApiRequest(currentResult[x].characters[y])
                    CHARACTER_STORE[currentResult[x].characters[y]] = characterApi
                    currentResult[x].characters[y] = characterApi;
                }
            }
        }
    }
    return currentResult
}


/**
 * Runtime = 5 to 6 second.
 * @param currentResult: Array<IEpisode>
 */
async function approch2(currentResult: Array<IEpisode>) {
    for (const eInfo of currentResult) {
        if (eInfo.characters && eInfo.characters.length) {
            for (const cInfo of eInfo.characters) {
                CHARACTER_SET.add(path.basename(cInfo))
            }
        }
    }
}

/**
 * Recursively get all Episodes currently there are 3 pages
 * @param url: string
 * @param episodes: Array<IEpisode>
 * @returns void
 */
async function getAllEpisodesRecursive(url: string, episodes: Array<IEpisode>) {
    try {
        if (!url) return;
        const response: IEpisodeInfo = await makeApiRequest(url)
        if (response) {

            if (APPROCH === 1) {
                const currentResult = await approch1(response.results);
                episodes.push(...currentResult)
            } else {
                await approch2(response.results);
                episodes.push(...response.results)
            }

            if (response.info.next) {
                await getAllEpisodesRecursive(response.info.next, episodes)
            }
        }
    } catch (err) {
        console.error(err)
    }
}

/**
 * #### MAIN Function ####
 */
(async () => {
    try {
        const episodes: Array<IEpisode> = [];
        await getAllEpisodesRecursive("https://rickandmortyapi.com/api/episode", episodes)

        if (APPROCH === 2) {
            const chunksCharacterUrl = [...chunks([...CHARACTER_SET], 100)]
            for (const cReq of chunksCharacterUrl) {
                const allCharcInfo: Array<ICharacter> = await makeApiRequest("https://rickandmortyapi.com/api/character/" + (cReq.join(",")));
                allCharcInfo.map(a => {
                    CHARACTER_STORE[a.id] = a
                })
            }

            for (let eInx = 0; eInx < episodes.length; eInx++) {
                episodes[eInx].characters = episodes[eInx].characters.map(c => CHARACTER_STORE[path.basename(c)])
            }
        }

        console.log(episodes)

    } catch (err) {
        console.error(err)
    }
})();

/////---------------------All interface------------------------------///////
interface IEpisode {
    "id": number,
    "name": string,
    "air_date": string,
    "episode": string,
    "characters": Array<string | any>,
    "url": string,
    "created": string
}

interface IEpisodeInfo {
    "info": {
        "count": number,
        "pages": number,
        "next": string,
        "prev": null | number
    },
    "results": Array<IEpisode>
}

interface ICharacter {
    "id": string,
    "name": string,
    "status": string,
    "species": string,
    "type": string,
    "gender": string,
    "origin": {
        "name": string,
        "url": string
    },
    "location": {
        "name": string,
        "url": string
    },
    "image": string,
    "episode": Array<string>,
    "url": string,
    "created": string
}


/////---------------------LIB Functions------------------------------///////
/**
 * Make APi Request
 * @param url string
 * @returns Promise<T>
 */
async function makeApiRequest<T>(url: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const request = https.request(url, (response: any) => {
            let data = '';
            response.on('data', (chunk: any) => {
                data = data + chunk.toString();
            });

            response.on('end', () => {
                const body: T = JSON.parse(data);
                resolve(body)
            });
        })

        request.on('error', (error: any) => {
            reject(error)
        });
        request.end()
    })
}

/**
 * Generator function to create chunk of array
 * @param arr: Array<T>
 * @param n: number
 */
function* chunks<T>(arr: Array<T>, n: number): Generator<T[], void> {
    for (let i = 0; i < arr.length; i += n) {
        yield arr.slice(i, i + n);
    }
}