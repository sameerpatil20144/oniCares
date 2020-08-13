/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React, { useState } from 'react'
import { Alert } from 'react-bootstrap'

const AlertMsg = ({ variant, msg }) => {
    return (
        <Alert variant={variant}>
            {msg}
        </Alert>
    )
}

export default AlertMsg;