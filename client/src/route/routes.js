/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import { lazy } from 'react';
import DefaultLayout from '../layout/defaultLayout'

const Login = lazy(() => import('../components/login'));
const Dashboard = lazy(() => import('../components/dashboard'));
const ScanAB = lazy(() => import('../views/scanAB'));

export var routes = [
    {
        path: '/',
        component: Login,
        isNotRequired: true,
        linkName: ''
    },
    {
        path: '/login',
        component: Login,
        isNotRequired: true,
        linkName: ''
    },
    {
        path: '/logout',
        component: Login,
        linkName: ''
    },
    {
        path: '/dashboard',
        component: Dashboard,
        layout: DefaultLayout,
        linkName: '',
        isAccessible: 'showDashboard'
    },
    {
        path: '/uploadDocs/:id',
        component: ScanAB,
        layout: DefaultLayout,
        pageTitle: 'Upload Document',
        linkName: 'uploadDocs',
        isAccessible: "showMasterIcon"
    },
    {
        path: '*',
        component: Dashboard,
        layout: DefaultLayout,
        pageTitle: '',
        linkName: 'quickaccess',
        isAccessible: 'showMasterIcon'
    }
]
