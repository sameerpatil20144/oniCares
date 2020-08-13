// const mysql = require("mysql");
// const AWS = require("aws-sdk");
// AWS.config.region = "ap-south-1";
// const constants = require("./constants");
// const fs = require("fs");
// const secretName = process.env.SECRETE;
// moment = require('moment')

// // Create a Secrets Manager client
// const client = new AWS.SecretsManager();
// const secret = client
//     .getSecretValue({
//         SecretId: secretName
//     })
//     .promise();

// var con;
// exports.handler = async (event, context, callback) => {

//     context.callbackWaitsForEmptyEventLoop = false

//     if (!con || con.state == "disconnected" || con === "undefined") {
//         let a = await secret;
//         con = secret.then(result => {
//             var data = JSON.parse(result.SecretString);
//             var connection = mysql.createConnection({
//                 host: data.lims_host,
//                 user: data.lims_user,
//                 password: data.lims_password,
//                 database: data.lims_db
//             });
//             connection.connect();
//             return connection;
//         })
//             .catch(err => {
//                 throw err;
//             });
//     }

//     try {
//         con = await con;
//     } catch (e) {
//         return await response(200, 0, "error while fetching connection", null, new Error("error while fetching connection")
//         );
//     }

//     try {
//         //Parsing body
//         // var eventBody = event["body"] ? JSON.parse(event["body"]) : {};
//         var eventBody = constants.eventBodyForLocalMashine ? constants.eventBodyForLocalMashine : {};
//     } catch (error) {
//         return await response(constants.HTTP_STATUS.error, 0, "Error, your sending parameter's not valid", null, error);
//     }

//     // Required fields.
//     let errors = [];

//     if (!eventBody.visit_id || eventBody.visit_id <= 0) {
//         errors.push("Visit id is required");
//     }
//     if (!eventBody.user_id || eventBody.user_id <= 0) {
//         errors.push("User id is required");
//     }

//     if (errors.length) {
//         return await response(constants.HTTP_STATUS.success, 0, "Please fill required fields !!", null, errors);
//     }

//     //Is VisitId exist Valid?
//     try {
//         let visitValid = await isVisitIdValid(con, eventBody.visit_id);
//         if (!visitValid.length) {
//             return await response(constants.HTTP_STATUS.success, 0, "Unknown Visit", [], null);
//         }
//     } catch (error) {
//         return await response(constants.HTTP_STATUS.error, 0, "Error while matching Visit Id", null, error);
//     }

//     //Is userId exist Valid?
//     try {
//         let userValid = await isUserIdValid(con, eventBody.user_id);
//         if (!userValid.length) {
//             return await response(constants.HTTP_STATUS.success, 0, "Unknown User", [], null);
//         }
//     } catch (error) {
//         return await response(constants.HTTP_STATUS.error, 0, "Error while matching userId", null, error);
//     }
//     var imageUrls = [];
//     try {
//         let imageUpload = await newImageUpload(eventBody.image, eventBody.fileName)
//         imageUrls = imageUpload
//     } catch (error) {
//         console.log('err: ', error);
//         return (constants.HTTP_STATUS.error, 0, 'check newImageUpload function', null, error)
//     }

//     //parsing Body
//     var requestBody = {
//         "visit_id": eventBody.visit_id,
//         "user_id": eventBody.user_id,
//         "scan_a_k1_right": eventBody.scan_a_k1_right,
//         "scan_a_k1_left": eventBody.scan_a_k1_left,
//         "scan_a_k2_right": eventBody.scan_a_k2_right,
//         "scan_a_k2_left": eventBody.scan_a_k2_left,
//         "scan_a_axial_length_right": eventBody.scan_a_axial_length_right,
//         "scan_a_axial_length_left": eventBody.scan_a_axial_length_left,
//         "scan_a_acd_right": eventBody.scan_a_acd_right,
//         "scan_a_acd_left": eventBody.scan_a_acd_left,
//         "scan_a_iol_power_left": eventBody.scan_a_iol_power_left,
//         "scan_a_iol_power_right": eventBody.scan_a_iol_power_right,
//         "scan_p_cct_right": eventBody.scan_p_cct_right,
//         "scan_p_cct_left": eventBody.scan_p_cct_left,
//         "scan_p_iop_right": eventBody.scan_p_iop_right,
//         "scan_p_iop_left": eventBody.scan_p_iop_left,
//         "scan_a_iop_left_dropdown": eventBody.scan_a_iop_left_dropdown,
//         "added_on": moment().format("YYYY-MM-DD HH:mm:ss"),
//         "updated_on": moment().format("YYYY-MM-DD HH:mm:ss")
//     }

//     //Create new entry in the table
//     try {
//         let DataId = await createRecord(con, requestBody);
//         var reqInsertId = DataId.insertId;
//         requestBody['id'] = reqInsertId;
//     } catch (error) {
//         return await response(constants.HTTP_STATUS.error, 0, "Error while adding data", [], error);
//     }
//     var requestBodyForImageTable = [];
//     try {
//         if (imageUrls.length) {
//             for (var i = 0; i < imageUrls.length; i++) {
//                 requestBodyForImageTable.push([
//                     imageUrls[i] + ".png",
//                     reqInsertId
//                 ])
//             }
//         }
//     } catch (error) {
//         return await response(constants.HTTP_STATUS.error, 0, "Error while fetching image data", [], error.message);
//     }

//     try {
//         let repImg = await createRecordInImageTable(con, requestBodyForImageTable);
//         requestBody['imageDetails'] = requestBodyForImageTable;
//         return await response(constants.HTTP_STATUS.success, 1, "New entry in the table", requestBody, null);
//     } catch (error) {
//         return await response(constants.HTTP_STATUS.error, 0, "Error while adding data", [], error);
//     }
// };

// //Function to check VisitId exist
// async function isVisitIdValid(con, vid = 0) {

//     return new Promise(
//         function (resolve, reject) {

//             //Query to get visitId from Visit table 
//             let q = `SELECT id FROM ${constants.DB.visitTable} WHERE id='${vid}' limit 1`;

//             con.query(q, function (err, rows) {
//                 if (err) {
//                     reject(err);
//                 } else {
//                     resolve(rows);
//                 }
//             });
//         }
//     );
// }

// //Function to check userId exist
// async function isUserIdValid(con, uid = 0) {

//     return new Promise(
//         function (resolve, reject) {

//             //Query to get userId from user table 
//             let q = `SELECT id FROM ${constants.DB.userTable} WHERE id='${uid}' limit 1`;
//             con.query(q, function (err, rows) {
//                 if (err) {
//                     reject(err);
//                 } else {
//                     resolve(rows);
//                 }
//             });
//         }
//     );
// }

// async function newImageUpload(file, fileName) {
//     return new Promise(function (resolve, reject) {
//         try {
//             var imagePath = [];
//             file.forEach(function (item) {
//                 let bucketConfig = {
//                     accessKeyId: "AKIAJMZKZU7YSDUNVRIA",
//                     secretAccessKey: "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"
//                 };

//                 AWS.config.update(bucketConfig);
//                 var buffer = Buffer.from(item.replace(/^data:image\/\w+;base64,/, ''), "base64");

//                 var s3 = new AWS.S3();
//                 var keyName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
//                 imagePath.push(
//                     keyName
//                 );
//                 s3.putObject(
//                     {
//                         Bucket: "emr-mecure",
//                         Key: keyName + ".png",
//                         Metadata: {
//                             "Content-Type": "image/png"
//                         },
//                         Body: buffer,
//                         ACL: "public-read-write"
//                     },
//                     function (err, resp) {
//                         if (err) {
//                             reject(err)
//                         }
//                         else {
//                             resolve(imagePath);
//                         }
//                     }
//                 );
//             });
//         } catch (error) {
//             console.log("image error", error);
//             reject(error);
//         }
//     });
// }


// //Function to insert new entry in the Table
// async function createRecord(con, params = {}) {

//     return new Promise(
//         function (resolve, reject) {

//             const query = `INSERT INTO ${constants.DB.visitMasterTable} SET ?`

//             //Query to create new record in Table
//             con.query(query, [params], function (err, rows) {
//                 if (err) {
//                     reject(err);
//                 } else {
//                     resolve(rows);
//                 }
//             });
//         }
//     );
// }

// //Function to insert new entry in the Table
// async function createRecordInImageTable(con, params = []) {
//     return new Promise(
//         function (resolve, reject) {
//             let q = con.query(`INSERT INTO ${constants.DB.visitImageName} (image_url, image_id) VALUES ?`, [params],
//                 function (err, rows) {
//                     if (err) {
//                         reject(err);
//                     } else {
//                         resolve(rows);
//                     }
//                 });
//         }
//     );
// }
// //Function to get response in json
// async function response(statusCode = 200, status = 0, msg = "Command executed", data = {}, err = {}, mobile_msg = "") {

//     return new Promise(function (resolve, reject) {

//         //JSON response 
//         try {
//             let result = {
//                 status: Number(status), msg: msg,
//                 mobile_msg: mobile_msg != "" ? mobile_msg : msg,
//                 data: data,
//                 err: err
//             };

//             let response = {
//                 statusCode: statusCode,
//                 headers: {},
//                 body: JSON.stringify(result),
//                 isBase64Encoded: false
//             };

//             if (err) {
//                 reject('something went wrong' + err.message);
//             }
//             else {
//                 resolve(response);
//             };
//         } catch (error) {
//             return ('Please check "response" function with respective to Lamda function')
//         }
//     });
// }
