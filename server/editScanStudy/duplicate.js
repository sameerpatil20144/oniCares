const mysql = require("mysql");
const AWS = require("aws-sdk");
AWS.config.region = "ap-south-1";
const constants = require("./constants");
const secretName = process.env.SECRETE;
const moment = require('moment');

// Create a Secrets Manager client
const client = new AWS.SecretsManager();
const secret = client
    .getSecretValue({
        SecretId: secretName
    })
    .promise();

var con;
exports.handler = async (event, context, callback) => {

    context.callbackWaitsForEmptyEventLoop = false;

    if (!con || con.state == "disconnected" || con === "undefined") {
        let a = await secret;
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

    try {
        //Parsing body
        // var eventBody = event["body"] ? JSON.parse(event["body"]) : {};
        var eventBody = constants.eventBodyForLocalMashine ? constants.eventBodyForLocalMashine : {};
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

    try {
        if (eventBody.imageEdited) {
            deleteImageUpload = await deleteFileFromBucket(eventBody.image_url);
            imageUpload = await newImageUpload(eventBody.image, eventBody.image_url);
        }
        else {
            return false
        }
    } catch (error) {
        console.log('err: ', error);
        return (constants.HTTP_STATUS.error, 0, 'check newImageUpload function', null, error)
    }

    //parsing Body
    requestBody = {
        "visit_id": eventBody.visit_id,
        "id": eventBody.id,
        "scan_a_k1_right": eventBody.scan_a_k1_right,
        "scan_a_k1_left": eventBody.scan_a_k1_left,
        "scan_a_k2_right": eventBody.scan_a_k2_right,
        "scan_a_k2_left": eventBody.scan_a_k2_left,
        "scan_a_axial_length_right": eventBody.scan_a_axial_length_right,
        "scan_a_axial_length_left": eventBody.scan_a_axial_length_left,
        "scan_a_acd_right": eventBody.scan_a_acd_right,
        "scan_a_acd_left": eventBody.scan_a_acd_left,
        "scan_a_iol_power_left": eventBody.scan_a_iol_power_left,
        "scan_a_iol_power_right": eventBody.scan_a_iol_power_right,
        "scan_p_cct_right": eventBody.scan_p_cct_right,
        "scan_p_cct_left": eventBody.scan_p_cct_left,
        "scan_p_iop_right": eventBody.scan_p_iop_right,
        "scan_p_iop_left": eventBody.scan_p_iop_left,
        "scan_a_iop_left_dropdown": eventBody.scan_a_iop_left_dropdown,
        "image_url": eventBody.image_url,
        "added_on": moment().format("YYYY-MM-DD HH:mm:ss"),
        "updated_on": moment().format("YYYY-MM-DD HH:mm:ss")
    }

    //Update entry
    try {
        let result = await editRecord(con, requestBody);
        return await response(constants.HTTP_STATUS.success, 1, "Data updated", result, null);
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

async function newImageUpload(file, fileName) {
    return new Promise(function (resolve, reject) {
        try {
            let bucketConfig = {
                accessKeyId: "AKIAJMZKZU7YSDUNVRIA",
                secretAccessKey: "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"
            };
            console.log("bucketConfig: ", bucketConfig)

            AWS.config.update(bucketConfig);
            var buffer = Buffer.from(file.replace(/^data:image\/\w+;base64,/, ''), "base64");

            var s3 = new AWS.S3();
            s3.putObject(
                {
                    Bucket: "emr-mecure",
                    Key: eventBody.image_url,
                    Metadata: {
                        "Content-Type": "image/png"
                    },
                    Body: buffer,
                    ACL: "public-read-write"
                },
                function (err, resp) {
                    if (err) {
                        reject(err)
                    }
                    else {
                        resolve(fileName);
                    }
                }
            );
        } catch (error) {
            console.log("image error", error);
            reject(error);
        }
    });
}

async function deleteFileFromBucket(fileName) {
    return new Promise(
        function (resolve, reject) {
            try {

                let bucketConfig = {
                    accessKeyId: "AKIAJMZKZU7YSDUNVRIA",
                    secretAccessKey: "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"
                };

                AWS.config.update(bucketConfig);

                var params = {
                    Bucket: "emr-mecure",
                    Delete: {
                        Objects: [
                            {
                                Key: fileName
                            }
                        ],
                        Quiet: false
                    }
                };
                var s3 = new AWS.S3();
                s3.deleteObjects(params, function (err, data) {
                    if (err) {
                        console.log('unsuccessful s3 delete', err);
                        reject(err);
                    } else {
                        console.log('successful s3 delete', data);
                        resolve(data);
                    }
                });
            } catch (error) {
                console.log('s3 delete error', error);
                reject(error);
            }
        }
    )
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

            const query = `UPDATE ${constants.DB.visitMasterTable} SET ? WHERE id="${params.id}" and visit_id="${params.visit_id}"`

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

//Function to get response in json
async function response(statusCode = 200, status = 0, msg = "Command executed", data = {}, err = {}, mobile_msg = "") {

    return new Promise(function (resolve, reject) {

        //JSON response 
        try {
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

            if (err) {
                reject('something went wrong', err);
            }
            else {
                resolve(response);
            }
        } catch (error) {
            return ('Please check "response" function with respective to Lamda function')
        }
    });
}