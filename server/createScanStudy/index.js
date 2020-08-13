const mysql = require("mysql");
const AWS = require("aws-sdk");
AWS.config.region = "ap-south-1";
const constants = require("./constants");
const secretName = process.env.SECRETE;
const lambda = new AWS.Lambda();
const helper = require("./helper");


// Create a Secrets Manager client
const client = new AWS.SecretsManager();
const secret = client
    .getSecretValue({
        SecretId: secretName
    })
    .promise();

let con;
let eventBody;
let d = new Date();
let userId;
exports.handler = async (event, context, callback) => {

    if (!con || con.state == "disconnected" || con === "undefined") {
        await secret;
        con = secret.then(result => {
            var data = JSON.parse(result.SecretString);
            var connection = mysql.createConnection({
                host: data.lims_host,
                user: data.lims_user,
                password: data.lims_password,
                database: data.lims_db
            });
            connection.connect();
            return connection;
        })
            .catch(err => {
                throw err;
            });
    }

    try {
        con = await con;
    } catch (e) {
        return await response(200, 0, "error while fetching connection", null, new Error("error while fetching connection")
        );
    }


    // Check Method
    let headers = event['headers'] ? event['headers'] : false;
    // let headers = constants.headers

    // Header Auth Checking
    try {
        var auth = await invokeFunction("EMR_userAuth", headers);
        var authBody = JSON.parse(auth.body);
        const { status, err } = authBody;
        if (!status) {
            return await response(401, 0, "Authentication failure!", null, err);
        } else {
            userId = (authBody && authBody.data != undefined && authBody.data.user != undefined && authBody.data.user.id != undefined) ? authBody.data.user.id : '';
        }
    } catch (e) {
        return await response(500, 0, "Authentication Error!" + e.message, null, new Error("Authentiaction Error!" + e.message));
    }

    try {
        //Parsing body
        eventBody = event["body"] ? JSON.parse(event["body"]) : {};
        // var eventBody = constants.eventBodyForLocalMashine ? constants.eventBodyForLocalMashine : {};
    } catch (error) {
        return await response(constants.HTTP_STATUS.error, 0, "Error, your sending parameter's not valid", null, error);
    }

    // Required fields.
    let errors = [];

    if (!eventBody.visit_id || eventBody.visit_id <= 0) {
        errors.push("Visit id is required");
    }

    if (errors.length) {
        return await response(constants.HTTP_STATUS.success, 0, "Please fill required fields !!", null, errors);
    }

    //Is VisitId exist Valid?
    try {
        let visitValid = await isVisitIdValid(con, eventBody.visit_id);
        if (!visitValid.length) {
            return await response(constants.HTTP_STATUS.success, 0, "Unknown Visit", [], null);
        }
    } catch (error) {
        return await response(constants.HTTP_STATUS.error, 0, "Error while matching Visit Id", null, error);
    }

    //Is userId exist Valid?
    try {
        let userValid = await isUserIdValid(con, userId);
        if (!userValid.length) {
            return await response(constants.HTTP_STATUS.success, 0, "Unknown User", [], null);
        }
    } catch (error) {
        return await response(constants.HTTP_STATUS.error, 0, "Error while matching userId", null, error);
    }

    //parsing Body
    var requestBody = {
        "visit_id": eventBody.visit_id,
        "user_id": userId,
        "scan_a_k1_right": eventBody.scan_a_k1_right?eventBody.scan_a_k1_right:'',
        "scan_a_k1_left": eventBody.scan_a_k1_left?eventBody.scan_a_k1_left:'',
        "scan_a_k2_right": eventBody.scan_a_k2_right?eventBody.scan_a_k2_right:'',
        "scan_a_k2_left": eventBody.scan_a_k2_left?eventBody.scan_a_k2_left:'',
        "scan_a_axial_length_right": eventBody.scan_a_axial_length_right?eventBody.scan_a_axial_length_right:'',
        "scan_a_axial_length_left": eventBody.scan_a_axial_length_left? eventBody.scan_a_axial_length_left:'',
        "scan_a_acd_right": eventBody.scan_a_acd_right?eventBody.scan_a_acd_right:'',
        "scan_a_acd_left": eventBody.scan_a_acd_left?eventBody.scan_a_acd_left:'',
        "scan_a_iol_power_left": eventBody.scan_a_iol_power_left? eventBody.scan_a_iol_power_left:'',
        "scan_a_iol_power_right": eventBody.scan_a_iol_power_right?eventBody.scan_a_iol_power_right:'',
        "scan_p_cct_right": eventBody.scan_p_cct_right?eventBody.scan_p_cct_right:'',
        "scan_p_cct_left": eventBody.scan_p_cct_left?eventBody.scan_p_cct_left:'',
        "scan_p_iop_right": eventBody.scan_p_iop_right?eventBody.scan_p_iop_right:'',
        "scan_p_iop_left": eventBody.scan_p_iop_left?eventBody.scan_p_iop_left:'',
        "scan_a_iop_left_dropdown": eventBody.scan_a_iop_left_dropdown? eventBody.scan_a_iop_left_dropdown:'',
        "scan_b_remarks": eventBody.scan_b_remarks,
        "added_on":  helper.formatDate(d),
        "updated_on":  helper.formatDate(d)
    };


    //Create new entry in the table
    try {
        let DataId = await createRecord(con, requestBody);
        var reqInsertId = DataId.insertId;
        requestBody['id'] = reqInsertId;
    } catch (error) {
        return await response(constants.HTTP_STATUS.error, 0, "Error while adding data", [], error);
    }

    var requestBodyForImageTable = [];
    try {
        if (eventBody.imageName) {
            for (var i = 0; i < eventBody.imageName.length; i++) {
                requestBodyForImageTable.push([
                    eventBody.imageName[i],
                    reqInsertId,
                    eventBody.type[i]
                ]);
            }
        }
        else {
            console.log('No Images');
        }
    } catch (error) {
        return await response(constants.HTTP_STATUS.error, 0, "Error while fetching image data", [], error.message);
    }

    try {
        if (eventBody.imageName != undefined) {
            await createRecordInImageTable(con, requestBodyForImageTable);
            requestBody['imageDetails'] = requestBodyForImageTable;
            return await response(constants.HTTP_STATUS.success, 1, "Scan study added successfully", requestBody, null);
        }
        return await response(constants.HTTP_STATUS.success, 1, "Scan study added successfully", requestBody, null);
    } catch (error) {
        return await response(constants.HTTP_STATUS.error, 0, "Error while adding data", [], error);
    }
};

//Function to check VisitId exist
async function isVisitIdValid(con, vid = 0) {

    return new Promise(
        function (resolve, reject) {

            //Query to get visitId from Visit table 
            let q = `SELECT id FROM ${constants.DB.visitTable} WHERE id='${vid}' limit 1`;

            con.query(q, function (err, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }
    );
}

//Function to check userId exist
async function isUserIdValid(con, uid = 0) {

    return new Promise(
        function (resolve, reject) {

            //Query to get userId from user table 
            let q = `SELECT id FROM ${constants.DB.userTable} WHERE id='${uid}' limit 1`;
            con.query(q, function (err, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }
    );
}

//Function to insert new entry in the Table
async function createRecord(con, params = {}) {
    return new Promise(
        function (resolve, reject) {

            const query = `INSERT INTO ${constants.DB.visitMasterTable} SET ?`;

            //Query to create new record in Table
            con.query(query, [params], function (err, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }
    );
}

//Function to insert new entry in the Table
async function createRecordInImageTable(con, params = []) {
    return new Promise(
        function (resolve, reject) {
            if (params.length) {
             con.query(`INSERT INTO ${constants.DB.visitImageName} (image_url, image_id, type) VALUES ?`, [params],
                    function (err, rows) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                    });
            }
            else {
                con.query(`INSERT INTO ${constants.DB.visitImageName} (image_url, image_id, type) VALUES ?`, [params],
                    function (err, rows) {
                        if (err) {
                            reject(err);
                        } else {
                            const values = {};
                            resolve(values);
                        }
                    });
            }
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
                status: Number(status), msg: msg,
                mobile_msg: mobile_msg != "" ? mobile_msg : msg,
                data: data,
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
