import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { ajax } from 'rxjs/observable/dom/ajax';

import { offlineImageEpic } from 'react-native-image-offline';

const AppEpics = combineEpics(offlineImageEpic);

const AppEpicMiddleware = createEpicMiddleware(AppEpics, {
dependencies: {
  getJSON: ajax.getJSON,
},
});

export default AppEpicMiddleware;