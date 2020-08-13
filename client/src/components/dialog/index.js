/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React from 'react';
import { Modal } from 'react-bootstrap';

export default function Dialog(props) {

    const { ...rest } = props;
    return (
        <div>
            <Modal
                centered
                {...rest}
            >
                <Modal.Header closeButton={props.closeButton == false ? false : true}>
                    <Modal.Title>
                        {props.titleDialog}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {props.children}
                </Modal.Body>
            </Modal>
        </div>
    );
}
