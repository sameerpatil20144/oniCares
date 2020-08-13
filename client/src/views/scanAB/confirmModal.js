/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React from "react";
import Dialog from '../../components/dialog'

const ConfirmModal = ({ children, title, show, hideModal }) => {

    return (
        <Dialog titleDialog={title} show={show} onHide={() => hideModal(false)} size="md">
            {children}
        </Dialog>
    )
}

export default ConfirmModal