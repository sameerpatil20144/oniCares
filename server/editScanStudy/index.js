const mysql = require("mysql");
const AWS = require("aws-sdk");
AWS.config.region = "ap-south-1";
const constants = require("./constants");
const secretName = process.env.SECRETE;
const helper = require("./helper");
const lambda = new AWS.Lambda();

// Create a Secrets Manager client
const client = new AWS.SecretsManager();
const secret = client
    .getSecretValue({
        SecretId: secretName
    })
    .promise();

let con;
let eventBody;
let d=new Date();
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
        }).catch(err => {
            throw err;
        });
    }
    try {
        con = await con;
    } catch (e) {
        return await response(
            200,
            0,
            "error while fetching connection",
            null,
            new Error("error while fetching connection")
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
            (authBody && authBody.data != undefined && authBody.data.user != undefined && authBody.data.user.id != undefined) ? authBody.data.user.id : '';
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
    if (!eventBody.id || eventBody.id <= 0) {
        errors.push("Id is required");
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

    //Is ID exist or Valid?
    try {
        let idValid = await isIdValid(con, eventBody.id);
        if (!idValid.length) {
            return await response(constants.HTTP_STATUS.success, 0, "Unknown ID", [], null);
        }
    } catch (error) {
        return await response(constants.HTTP_STATUS.error, 0, "Error while matching Visit Id", null, error);
    }

    //parsing Body
    const requestBody = {
        "visit_id": eventBody.visit_id,
        "id": eventBody.id,
        "scan_a_k1_right": eventBody.scan_a_k1_right?eventBody.scan_a_k1_right:'',
        "scan_a_k1_left": eventBody.scan_a_k1_left?eventBody.scan_a_k1_left:'',
        "scan_a_k2_right": eventBody.scan_a_k2_right?eventBody.scan_a_k2_right:'',
        "scan_a_k2_left": eventBody.scan_a_k2_left? eventBody.scan_a_k2_left:'',
        "scan_a_axial_length_right": eventBody.scan_a_axial_length_right?eventBody.scan_a_axial_length_right:"",
        "scan_a_axial_length_left": eventBody.scan_a_axial_length_left?eventBody.scan_a_axial_length_left:'',
        "scan_a_acd_right": eventBody.scan_a_acd_right?eventBody.scan_a_acd_right:'',
        "scan_a_acd_left": eventBody.scan_a_acd_left?eventBody.scan_a_acd_left:'',
        "scan_a_iol_power_left": eventBody.scan_a_iol_power_left?eventBody.scan_a_iol_power_left:'',
        "scan_a_iol_power_right": eventBody.scan_a_iol_power_right?eventBody.scan_a_iol_power_right:'',
        "scan_p_cct_right": eventBody.scan_p_cct_right?eventBody.scan_p_cct_right:'',
        "scan_p_cct_left": eventBody.scan_p_cct_left?eventBody.scan_p_cct_left:'',
        "scan_p_iop_right": eventBody.scan_p_iop_right? eventBody.scan_p_iop_right:'',
        "scan_p_iop_left": eventBody.scan_p_iop_left?eventBody.scan_p_iop_left:'',
        "scan_a_iop_left_dropdown": eventBody.scan_a_iop_left_dropdown?eventBody.scan_a_iop_left_dropdown:'',
        "scan_b_remarks":eventBody.scan_b_remarks,
        "added_on": helper.formatDate(d),
        "updated_on": helper.formatDate(d)
    };

    if (eventBody.imageName.length) {
        var requestBodyForImageTable = {
            "image_url": eventBody.imageName,
            "image_id": eventBody.id,
            "type": eventBody.type
        };
    }
    try {
        if (eventBody.imageName.length) {
            await editImageTableRecord(con, requestBodyForImageTable);
        }
    } catch (error) {
        return await response(constants.HTTP_STATUS.error, 0, "Error while editing Image data", [], error);
    }

    //Update entry
    try {
        let result = await editRecord(con, requestBody);
        return await response(constants.HTTP_STATUS.success, 1, "Scan study updated successfully", result, null);
    } catch (error) {
        return await response(constants.HTTP_STATUS.error, 0, "Error while updating Doctor Availablity data", [], error);
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

//Function to check Id exist
async function isIdValid(con, id = 0) {

    return new Promise(
        function (resolve, reject) {

            //Query to get userId from user table 
            let q = `SELECT id FROM ${constants.DB.visitMasterTable} WHERE id='${id}' limit 1`;
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

//Function to insert new entry in the doctor avail Table
async function editRecord(con, params = {}) {
    return new Promise(
        function (resolve, reject) {
            const query = `UPDATE ${constants.DB.visitMasterTable} SET ? WHERE id="${params.id}" and visit_id="${params.visit_id}"`;
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
async function editImageTableRecord(con, params = []) {

    return new Promise(
        function (resolve, reject) {
            for (var i = 0; i < params.image_url.length; i++) {
                con.query(`INSERT INTO visit_scan_study_image_name (image_url, image_id, type) VALUES ('${params.image_url[i]}','${params.image_id}','${params.type[i]}')`, [params],
                    function (err, rows) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows);
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
            status: Number(status), msg: msg, mobile_msg: mobile_msg != "" ? mobile_msg : msg, data: null,
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