import { applyMiddleware, compose, createStore } from 'redux';
import logger from 'redux-logger';
import AppEpicMiddleware from './epics';
import AppReducers from './reducer';

const store = compose(applyMiddleware(AppEpicMiddleware, logger))(createStore)(AppReducers);

export default store;
