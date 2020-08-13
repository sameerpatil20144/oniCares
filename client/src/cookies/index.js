import Cookies from 'js-cookie'
var inFiveMinutes = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
export const setCookie = (key, value) => {
    Cookies.set(key, value, {
        expires: inFiveMinutes
    })
}

export const getCookie = (key) => {
    const result = Cookies.get(key);
    return result;
}

export const removeCookie = (key, value) => {
    Cookies.remove(key)
}