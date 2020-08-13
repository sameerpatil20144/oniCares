
module.exports = {
    setAlertMsg: (msg, variant, callback, timeout = 4000) => {
        const setMsg = {
            msg: msg,
            variant: variant
        }
        callback(setMsg)
        setTimeout(() => {
            callback({})
        }, timeout)
    },
    errMsg: (msg, err, cchpi) => {
        let returnMsg = msg + '';
        if (err.hasOwnProperty()) {
            err.forEach(element => {
                returnMsg += ` ${element} \n`
            });
        }
        return returnMsg
    }
}