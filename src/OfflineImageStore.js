import { AsyncStorage } from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob';
const SHA1 = require('crypto-js/sha1');

class OfflineImageStore {

  constructor() {
    if(! OfflineImageStore.instance) {
      OfflineImageStore.instance = this;
      this.entries = {};
      // Application should set their own application store name.
      this.name = 'RN_Default_ImageStore';
      // Offline Image removed after given time in seconds.
      // Default: 3 days
      this.storeImageTimeout = 259200;
      // Handler to callback after image downloaded!
      this.handlers = {};
    }

    return OfflineImageStore.instance;
  }

  restore = async (config, onCompletion) => {

    if (config.name === undefined || config.name.length === 0) {
      throw 'Offline image store is missing';
    }

    this.name = config.name;

    if (config.imageRemoveTimeout) {
      this.storeImageTimeout = config.imageRemoveTimeout;
    }

    console.log('before restore');
    // Restore
    const uris = await AsyncStorage.getItem(`@${this.name}:uris`);
    Object.assign(this.entries, JSON.parse(uris));

    console.log('after restore', this.entries);

    // Restore complete!!
    onCompletion();
  };

  /**
   * Check whether given uri already exist in our offline cache!
   * @param uri uri to check in offline cache list
   */
  isImageExistOffline = (uri) => {
    return this.entries[uri] !== undefined;
  };

  getImageOfflinePath = (uri) => {
    console.log('getImageOfflinePath', this.entries[uri].localUriPath);
    return this.entries[uri].localUriPath;
  };

  getBaseDir = () => {
    return RNFetchBlob.fs.dirs.CacheDir + '/' + this.name;
  };

  subscribe = async (source, handler, reloadImage) => {
    const {uri} = source;

    if (!this.handlers[uri]) {
      this.handlers[uri] = [handler];
    } else {
      this.handlers[uri].push(handler);
    }

    console.log('Subscribed handlers', uri, this.handlers[uri]);

    // Get existing store entries
    //console.log('before restore', JSON.stringify(this.entries));
    if (Object.keys(this.entries).length === 0) {
      const uris = await AsyncStorage.getItem(`@${this.name}:uris`);
      Object.assign(this.entries, JSON.parse(uris));
    }
    //console.log('plain', uris,);
    //console.log('PARSE', JSON.parse(uris));
    //console.log('stringify', JSON.stringify(uris));
    console.log('after reStoreEntries', this.entries);

    // Get the image if already exist else download and notify!
    this.getImage(source, reloadImage);
  };

  getImage = (source, reloadImage) => {
    console.log('get called , now entries', JSON.stringify(this.entries));
    // Image already exist
    if (this.entries[source.uri]) {
      // Notify subscribed handler
      this._notify(source.uri);

      // Reload image:
      // Update existing image in offline store as server side image could have updated!
      if (reloadImage) {
        this._downloadImage(source);
      }

    } else { // First time request
      this._downloadImage(source);
    }
  };

  clearStore() {
    return RNFetchBlob.fs.unlink(this.getBaseDir());
  }

  _downloadImage = (source) => {
    console.log('_downloadImage , now entries', JSON.stringify(this.entries));

    const method = source.method ? source.method : 'GET';
    const imageFilePath = this._getImageFilePath(source.uri);
    RNFetchBlob
      .config({
        path: imageFilePath
      })
      .fetch(method, source.uri, source.headers)
      .then(() => {
        console.log('RNFetchBlob', 'success', imageFilePath, source.uri);
        // Add entry to entry list!!
        this._addEntry(source.uri, imageFilePath);
        // Persist entries to AsyncStorage for offline
        this._updateOfflineStore(source.uri).done();
        console.log('AsyncStorage.setItem', JSON.stringify(this.entries));

      }).catch(() => {
      console.log('RNFetchBlob', 'failure', imageFilePath, source.uri);
    });
  };

  _notify = (uri) => {
    console.log('_notify , now entries', JSON.stringify(this.entries));
    const handlers = this.handlers[uri];
    handlers.forEach(handler => {
      console.log('handler called,', uri, this.entries[uri].localUriPath);
      handler(this.entries[uri].localUriPath);
    });
  };

  _getImageFilePath = (uri) => {
    let path = uri.substring(uri.lastIndexOf('/'));
    path = path.indexOf('?') === -1 ? path : path.substring(path.lastIndexOf('.'), path.indexOf('?'));
    const imageExtension = path.indexOf('.') === -1 ? '.jpg' : path.substring(path.indexOf('.'));

    const localFilePath = this.getBaseDir() + '/' + SHA1(uri) + imageExtension;
    console.log('getImageFilePath: ', localFilePath);

    return localFilePath;
  };

  _addEntry = (uri, imageFilePath) => {
    console.log('_addEntry , now entries', JSON.stringify(this.entries));
    // Save Downloaded date when image downloads for first time
    if (this.entries[uri] === undefined) {
      this.entries[uri] = {
        createdOn: new Date().toString(),
        localUriPath: imageFilePath,
      };
    } else {
      const imageUri = this.entries[uri];
      this.entries[uri] = {
        ...imageUri,
        localUriPath: imageFilePath,
      };
    }
  };

  _updateOfflineStore = async (uri) => {
    console.log('_updateOfflineStore , now entries', JSON.stringify(this.entries));
    try {
      await AsyncStorage.setItem(`@${this.name}:uris`, JSON.stringify(this.entries));
      console.log('aysnc set name', `@${this.name}:uris`);
      // Notify subscribed handler
      this._notify(uri);
    } catch (error) {
      // Error saving data
      console.log('_updateOfflineStore Failed');
    }
    console.log('_updateOfflineStore success', JSON.stringify(this.entries));
  };

  _addDays = (date, days) => {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  _addMinutes = (date, minutes) => {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  removeExpiredImages = () => {
    const toBeRemovedImagePromise = [];
      const uriList = Object.keys(this.entries);
      uriList.forEach((uri) => {
        const createdPlusDaysDate = this._addDays(this.entries[uri].createdOn, this.imageRemoveTimeout());
        //const createdPlusDaysDate = this._addMinutes(this.entries[uri].createdOn, 2);
        // Image created date plus 5 days(EXPIRED_AFTER_DAYS) is < current Date, then remove the image
        if (createdPlusDaysDate < new Date()) {
          // Remove image from cache
          const unlinkPromise = RNFetchBlob.fs.unlink(this.entries[uri].localUriPath)
            .then(() => {
              console.log('remove image success', uri);
            })
            .catch((err) => {
              console.log('unable to remove image', err);
            });
          toBeRemovedImagePromise.push(unlinkPromise);
        }

      });
      return toBeRemovedImagePromise;
    }
}



const instance = new OfflineImageStore();

Object.freeze(instance);

export default instance;