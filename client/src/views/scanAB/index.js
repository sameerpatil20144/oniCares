/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import { ValidatorForm } from 'react-form-validator-core';
import AWS from "aws-sdk";
import { TextValidator, customHooks } from '../../helpers'
import { Form, Col, Button, Card, Tabs, Tab, Row } from 'react-bootstrap';
import CommonTable from '../../components/table'
import Dialog from '../../components/dialog'
import './index.css'

//importing API endpoint from constant
import { GET_LIST_SCAN_STUDY, POST_SCAN_STUDY, UPDATE_SCAN_STUDY, DELETE_SCAN_STUDY, GET_SCAN_STUDY_IMAGES, REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY, IMAGE_URL, DELETE_IMAGE, GET_LIST } from '../../constant';

//import confirm modal box
import ConfirmModal from './confirmModal'

//Display alert
import { setAlertMsg } from '../../helpers/common'

import AlertBox from '../../components/alert'

//importing GET POST PUT DELETE request
import { getRequest, postRequest, deleteRequest, putRequest } from '../../services/index';

const thead = ['User Name', 'ID', 'Remarks']

var s3 = new AWS.S3({
    region: REGION, // Put your aws region here
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY
});

const UploadDocs = (props) => {

    var fields
    if (props.location.pathname) {
        fields = props.location.pathname.split('/');
    }

    const [files, setFiles] = useState([]);
    const [imageA, setImageA] = useState([]);
    const [imageB, setImageB] = useState([]);
    const [getStateId, setStateId] = useState([]);
    const [alertError, setAlertError] = useState(false);
    const [getImages, setImages] = useState([])
    const [imageModal, setImageModal] = React.useState(false);
    const [selectedData, setSelectedData] = React.useState({});

    // //displaying success and error on the screen 
    const [succErrMsg, setSuccErrMsg] = useState({})
    const [getListScanStudy, setListScanStudy] = useState([])
    const [getListFromAPI, setDataAPIList] = useState([])
    //show modal 
    const [showModal, setShowModal] = useState(false)

    const [getId, setId] = useState([]);
    const [getType, setType] = useState('Scan_B');
    var [getVisitId, setVisitId] = useState(props ? fields[2] : 1)

    const initialState = {
        scan_b_remarks: '',
        typeOfScan: ''
    }

    const onImageChange = (event, image, setImage, attach_type) => {
        if (event.target.files && event.target.files[0]) {
            event.target.files[0].attach_type = attach_type;
            let filesArray = Array.from(event.target.files);
            setFiles([...files, filesArray]);

            let imageArray = image;
            filesArray.forEach((file) => {
                let reader = new FileReader();
                reader.onloadend = () => {
                    imageArray = [...imageArray, { 'path': reader.result, 'file_type': file.type }];
                    setImage(imageArray);
                }
                reader.readAsDataURL(file);
            })
        }
    }
    //function to hide modal over delete button
    const hideModal = () => {
        setShowModal(false)
    }

    //s3Bucket delete
    async function deleteFromBucket() {
        return new Promise(
            function (resolve, reject) {
                var fileName = getImages;
                if (getImages) {
                    for (var i = 0; i < fileName.length; i++) {
                        try {
                            let bucketConfig = {
                                accessKeyId: ACCESS_KEY_ID,
                                secretAccessKey: SECRET_ACCESS_KEY
                            };

                            AWS.config.update(bucketConfig);

                            var params = {
                                Bucket: "emr-mecure",
                                Delete: {
                                    Objects: [
                                        {
                                            Key: fileName[i]
                                        }
                                    ],
                                    Quiet: false
                                }
                            };
                            var s3 = new AWS.S3();
                            s3.deleteObjects(params, function (err, data) {
                                if (err) {
                                    reject(err);
                                } else {
                                    console.log('successfully deleted')
                                    resolve(data);
                                }
                            });
                        } catch (error) {
                            reject(error);
                        }
                    }
                }
                else {
                    console.log('No files in buckets')
                }
            }
        )
    }


    const handleClick = (type) => {
        setType(type)
    }

    const uploadFiles = async () => {
        var array = []
        if (files.length) {
            var bucketConfig = {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY
            };
            return new Promise(function (resolve, reject) {
                try {
                    for (let index = 0; index < files.length; index++) {
                        for (let u = 0; u < files[index].length; u++) {
                            var element = files[index][u];
                            var keyName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                            array.push({ type: files[index][0].attach_type, image_URL: keyName + "." + element.name.split('.').pop() });
                            var params = {
                                Bucket: "emr-mecure",
                                Key: keyName + "." + element.name.split('.').pop(),
                                ContentType: element.type,
                                Body: element,
                                ACL: "public-read-write"
                            };
                            AWS.config.update(bucketConfig);
                            s3.putObject(params,
                                function (err, resp) {
                                    if (err) {
                                        reject(err)
                                    }
                                    else {
                                        if (array) {
                                            setFiles([])
                                            resolve(array);
                                        }
                                        else {
                                            array = []
                                            setFiles([])
                                            resolve(array)
                                        }
                                    }
                                }
                            );
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }
        else {
            console.log('Upload error')
        }
    }

    const handleSave = async (e) => {

        setAlertError(false);
        //function to add data Apiendpoint
        if (getStateId != parseInt(getVisitId)) {

            var uploadURfiles = await uploadFiles()

            var finalArrayType = uploadURfiles && uploadURfiles.map(function (obj) {
                return obj.type;
            });
            var finalArrayImage = uploadURfiles && uploadURfiles.map(function (obj) {
                return obj.image_URL;
            });
            try {
                //Parsing body
                const sendData = {
                    visit_id: parseInt(getVisitId),
                    imageName: finalArrayImage,
                    scan_b_remarks: (inputs.scan_b_remarks != undefined) ? inputs.scan_b_remarks : '',
                    type: finalArrayType
                }

                //all data in result variable(calling api)
                const result = await postRequest(POST_SCAN_STUDY, sendData);

                // Destructuring the object
                const { status, msg } = result;

                if (status) {
                    getRequestScanStudyRequest();
                    fetchList();
                    setAlertMsg(msg, "success", setSuccErrMsg, 4000)
                }
                else {
                    setAlertMsg(msg, "danger", setSuccErrMsg, 4000)
                }
            } catch (error) {
                setAlertMsg('Something went wrong!! Please try again later', "danger", setSuccErrMsg, 4000)
            }
        }
        else {
            //function to add data from  Apiendpoint
            try {

                var uploadURfiles = await uploadFiles();

                var finalArrayType = uploadURfiles && uploadURfiles.map(function (obj) {
                    return obj.type;
                });
                var finalArrayImage = uploadURfiles && uploadURfiles.map(function (obj) {
                    return obj.image_URL;
                });

                //Parsing body
                const sendData = {
                    visit_id: parseInt(getVisitId),
                    id: parseInt(getId),
                    scan_b_remarks: inputs.scan_b_remarks,
                    imageName: (finalArrayImage != undefined) ? finalArrayImage : [],
                    type: (finalArrayType != undefined) ? finalArrayType : []
                }

                //all data in result variable(calling api)
                const result = await putRequest(UPDATE_SCAN_STUDY, sendData);

                // //Destructuring the object
                const { status, msg } = result;

                if (status) {
                    getRequestScanStudyRequest();
                    fetchList();
                    resetState()
                    setAlertMsg(msg, "success", setSuccErrMsg, 4000)
                } else {
                    setAlertMsg(msg, "danger", setSuccErrMsg, 4000)
                }
            } catch (error) {
                console.log(error)
                setAlertMsg('Something went wrong!! Please try again later', "danger", setSuccErrMsg, 4000)
            }
        }
    };

    const resetState = async () => {
        setInputs(inputs => ({
            ...inputs,
            ...initialState
        }))
    }

    const deleteScanStudy = async () => {
        try {
            //Parsing body
            const sendData = {
                id: parseInt(getId)
            }

            //all data in result variable(calling api)
            const result = await deleteRequest(DELETE_SCAN_STUDY, sendData);

            //Destructuring the object
            const { status, msg } = result;
            if (status) {
                getRequestScanStudyRequest();
                fetchList();
                setStateId(null)
                setImageA([])
                setImageB([])
                resetState()
                setAlertMsg(msg, "success", setSuccErrMsg, 4000)
            }
            else {
                setAlertMsg(msg, "danger", setSuccErrMsg, 4000)
            }

        } catch (error) {
            setAlertMsg('Something went wrong!! Please try again later', "danger", setSuccErrMsg, 4000)
        }
    }

    //function to get data
    const getRequestScanStudyRequest = async () => {
        try {
            //Parsing body
            const sendData = {
                visit_id: parseInt(getVisitId)
            }

            //all data in result variable(calling api)
            const result = await getRequest(GET_LIST_SCAN_STUDY, sendData);
            //Destructuring the object
            const { status, data } = result;

            const requestBody = {
                id: data.list.id
            }
            const getImages = await getRequest(GET_SCAN_STUDY_IMAGES, requestBody);

            //status is equal to true
            if (status) {
                //Storing data in Scan Study.
                const list = data.list
                const tempImageA = [];
                const tempImageB = [];
                getImages.data.list.map((v, k) => {
                    v.path = IMAGE_URL + v.image_url;
                    if (v.type === "ScanA") {
                        tempImageA.push(v)
                    } else {
                        tempImageB.push(v)
                    }
                })
                setImageA(tempImageA);
                setImageB(tempImageB);
                setStateId(list.visit_id)
                setId(list.id)
                setListScanStudy(list)
                if (getImages.data.list.length) {
                    var imageArray = []
                    for (var i = 0; i < getImages.data.list.length; i++) {
                        imageArray.push(getImages.data.list[i].image_url)
                    }
                }
                if (list.visit_id === parseInt(getVisitId)) {
                    setInputs(inputs => ({
                        ...inputs,
                        scan_b_remarks: list.scan_b_remarks,
                        scan_a_iop_left_dropdown: list.scan_a_iop_left_dropdown
                    }));
                }
                setImages(imageArray);
            }
            else {
                const { msg } = result;
                if (msg === 'Please Insert Required field') {
                    setAlertMsg(null, "warning", setSuccErrMsg, 4000)
                }
                else {
                    setAlertMsg(msg, "danger", setSuccErrMsg, 4000)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    //delete
    const deleteScanImage = async (type, imageName) => {
        try {
            const sendData = {
                type: type ? type : '',
                image_url: imageName ? imageName : ''
            }
            await deleteRequest(DELETE_IMAGE, sendData)
            let bucketConfig = {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY
            };
            AWS.config.update(bucketConfig);
            var params = {
                Bucket: "emr-mecure",
                Delete: {
                    Objects: [
                        {
                            Key: imageName
                        }
                    ],
                    Quiet: false
                }
            };
            var s3 = new AWS.S3();
            setImages([])
            s3.deleteObjects(params, function (err, data) {
                if (err) {
                    console.log('not deleted')
                } else {
                    console.log('successfully deleted')
                }
            });
        } catch (error) {
            console.log('error: ', error)
        }
    }

    //preview modal enable with data 
    const imagePreview = (data) => {
        setImageModal(true);
        setSelectedData(data);
    }


    const fetchList = async () => {
        const result = await getRequest(GET_LIST);
        setDataAPIList(result.data.list)
    }

    //removing attachement 
    const deleteAttachment = (row, m, type) => {
        if (type = 'scanB' && getType === "Scan_B") {
            deleteScanImage('ScanB', imageB[m].image_url)
            if (imageB.length) {
                var imageBArray = []
                var imageBArray = [...imageB]
                imageBArray.splice(m, 1)
            }
            setImageB(imageBArray)
        }
        if (type = 'scanA' && getType === "Scan_A") {
            if (imageA.length) {
                deleteScanImage('ScanA', imageA[m].image_url)
                var imageAArray = []
                var imageAArray = [...imageA]
                imageAArray.splice(m, 1)
                setImageA(imageAArray)
            }
        }
    }

    //calling function to get API call 
    useEffect(() => {
        getRequestScanStudyRequest()
        setVisitId(fields[2])
        fetchList();
    }, []);

    const { handleSubmit, inputs, handleInputChange, setInputs } = customHooks(initialState, handleSave);
    return (
        <div>
            <Dialog titleDialog="Attachment Preview" show={imageModal} size="md" onHide={() => setImageModal(false)}>
                <div className="text-center">
                    {selectedData.file_type === "application/pdf" ? (
                        <object height="550px" width="100%" data={selectedData.path}></object>
                    ) : (
                            <img src={selectedData.path} className="img-fluid" alt="video" />
                        )}
                </div>
            </Dialog>
            {alertError && alertError &&
                <AlertBox msg={'Please fill highlighted fields.'} variant={'danger'} />
            }
            {
                <ValidatorForm onSubmit={handleSubmit} onError={() => setAlertError(true)}>
                    <ConfirmModal hideModal={hideModal} show={showModal} title="Are you sure you want to remove this record ?"  >
                        <div>
                            <Button type="submit" variant="primary" onClick={() => { deleteFromBucket(); deleteScanStudy(); setShowModal(false) }} >Yes</Button>
                            <Button variant="outline-danger" onClick={() => { setShowModal(false) }}>Cancel</Button>
                        </div>
                    </ConfirmModal>
                    {succErrMsg && succErrMsg.msg &&
                        <AlertBox msg={succErrMsg.msg} variant={succErrMsg.variant} />
                    }
                    <div className="tab-card">
                        <Tabs defaultActiveKey="Scan_B" activeKey={getType} onSelect={k => setType(k)}>
                            <Tab eventKey="Scan_B" title="Upload Docs" onClick={() => { handleClick('Scan_B') }}>
                                <Row className="my-4">
                                    <Col md={6}>
                                        <div className="input-group">
                                            <div className="custom-file">
                                                <input
                                                    type="file"
                                                    name="attachment"
                                                    id="inputGroupFile02"
                                                    // accept="image/*,.pdf"
                                                    onChange={(e) => onImageChange(e, imageB, setImageB, 'ScanB')}
                                                    multiple
                                                />
                                                <label className="custom-file-label" htmlFor="inputGroupFile02">{imageB.length >= 1 ? + imageB.length + ' files' : 'Upload Attachment'} </label>
                                            </div>
                                        </div>
                                        <div className="d-flex">
                                            {imageB && imageB.map((v, i) => {
                                                return (
                                                    <div className="attachment-wrap" key={i}>
                                                        <div onClick={() => imagePreview(v)} >
                                                            {v.file_type === "application/pdf" ? (
                                                                <>
                                                                    <object height="150px" width="150px" data={v.path}></object>
                                                                    <div className="pdf-wrap"></div>
                                                                </>
                                                            ) : v.file_type === "video/mp4" ? (
                                                                <>
                                                                    <video height="150px" width="150px" data={v.path}></video>
                                                                    <div ></div>
                                                                </>
                                                            ) : (
                                                                        <img src={v.path} className="img-fluid" alt="video" />
                                                                    )}
                                                        </div>
                                                        <span onClick={() => { deleteAttachment(v.path, i, 'scanB') }}><i className="fa fa-trash" ></i></span>
                                                    </div>
                                                )
                                            })
                                            }
                                        </div>
                                        <Form.Group className="mt-3">
                                            <TextValidator
                                                label="Text"
                                                onChange={(event) => handleInputChange(event, 'inputTextArea')}
                                                name="scan_b_remarks"
                                                as="textarea"
                                                rows="3"
                                                value={inputs.scan_b_remarks}
                                                validators={['required']}
                                                errorMessages={['This field is required']}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Tab>
                        </Tabs>
                    </div>
                    {(getStateId != getVisitId || getStateId === null || getStateId === 'undefined') ? <Button type="submit" variant="primary" >Save</Button> : (
                        <div >
                            <Button type="submit" variant="primary" id="update">Update</Button>
                            <Button variant="outline-secondary" onClick={() => { setShowModal(true) }}>Delete</Button>
                        </div>
                    )}
                </ValidatorForm>
            }
            {getListFromAPI.length ?
                <Card style={{ marginTop: '20px' }}>
                    <CommonTable className="action-list table-selected" thead={thead}  >
                        {getListFromAPI && getListFromAPI.map((v, k) => {
                            return (
                                <tr>
                                    <td>{v.name}</td>
                                    <td>{v.visit_id} </td>
                                    <td>{v.scan_b_remarks} </td>
                                </tr>
                            )
                        })}
                    </CommonTable>
                </Card> : <div style={{ marginTop: '20px', textAlign: 'center' }}><b>"There are no records to display"</b></div>}
        </div >
    );
}

export default UploadDocs;

