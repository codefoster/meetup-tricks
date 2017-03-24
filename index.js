let request = require('request-promise');
let q = require('q');
let _ = require('underscore');
let config = require('config');
let cla = require('command-line-args');

let meetupApiKey = config.get('meetupApiKey');
let page = 10000;

let options = cla([
    { name: 'groups', alias: 'g', type: String, multiple: true }
])

let groups = options.groups.map(g => { return { name: g } });

q.all(groups.map(g => {
    g.results = [];

    return request(buildUrl(g.name, 0))
        .then(r => {
            let meta = JSON.parse(r).meta;
            let pages = Math.ceil(meta.total_count / meta.count);
            let results = [];
            for (let i = 0; i < pages; i++)
                setTimeout(() => {
                    //results.push(request(buildUrl(g.name, i)));
                }, 1000 * pages)
            return q.all(results);
        })
        .then(results => {
            //flatten results
            results = results.map(result => JSON.parse(result));
            results.forEach(result => {
                result.results.forEach(result => {
                    g.results.push({ id: result.id, name: result.name });
                });
            });
        })
        .catch(e => console.log(e));
}))
    .then(() => {
        groups.forEach(g => {
            console.log(`${g.name} has ${g.results.length} members`);
        })
        let ids = groups.map(g => g.results.map(r => r.id));
        let intersect = _.intersection.apply(_, ids);

        console.log(`${intersect.length} members are shared across all groups`);
    });



function buildUrl(group, offset) {
    offset = offset | 0;
    page = page | 5000;
    return `https://api.meetup.com/2/members?&sign=true&photo-host=public&group_urlname=${group}&page=${page}&offset=${offset}&key=${meetupApiKey}`;
}