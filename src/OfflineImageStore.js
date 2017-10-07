import { AsyncStorage } from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob';

const SHA1 = require('crypto-js/sha1');

/**
 * Primary class responsible with all operations required to communicate with Offline Store!
 *
 */
class OfflineImageStore {

  constructor(name, storeImageTimeout) {
    if (!OfflineImageStore.instance) {
      OfflineImageStore.instance = this;
      this.entries = {};

      this.store = {
        name,// Application should set their own application store name.
        // Offline Image removed after given time in seconds.
        // Default: 3 days
        storeImageTimeout
      };
      // If it is `true` then we will remove expired images after given `storeImageTimeout`
      this.handlers = {};

      this.restore = this.restore.bind(this);
    }

    return OfflineImageStore.instance;
  }

  /**
   * Gives the Offline store cache base directory
   */
  getBaseDir = () => {
    return RNFetchBlob.fs.dirs.CacheDir + '/' + this.store.name;
  };

  /**
   * This would be the method to be called on app start so that you could prepare application offline
   * image dictionary with existing image uris and its local store path.
   *
   * Pass onCompletion callback function to get the restore completion state.
   */
  async restore (config, onRestoreCompletion) {
    if (config.name === undefined || config.name.length === 0) {
      throw 'Offline image store name is missing';
    }

    this.store.name = config.name;

    if (config.imageRemoveTimeout) {
      this.store.storeImageTimeout = config.imageRemoveTimeout;
    }

    // Restore existing entries:
    AsyncStorage.getItem(`@${this.store.name}:uris`, (err, uris) => { // On `getItems` completion
      console.log('AsyncStorage.getItem DONE');
      // Assign uris to entry list cache(`this.entries`)
      Object.assign(this.entries, JSON.parse(uris));

      // Remove Expired images from offline store and then call user given callback completion method !
      this._removeExpiredImages(onRestoreCompletion);
    });

  };

  /**
   * Removes all the images in the offline store.
   */
  clearStore = (onRestoreCompletion) => {
    // Remove from offline store
    return RNFetchBlob.fs.unlink(this.getBaseDir())
      .then(() => { // On completion
        console.log('Unlink complete store completed!');
        // Empty all entries so that we should update offline Async storage
        this.entries = {};

        // Update offline Async storage
        this._updateAsyncStorage(onRestoreCompletion);

      })
      .catch((err) => {
        console.log('unable to unlink store', err);
      });
  };

  /**
   * This method expects one or more list of image uris as a array to preload them.
   * This is very useful specially if your application want to support offline.
   * Note: We recommend call this method after `restore`
   */
  preLoad = async (uris) => {
    if (uris === undefined && !Array.isArray(uris)) {
      throw 'uris should not be undefined and should be array type';
    }
    uris.forEach((uri) => {
      // If image not exist already, then download
      if (!this.entries[uri]) {
        this._downloadImage({ 'uri': uri });
      }
    });
  };

  subscribe = async (source, handler, reloadImage) => {
    const { uri } = source;

    if (!this.handlers[uri]) {
      this.handlers[uri] = [handler];
    } else {
      this.handlers[uri].push(handler);
    }

    console.log('Subscribed handlers for the uri:', uri, this.handlers[uri]);

    // Get the image if already exist else download and notify!
    this._getImage(source, reloadImage);
  };

  /**
   * Check whether given uri already exist in our offline cache!
   * @param uri uri to check in offline cache list
   */
  isImageExistOffline = (uri) => {
    return this.entries[uri] !== undefined;
  };

  _getExpiredImages = () => {
    const toBeRemovedImages = [];
    const uriList = Object.keys(this.entries);
    uriList.forEach((uri) => {
      const createdPlusDaysDate = this._addTime(this.entries[uri].createdOn, this.store.storeImageTimeout);
      // Image created date + EXPIRED_AFTER_DAYS is < current Date, then remove the image
      console.log('In _getExpiredImages createdPlusDaysDate', createdPlusDaysDate);
      console.log('In _getExpiredImages', 'this.entries[uri].createdOn', this.entries[uri].createdOn);
      console.log('this.store.storeImageTimeout', this.store.storeImageTimeout);

      if (createdPlusDaysDate < new Date()) {
        console.log('remove image called on', uri);
        toBeRemovedImages.push(uri);
      }
    });

    return toBeRemovedImages;
  };

  /**
   * Removes the downloaded offline images which are greater then given 'storeImageTimeout' in the config.
   */
  _removeExpiredImages = (onRestoreCompletion) => {
    const toBeRemovedImagePromises = [];
    const uriListToRemove = this._getExpiredImages();
    console.log('uriListToRemove:', uriListToRemove);
    uriListToRemove.forEach((uri) => {
      console.log('remove image called on', uri);
      // Remove image from cache
      const unlinkPromise = RNFetchBlob.fs.unlink(this.entries[uri].localUriPath)
        .then(() => {
          console.log('remove image success', uri);
          // Delete entry from cache so that we should remove from offline Async storage
          delete this.entries[uri];
          console.log('deleted uri, check its object exist?', this.entries[uri]);
        })
        .catch((err) => {
          console.log('unable to remove image', err);
        });
      toBeRemovedImagePromises.push(unlinkPromise);
    });

    if (toBeRemovedImagePromises.length > 0) {
      console.log('Found images to remove:');
      Promise.all(toBeRemovedImagePromises)
        .then((results) => {
          console.log('removeExpiredImages completed callback');

          // Update AsyncStorage with removed entries
          this._updateAsyncStorage(onRestoreCompletion);
        })
        .catch((e) => {
          //console.log('Promise.all', 'catch');
        });
    } else { // Nothing to remove so just trigger callback!
      console.log('Not Found images to remove:');
      console.log('Entries::', this.entries);
      onRestoreCompletion();
    }
  };

  /**
   * Update AsyncStorage with entries cache and trigger callback.
   */
  _updateAsyncStorage = (onRestoreCompletionCallback) => {
    console.log('_updateAsyncStorage called', JSON.stringify(this.entries));
    AsyncStorage.setItem(`@${this.store.name}:uris`, JSON.stringify(this.entries), () => {
      console.log('_updateAsyncStorage completed');
      console.log('Entries::', this.entries);
      if (onRestoreCompletionCallback) {
        onRestoreCompletionCallback();
      }
    });
  };

  getImageOfflinePath = (uri) => {
    if (this.entries[uri]) {
      console.log('getImageOfflinePath, exist', this.entries[uri].localUriPath);
      return this.entries[uri].localUriPath;
    }
    console.log('getImageOfflinePath, not exist');
    return undefined;
  };

  _getImage = (source, reloadImage) => {
    // Image already exist
    if (this.entries[source.uri]) {
      console.log('_getImage image exist', source.uri, reloadImage);
      // Notify subscribed handler
      this._notify(source.uri);

      // Reload image:
      // Update existing image in offline store as server side image could have updated!
      if (reloadImage) {
        this._downloadImage(source);
      }

    } else { // First time request
      console.log('_getImage image NOT exist', source.uri);
      this._downloadImage(source);
    }
  };

  _downloadImage = (source) => {
    console.log('_downloadImage called', source.uri);

    const method = source.method ? source.method : 'GET';
    const imageFilePath = this._getImageFilePath(source.uri);
    RNFetchBlob
      .config({
        path: imageFilePath
      })
      .fetch(method, source.uri, source.headers)
      .then(() => {
        console.log('RNFetchBlob', 'success', source.uri);
        // Add entry to entry list!!
        this._addEntry(source.uri, imageFilePath);
        // Notify subscribed handler AND Persist entries to AsyncStorage for offline
        this._updateOfflineStore(source.uri).done();
      }).catch(() => {
      console.log('RNFetchBlob', 'failure', imageFilePath, source.uri);
    });
  };

  _notify = (uri) => {
    console.log('_notify', uri);
    const handlers = this.handlers[uri];
    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => {
        console.log('handler called,', uri);
        handler(this.entries[uri].localUriPath);
      });
    }
  };

  _getImageFilePath = (uri) => {
    let path = uri.substring(uri.lastIndexOf('/'));
    path = path.indexOf('?') === -1 ? path : path.substring(path.lastIndexOf('.'), path.indexOf('?'));
    const imageExtension = path.indexOf('.') === -1 ? '.jpg' : path.substring(path.indexOf('.'));

    const localFilePath = this.getBaseDir() + '/' + SHA1(uri) + imageExtension;
    //console.log('getImageFilePath: ', localFilePath);

    return localFilePath;
  };

  _addEntry = (uri, imageFilePath) => {
    console.log('_addEntry', uri, imageFilePath);
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
    console.log('_updateOfflineStore', uri);
    try {
      await AsyncStorage.setItem(`@${this.store.name}:uris`, JSON.stringify(this.entries));
      // Notify subscribed handler
      this._notify(uri);
      console.log('After _updateOfflineStore and now entries::', this.entries);
    } catch (error) {
      // Error saving data
      console.log('_updateOfflineStore Failed', error);
    }
  };

  _addTime = (date, seconds) => {
    var result = new Date(date);
    result.setSeconds(result.getSeconds() + seconds);
    return result;
  };
}

const instance = new OfflineImageStore('RN_Default_ImageStore', 259200);

Object.freeze(instance);

export default instance;