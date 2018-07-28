const yargs = require('yargs');
const axios = require('axios');
const fs = require('fs');

const argv = yargs
    .options({
        address: {
            demand: false, 
            alias: 'a',
            describe: 'Address to fetch weather for',
            string: true
        },
        defaultAddress: {
            demand: false,
            alias: 'd',
            describe: 'Set default address to fetch weather',
            string: true
        }
    })
    .help()
    .alias('help', 'h')
    .argv;



const fetchDefaultLocation = () => {
    try {
        const defaultAddress = fs.readFileSync('default-address.json');
        return JSON.parse(defaultAddress);
    } catch (e) {
        return null;
    }
};

const setDefaultLocation = (defaultAdd) => {
    fs.writeFileSync('default-address.json', JSON.stringify(defaultAdd));
};


if (argv.defaultAddress) {
    setDefaultLocation(argv.defaultAddress);
}

const userAddress = argv.address || fetchDefaultLocation()|| 'long beach';

const address = encodeURIComponent(userAddress);
const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}`;

axios.get(geocodeUrl)
    .then((result) => {
        if (result.data.status === 'ZERO_RESULTS') {
            throw new Error('Unable to find that address');
        }
        console.log(`Weather forecast: ${result.data.results[0].formatted_address}`);

        const lat = result.data.results[0].geometry.location.lat;
        const lng = result.data.results[0].geometry.location.lng;
        const weatherUrl = `https://api.darksky.net/forecast/e2586f6211d8766e450e57ca6922ec7c/${lat},${lng}`;

        return axios.get(weatherUrl, {
            params: {
                units: 'si'
            }
        })
            .then((result) => {

                const temperature = result.data.currently.temperature;
                const apparentTemperature = result.data.currently.apparentTemperature

                console.log(
                    `---------------->\n
Current Temperature: ${temperature} °C
Feels like: ${apparentTemperature}`);

            })
            .catch((err) => {
                console.log(err);
            })

    }).catch((err) => {
        if (err.code === 'ENOTFOUND') {
            console.log('Unable to connect API servers');
        } else {
            console.log(err.message);
        }
    });