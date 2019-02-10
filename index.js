const fetch = require("node-fetch");
const opn = require("opn");

const WIZZAIR_API_ENDPOINT = 'https://be.wizzair.com/9.5.9/Api/asset/farechart';
const WIZZAIR_PAGE = `https://wizzair.com/#/booking/select-flight/${process.argv[2]}/${process.argv[3]}/${process.argv[4]}/`;
const body = {
    adultCount: 1,
    childCount: 0,
    dayInterval: 3,
    flightList: [
        { 
            departureStation: process.argv[2], 
            arrivalStation: process.argv[3], 
            date: process.argv[4]
        }
    ],
    isRescueFare: false,
    wdc: false
};

(async function() {
    let currentPrice = await getNewestTicketPrice();
    if (!currentPrice) {
        console.log('No flight found for the date you entered!');
        return;
    }
    console.log(`Current ticket price is: ${currentPrice.amount} ${currentPrice.currencyCode}`);

    while (true) {
        try {
          const latestPrice = await getNewestTicketPrice();
    
          if (latestPrice.amount < currentPrice.amount) {
            console.log(`Newest ticket price is: ${latestPrice.amount} ${latestPrice.currencyCode}`);
    
            // book your tickets
            opn(WIZZAIR_PAGE);
            return;
          }
          else if (latestPrice.amount > currentPrice.amount) {
              console.log('Prices are going up! :(');
              console.log(`Newest ticket price is: ${latestPrice.amount} ${latestPrice.currencyCode}`);
              currentPrice = latestPrice;
          }
        } catch (err) {
          console.error("Error looping", err);
        }
    
        await sleep(900000);
    }
})();

async function getNewestTicketPrice() {
    const response = await fetch(WIZZAIR_API_ENDPOINT, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Rigor/1.0.0; http://rigor.com)', },
    }).then(res => res.json())
    .catch(error => console.log("Error fetching data", error));
    
    const foundFlights = response.outboundFlights;
    const flightMatch = foundFlights.find(flight => flight.priceType === 'price' 
        && Date.parse(flight.date) === Date.parse(`${process.argv[4]}T00:00:00`));
    if (flightMatch) {
        return flightMatch.price;
    }
    return;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }