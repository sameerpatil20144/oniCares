/* eslint-disable */

import React from 'react';
import RouterApp from './route';
import { Offline, Online } from "react-detect-offline";
import './App.css'

function App(props) {
    return (
        <div>
            <Online>
                <RouterApp />
            </Online>
            <Offline>
                <div style={{ textAlign: 'center' }}>
                    <img
                        alt="Offline"
                        src="/images/wifi_connected.gif"
                    />
                    <p>You're offline right now. Check your connection.</p>
                </div>
            </Offline>
        </div>
    );
}

export default App;

