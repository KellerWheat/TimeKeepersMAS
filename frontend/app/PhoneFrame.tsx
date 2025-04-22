// PhoneFrame.tsx
import React from 'react';
import { IPhoneMockup } from 'react-device-mockup';
import App from './App';

const PhoneFrame: React.FC = () => {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100vw',  // Ensure full viewport width
                height: '100vh', // Full viewport height
                padding: 20,
                boxSizing: 'border-box',
            }}
        >
            <IPhoneMockup screenWidth={300}>
                <App />
            </IPhoneMockup>
        </div>
    );
};

export default PhoneFrame;
