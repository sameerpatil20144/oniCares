import constants from './constants'
import axios from 'axios';

const requestWrapper = ({method, url, formdata}) => {
    return new Promise(function (resolve, reject) {
        axios({
            method: method,
            url: constants.baseUrl + url,
            data: formdata
        })
        .then(function (response) {
            resolve(response);
        })
        .catch(function (error) {
            reject(error);
        });
    });
}

export default requestWrapper;