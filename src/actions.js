import OFFLINE_IMAGES from './constants';

exports.downloadImageOffline = (source) => ({
  type: OFFLINE_IMAGES.DOWNLOAD_IMAGE_OFFLINE,
  payload: source,
});

exports.downloadImageOfflineSuccess = (uri, localImageFilePath) => ({
  type: OFFLINE_IMAGES.DOWNLOAD_IMAGE_OFFLINE_SUCCESS,
  payload: {
    uri,
    localImageFilePath,
  }
});

exports.downloadImageOfflineFailure = (error) => ({
  type: OFFLINE_IMAGES.DOWNLOAD_IMAGE_OFFLINE_FAILED,
  payload: error,
});

exports.downloadImageOfflineNetworkError = () => ({
  type: OFFLINE_IMAGES.DOWNLOAD_IMAGE_OFFLINE_NETWORK_ERROR,
});

exports.downloadImageOfflineTimeout = () => ({
  type: OFFLINE_IMAGES.DOWNLOAD_IMAGE_OFFLINE_TIMEOUT,
});