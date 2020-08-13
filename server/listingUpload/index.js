const mysql = require("mysql");
const AWS = require("aws-sdk");
AWS.config.region = "ap-south-1";
const constants = require("./constants");
const secretName = process.env.SECRETE;
const lambda = new AWS.Lambda();

// Create a Secrets Manager client
const client = new AWS.SecretsManager();
const secret = client
    .getSecretValue({
        SecretId: secretName
    })
    .promise();

AWS.config.update({
    AWS_ACCESS_KEY: constants.AWS_KEYS.AWS_ACCESS_KEY,
    AWS_SECRETE: constants.AWS_KEYS.AWS_SECRETE
});

let con;
exports.handler = async (event) => {
    if (!con || con.state == "disconnected" || con === "undefined") {
        await secret;
        con = secret
            .then(result => {
                var data = JSON.parse(result.SecretString);
                var connection = mysql.createConnection({
                    host: data.lims_host,
                    user: data.lims_user,
                    password: data.lims_password,
                    database: data.lims_db
                });
                connection.connect();
                return connection;
            }).catch(err => {
                throw err;
            });
    }

    try {
        con = await con;
    } catch (e) {
        return await response(200, 0, "error while fetching connection", null, new Error("error while fetching connection"));
    }


    // Check Method
    let headers = event['headers'] ? event['headers'] : false;


    // Header Auth Checking
    try {
        var auth = await invokeFunction("EMR_userAuth", headers);
        var authBody = JSON.parse(auth.body);
        const { status, err } = authBody;
        if (!status) {
            return await response(401, 0, "Authentication failure!", null, err);
        } else {
            (authBody && authBody.data != undefined && authBody.data.user != undefined && authBody.data.user.id != undefined) ? authBody.data.user.id : '';
        }
    } catch (e) {
        return await response(500, 0, "Authentication Error!" + e.message, null, new Error("Authentiaction Error!" + e.message));
    }

    // Validation checking
    try {
        var getList = [];
        getList = await getListItems(con);
        let result = {};
        result = {
            'list': getList
        };
        return await response(constants.HTTP_STATUS.success, 1, "Listing", result, null);
    } catch (error) {
        return await response(constants.HTTP_STATUS.error, 0, "Error while matching visit", null, error);
    }
};

//Function to fetch all  entry in the Table
async function getListItems(con) {
    return new Promise(
        function (resolve, reject) {
            //Query to fetch all records on basis of from Table
            con.query(`SELECT u.name,vs.scan_b_remarks,vs.visit_id 
            FROM visit_scan_study vs INNER JOIN user u ON vs.user_id = u.id `, function (err, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }
    );
}

// promise function to invoke other lambda function 
async function invokeFunction(functionName = "", payload = {}) {
    const lambdaParams = {
        FunctionName: functionName,
        Payload: JSON.stringify(payload)
    };
    return new Promise(
        function (resolve, reject) {
            lambda
                .invoke(
                    lambdaParams,
                    async function (err, authData) {
                        if (err) {
                            reject(await response(0, "error in auth!", null, err));
                        } else {
                            resolve(JSON.parse(authData.Payload));
                        }
                    }
                );
        }
    );
}


//Function to get response in json
async function response(statusCode = 200, status = 0, msg = "Command executed", data = {}, err = {}, mobile_msg = "") {

    return new Promise(function (resolve, reject) {

        //JSON response 
        let result = {
            status: Number(status), msg: msg, mobile_msg: mobile_msg != "" ? mobile_msg : msg, data: data,
            err: err
        };

        let response = {
            statusCode: statusCode,
            headers: {},
            body: JSON.stringify(result),
            isBase64Encoded: false
        };
        resolve(response);

    });
}