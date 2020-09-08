import request from "request";
import Store from "electron-store";

const axios = require('axios').default;

const storedCookie = new Store();
let abb = request.jar();
let serviceID = null;

export function deleteCookies() {
  storedCookie.clear();
  console.log('cookie deleted');
}

export function storeCookieData(data) {
  let cookieRaw = data.cookie[1].toString();
  let cookieArray = cookieRaw.split(";");
  storedCookie.set('refreshToken', data.res.refreshToken);
  storedCookie.set('expires', cookieArray[1]);
  storedCookie.set('cookie', cookieRaw);
}

export function abbLogin(user,pass) {
  let returnValue = ''
  axios({
    method: 'post',
    url: 'https://myaussie-auth.aussiebroadband.com.au/login',
    data: {
      username: user,
      password: pass
    },
    headers: {
      'User-Agent': 'aunt-v1'
    },
  })
  .then(function (response) {
    console.log(response);
    returnValue = true
  })
  .catch(function (error) {
    console.log(error.response);
    returnValue = false
  });

  return returnValue
  /*console.log('Fired abb login');
  request.post({
    url: 'https://myaussie-auth.aussiebroadband.com.au/login',
    headers: {
      'User-Agent': 'aunt-v1'
    },
    form: {
      username: user,
      password: pass
    },
    followAllRedirects: true,
    jar: abb
  }, (error, response, body) => {
    if (error) {
      console.log('login error from api');
    } else {
      let res = JSON.parse(body);
      if (res.message === 'The given data was invalid.') {
        console.log('login error from response');
        deleteCookies();
        returnValue = false;
      } else if (res.error === 'invalid_credentials'){
        console.log('login error from response');
        deleteCookies();
        returnValue = false;
      } else {
        let cookie = abb.getCookies('https://aussiebroadband.com.au', 'Cookie="myaussie_cookie'); // "key1=value1; key2=value2; ...
        console.log(cookie);
        let cookieData = {
          cookie,
          res
        };
        storeCookieData(cookieData);
        console.log('ddd')
        returnValue = true;
      }
    }
  });
  return returnValue */
}