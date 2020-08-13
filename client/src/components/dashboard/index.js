/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import { Image, Row, Container } from 'react-bootstrap';
import { setAlertMsg } from '../../helpers/common'
import AlertBox from '../../components/alert'

const Dashboard = (props) => {
    //displaying success and error on the screen 
    const [succErrMsg, setSuccErrMsg] = useState({});
    useEffect(() => {
        if (props.location.state != undefined || props.location.state != null) {
            setAlertMsg(props.location.state, "danger", setSuccErrMsg, 4000)
        }
    }, []);
    return (
        <Container>
            {succErrMsg && succErrMsg.msg &&
                <AlertBox msg={succErrMsg.msg} variant={succErrMsg.variant} />
            }
            <Row className="d-flex flex-column align-items-center" style={{ paddingTop: '30px' }}>
                <Row className="d-flex align-items-center">
                    <Image style={{ width: '60px' }} src="images/waving-hand.png" />
                    <h4 style={{ fontSize: "3rem", color: '#585858' }}>Welcome!</h4>
                </Row>
                <h5 style={{ color: '#585858' }}>to "Test Demo"</h5>
            </Row>
        </Container>
    );
}

export default Dashboard;