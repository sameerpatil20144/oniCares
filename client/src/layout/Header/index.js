/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { withRouter } from 'react-router'
import { removeCookie, getCookie } from '../../cookies'

function Header(props) {
    var fields
    if (props.location.pathname) {
        fields = props.location.pathname.split('/');
    }

    let docs = (props.pageLink != undefined && props.pageLink == 'uploadDocs') ? 'active' : '';

    //Storing ID from Title 
    const logout = (props) => {
        removeCookie('access_token');
        removeCookie('name');
        removeCookie('center_id');
        removeCookie('doctor_id');
        removeCookie('patientId');
        removeCookie('id');
        removeCookie('role_type');
        removeCookie("bloodGroup");
        removeCookie("visitDate");
        localStorage.removeItem("rights");
        props.history.push('/');
    }

    return (
        <Navbar expand="md" className="navbar-wrapper">
            <Navbar.Brand>Test Demo</Navbar.Brand>
            <div className="page-title">{props.title}</div>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav" style={{ justifyContent: 'flex-end' }}>
                <Nav className="d-flex align-items-center">
                    <Nav.Link href="/uploadDocs/1234" className={docs}>
                        Upload Docs
                    </Nav.Link>
                    <NavDropdown className="user-drop" title={<div>
                        <img src="/images/dummy-user.jpg" alt="" />
                        {getCookie('name')}
                        <i className="fas fa-caret-down ml-2"></i>
                    </div>}>
                        <NavDropdown.Item onClick={() => logout(props)}>Logout</NavDropdown.Item>
                    </NavDropdown>
                </Nav>

            </Navbar.Collapse>
        </Navbar >
    );
}

export default withRouter(Header);


