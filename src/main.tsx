import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import StaffApp from './StaffApp';
import CustomerPortal from './CustomerPortal';
import './styles.css';

const View=location.pathname.startsWith('/staff')?StaffApp:/^\/(pt|en|es)\/quote\/?$/.test(location.pathname)?CustomerPortal:App;
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><View /></React.StrictMode>);
