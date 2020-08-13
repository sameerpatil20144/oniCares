// export default Login;
/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React, { useState } from "react";
import { ValidatorForm } from 'react-form-validator-core';
import { TextValidator } from '../../helpers';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { postRequest, getRequest } from '../../services'
import useForm from '../../helpers/customHook';
import { LOGIN_API, EMR_USER_RIGHTS } from '../../constant'
import AlertMsg from '../alert'
import { setCookie } from '../../cookies'

const Login = (props) => {
    const [error, setError] = useState();
    const initialState = {
        "email": '',
        "password": ''
    };

    const signup = async () => {
        setError();
        try {
            const result = await postRequest(LOGIN_API, inputs);
            const { status, msg, data } = result;
            if (status) {
                const { name, user_auth } = data[0];
                setCookie('access_token', user_auth);
                setCookie('name', name);
                props.history.push("/dashboard")
            } else {
                setError(msg);
            }
        } catch (e) {
            setError('Something went wrong!! Please try again later');
        }
    }

    const { inputs, handleInputChange, handleSubmit } = useForm(initialState, signup);

    return (

        <div className="login-wrap">
            <div className='container'>
                <Row>
                    <Col className="p-0 mt-5">
                        <div className="form-wrap">
                            {
                                error &&
                                <AlertMsg variant="danger" msg={error} />
                            }
                            <h4 className="text-primary font-weight-bold mb-4">Log In to Test Demo</h4>
                            <ValidatorForm onSubmit={handleSubmit}>
                                <Form.Group>
                                    <TextValidator
                                        placeholder="Email"
                                        onChange={handleInputChange}
                                        name="email"
                                        value={inputs.email}
                                        type="email"
                                        validators={['required']}
                                        errorMessages={['This field is required']}
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <TextValidator
                                        placeholder="Password"
                                        onChange={handleInputChange}
                                        name="password"
                                        type="password"
                                        parentClass="password"
                                        value={inputs.password}
                                        validators={['required']}
                                        errorMessages={['Password is not valid']}
                                    />
                                </Form.Group>

                                <Form.Group>
                                    <Button variant="primary" className="w-100 m-0 ft-18 py-2" type="submit">Log In</Button>
                                </Form.Group>
                            </ValidatorForm>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    )
}

export default Login;