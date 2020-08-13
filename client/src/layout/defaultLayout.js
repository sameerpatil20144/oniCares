
/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Navbar from '../layout/Header'

const useStyles = makeStyles(theme => ({
    wrapper: {
        padding: '0 10px'
    }
}));

function Layout(props) {
    const classes = useStyles();
    return (
        <div>
            <Navbar title={props.title} pageLink={(props.linkName != undefined) ? props.linkName : ''} />
            <div className={classes.wrapper}>
                {props.children}
            </div>
        </div>
    )
}

export default Layout
