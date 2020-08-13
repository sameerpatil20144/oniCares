/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import { getCookie } from '../cookies'
import { routes } from './routes';

const RouterApp = (props) => {
    return (
        <div className="App">
            <Router>
                <Suspense fallback={<div>Loading...</div>}>
                    <Switch>
                        {
                            routes.map((v, k) => {
                                if (v.isNotRequired) {
                                    return (
                                        <Route key={k} path={v.path} component={v.component} exact={true} />
                                    )
                                } else {
                                    if (v.isAccessible) {
                                        return (
                                            <ProtectedRoute key={k} exact path={v.path} layout={v.layout} component={v.component} pageTitle={v.pageTitle} linkName={v.linkName} />
                                        )
                                    }
                                }
                            })
                        }
                    </Switch>
                </Suspense>
            </Router>
        </div>
    )
}

const ProtectedRoute = ({ layout: Layout, component: Component, pageTitle: pageTitle, linkName: linkName, ...rest }) => {
    return (
        <Route {...rest} render={(props) => (
            isLogin() ?
                <Layout location={props.location} history={props.history} title={pageTitle} linkName={linkName} >
                    <Component  {...props} />
                </Layout >
                :
                <Redirect to={{ pathname: '/', state: { from: props.location } }} />
        )} />
    )
};

const isLogin = () => {
    const token = getCookie('access_token');
    if (token) {
        return true
    }
    return false
}


export default RouterApp; 