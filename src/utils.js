import RNFetchBlob from 'rn-fetch-blob';

const SHA1 = require('crypto-js/sha1');

// TODO : How user can configure this??
const IMAGE_OFFLINE_STORE_BASE_DIR = RNFetchBlob.fs.dirs.CacheDir + '/TODO_App';

exports.getImageFilePath = (uri) => {
  let path = uri.substring(uri.lastIndexOf('/'));
  path = path.indexOf('?') === -1 ? path : path.substring(path.lastIndexOf('.'), path.indexOf('?'));
  const imageExtension = path.indexOf('.') === -1 ? '.jpg' : path.substring(path.indexOf('.'));

  console.log('IMAGE_OFFLINE_STORE_BASE_DIR', IMAGE_OFFLINE_STORE_BASE_DIR);

  return IMAGE_OFFLINE_STORE_BASE_DIR + '/' + SHA1(uri) + imageExtension;
};