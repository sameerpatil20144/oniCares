/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import axios from 'axios';
import { getCookie, removeCookie } from '../cookies';
const BASE_URL = "https://staging-emr.mecure.com/api/"

export const postRequest = async (apiName, data) => {
    const url = BASE_URL + apiName;
    const token = await getCookie('access_token');
    const headers = {};
    headers.os = "web";

    if (token) {
        headers.token = token
    }

    try {
        const result = await axios.post(url, data, { headers: headers });
        return result.data
    } catch (error) {
        const { response } = error
        if (response) {
            const { status } = response
            if (status === 401) {
                removeCookie('access_token')
                removeCookie('name');
                window.location.href = "/"
            }
        }
        const responseData = generateErrMsg(error)
        throw new Error((responseData.message));
    }
}

export const putRequest = async (apiName, data) => {
    const url = BASE_URL + apiName;
    const token = await getCookie('access_token');
    const headers = {};
    headers.os = "web";
    if (token) {
        headers.token = token
    }

    try {
        const result = await axios.put(url, data, { headers: headers });
        return result.data
    } catch (error) {
        const { response } = error
        if (response) {
            const { status } = response
            if (status === 401) {
                removeCookie('access_token')
                removeCookie('name');
                window.location.href = "/"
            }
        }
        const responseData = generateErrMsg(error)
        throw new Error((responseData.message));
    }
}

export const getRequest = async (apiName, params = '') => {
    const url = BASE_URL + apiName;
    const token = await getCookie('access_token');
    let headers = {};
    headers.os = "web";
    if (token) {
        headers.token = token
    }
    try {
        const result = await axios.get(url, { params: params, headers: headers });
        return result.data
    } catch (error) {
        const { response } = error
        if (response) {
            const { status } = response
            if (status === 401) {
                removeCookie('access_token')
                removeCookie('name');
                window.location.href = "/"
            }
        }
        const responseData = generateErrMsg(error)
        throw new Error((responseData.message));
    }
}

export const deleteRequest = async (apiName, data) => {
    const url = BASE_URL + apiName;
    const token = await getCookie('access_token');
    const headers = {};
    headers.os = "web";
    if (token) {
        headers.token = token
    }

    try {
        const result = await axios.delete(url, { data: data, headers: headers });
        return result.data
    } catch (error) {
        const { response } = error
        if (response) {
            const { status } = response
            if (status === 401) {
                removeCookie('access_token')
                removeCookie('name');
                window.location.href = "/"
            }

        }
        const responseData = generateErrMsg(error)
        throw new Error((responseData.message));
    }
}

const generateErrMsg = (error) => {

    const { response } = error

    if (response) {
        const { data } = response;
        if (data) {
            const { msg, status, statusCode } = data
            const returnMsg = {
                statusCode: statusCode ? statusCode : 400,
                message: msg ? msg : "Something Went Wrong ! Please Try again later"
            }

            return returnMsg
        }
    } else {
        const returnMsg = {
            message: "Something Went Wrong ! Please Try again later"
        }
        return returnMsg;
    }

}