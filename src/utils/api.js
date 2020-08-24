const getOutages = (serviceID) => {
    console.log('Fired get outages data');
    sendMessage('asynchronous-message', 'UI-notification', 'Checking outages');
    sendMessage('asynchronous-message', 'loading');
    return new Promise((resolve, reject) => {
      request.get({url: 'https://myaussie-api.aussiebroadband.com.au/nbn/'+serviceID+'/outages',
      headers: {'User-Agent': 'aunt-v1'},jar: global.abb
      }, (error, response, body) => {
        if(error){
          console.log(error);
        }
        else{
          resolve(JSON.parse(body));
        }
        });
    })
}


const showOutages =  () =>{
    sendMessage('asynchronous-message', 'showOutages', outages);
}