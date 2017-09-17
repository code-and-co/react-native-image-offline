import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/add/observable/of';
import { delay } from 'rxjs/add/operator/delay';
import { takeUntil } from 'rxjs/add/operator/takeUntil';
import { merge } from 'rxjs/add/observable/merge';
import { concat } from 'rxjs/add/observable/concat';
import { flatMap, mergeMap } from 'rxjs/add/operator/mergeMap';
import { map } from 'rxjs/add/operator/map';
import { _catch } from 'rxjs/add/operator/catch';
import RNFetchBlob from 'react-native-fetch-blob';
import OFFLINE_IMAGES from './constants';

import { downloadImageOfflineFailure, downloadImageOfflineNetworkError, downloadImageOfflineSuccess } from './actions';

import { getImageFilePath } from './utils';

const defaultTimeout = 5000;

const downloadImageEpic = (action$, store) =>
  action$.ofType(OFFLINE_IMAGES.DOWNLOAD_IMAGE_OFFLINE)
    .flatMap(action => {
      //console.log('downloadImage', 'Entry');
      //console.log('downloadImage', action.payload);
      if (!store.getState().networkReducer.isConnected) {
        //console.log('downloadImage', 'Network not connected');
        return Observable.of(downloadImageOfflineNetworkError());
      }

      const source = action.payload;

      const method = source.method ? source.method : 'GET';
      const imageFilePath = getImageFilePath(source.uri);

      RNFetchBlob
        .config({
          path: imageFilePath
        })
        .fetch(method, source.uri, source.headers)
        .then(() => {
          //console.log('RNFetchBlob', 'success', imageFilePath, source.uri);
          store.dispatch(downloadImageOfflineSuccess(source.uri, imageFilePath));
        }).catch(() => {
          //console.log('RNFetchBlob', 'failure', imageFilePath, source.uri);
          RNFetchBlob.fs.unlink(imageFilePath);
          store.dispatch(downloadImageOfflineFailure());
      });

      return Observable.of({
        type: 'DOWNLOAD_IMAGE_OFFLINE_REQUEST_SENT'
      });

    });

export default { downloadImageEpic, };

export const imageOfflineEpics = [downloadImageEpic];