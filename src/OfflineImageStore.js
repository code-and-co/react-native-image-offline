import { AsyncStorage } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

const SHA1 = require('crypto-js/sha1');

/**
 * Primary class responsible with all operations required to communicate with Offline Store!
 *
 */
class OfflineImageStore {

  // TODOs
  // A component should only subscribe only once
  constructor(name, storeImageTimeout) {
    if (!OfflineImageStore.instance) {
      OfflineImageStore.instance = this;
      this.entries = {};

      this.store = {
        name,// Application should set their own application store name.
        // Offline Image removed after given time in seconds.
        // Default: 3 days
        storeImageTimeout,
        debugMode: false,
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

    if (config.debugMode === true) {
      this.store.debugMode = true;
    }

    // Restore existing entries:
    AsyncStorage.getItem(`@${this.store.name}:uris`, (err, uris) => { // On `getItems` completion

      if (this.store.debugMode) {
        console.log('Restored offline images entry dictionary');
      }
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

    // Check if the folder exists
    return RNFetchBlob.fs.exists(this.getBaseDir())
      .then((exists) => {
        // If folder does not exists, no need to unlink it
        if (!exists)
          return;

        // Remove from offline store
        return RNFetchBlob.fs.unlink(this.getBaseDir())
      })
      .then(() => { // On completion
        if (this.store.debugMode) {
          console.log('Removed offline image store completely!');
        }
        // Empty all entries so that we should update offline Async storage
        Object.keys(this.entries).forEach(key => delete this.entries[key]);


        // Update offline Async storage
        this._updateAsyncStorage(onRestoreCompletion);
        return null;
      })
      .catch((err) => {
        if (this.store.debugMode) {
          console.log('unable to remove offline store', err);
        }

        // Call callback with the error
        onRestoreCompletion(err);
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
        return;
      }

      // Exists but Base Dir changed , may be due to update new app version or whatever
      if (this.entries[uri]) {
        const entry = this.entries[uri];
        // Only exist if base directory matches
        if (entry.basePath !== this.getBaseDir()) {
          this._downloadImage({ 'uri': uri });
        }
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

    // Get the image if already exist else download and notify!
    this._getImage(source, reloadImage);
  };

  // Un subscribe all the handlers for the given source uri
  unsubscribe = async (source) => {
    const { uri } = source;

    if (this.handlers[uri]) {
      delete this.handlers[uri];
    }
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
      if (createdPlusDaysDate < new Date()) {
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
    if (this.store.debugMode) {
      console.log('uris to remove from offline store', uriListToRemove);
    }
    uriListToRemove.forEach((uri) => {
      // Remove image from cache
      const unlinkPromise = RNFetchBlob.fs.unlink(this.entries[uri].basePath + '/' + this.entries[uri].localUriPath)
        .then(() => {
          // Delete entry from cache so that we should remove from offline Async storage
          delete this.entries[uri];
        })
        .catch((err) => {
          if (this.store.debugMode) {
            console.log('unable to remove image', uri, err);
          }
        });
      toBeRemovedImagePromises.push(unlinkPromise);
    });

    if (toBeRemovedImagePromises.length > 0) {
      if (this.store.debugMode) {
        console.log('Found images to remove:');
      }
      Promise.all(toBeRemovedImagePromises)
        .then((results) => {
          if (this.store.debugMode) {
            console.log('removeExpiredImages completed callback');
          }

          // Update AsyncStorage with removed entries
          this._updateAsyncStorage(onRestoreCompletion);
          return null;
        })
        .catch((e) => {
          //console.log('Promise.all', 'catch');
          if (this.store.debugMode) {
              console.log('removeExpiredImages error');
          }
          onRestoreCompletion();
        });
    } else { // Nothing to remove so just trigger callback!
      if (this.store.debugMode) {
        console.log('No images to remove:');
      }
      onRestoreCompletion();
    }
  };

  /**
   * Update AsyncStorage with entries cache and trigger callback.
   */
  _updateAsyncStorage = (onRestoreCompletionCallback) => {
    AsyncStorage.setItem(`@${this.store.name}:uris`, JSON.stringify(this.entries), () => {
      if (onRestoreCompletionCallback) {
        onRestoreCompletionCallback();
      }
    });
  };

  getImageOfflinePath = (uri) => {
    if (this.entries[uri]) {
      const entry = this.entries[uri];
      // Only exist if base directory matches
      if (entry.basePath === this.getBaseDir()) {
        if (this.store.debugMode) {
          console.log('Image exist offline', this.entries[uri].localUriPath);
        }
        return this.entries[uri].basePath + '/' + this.entries[uri].localUriPath;
      }
    }
    if (this.store.debugMode) {
      console.log('Image not exist offline', uri);
    }
    return undefined;
  };

  _getImage = (source, reloadImage) => {
    // Image already exist
    if (this.entries[source.uri]) {
      const entry = this.entries[source.uri];
      // Only exist if base directory matches
      if (entry.basePath === this.getBaseDir()) {
        if (this.store.debugMode) {
          console.log('Image exist offline', source.uri);
        }
        // Notify subscribed handler
        this._notify(source.uri);

        // Reload image:
        // Update existing image in offline store as server side image could have updated!
        if (reloadImage) {
          if (this.store.debugMode) {
            console.log('reloadImage is set to true for uri:', source.uri);
          }
          this._downloadImage(source);
        }
      } else {
        this._downloadImage(source);
      }
      return;
    }

    if (this.store.debugMode) {
      console.log('Image not exist offline', source.uri);
    }
    this._downloadImage(source);
  };

  _downloadImage = (source) => {
    const method = source.method ? source.method : 'GET';
    const imageFilePath = this._getImageFileName(source.uri);
    RNFetchBlob
      .config({
        path: this.getBaseDir() + '/' + imageFilePath
      })
      .fetch(method, source.uri, source.headers)
      .then(() => {
        // Add entry to entry list!!
        this._addEntry(source.uri, imageFilePath);
        // Notify subscribed handler AND Persist entries to AsyncStorage for offline
        this._updateOfflineStore(source.uri).done();
        return null;
      }).catch(() => {
      if (this.store.debugMode) {
        console.log('Failed to download image', source.uri);
      }
    });
  };

  _notify = (uri) => {
    const handlers = this.handlers[uri];
    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => {
        if (this.store.debugMode) {
          console.log('Notify handler called', uri);
        }
        handler(uri, this.entries[uri].basePath + '/' + this.entries[uri].localUriPath);
      });
    }
  };

  _getImageFileName = (uri) => {
    let path = uri.substring(uri.lastIndexOf('/'));
    path = path.indexOf('?') === -1 ? path : path.substring(path.lastIndexOf('.'), path.indexOf('?'));
    const imageExtension = path.indexOf('.') === -1 ? '.jpg' : path.substring(path.indexOf('.'));

    const localFilePath = SHA1(uri) + imageExtension;
    //console.log('getImageFilePath: ', localFilePath);

    return localFilePath;
  };

  _addEntry = (uri, imageFilePath) => {
    // Save Downloaded date when image downloads for first time
    if (this.entries[uri] === undefined) {
      this.entries[uri] = {
        createdOn: new Date().toString(),
        basePath: this.getBaseDir(),
        localUriPath: imageFilePath,
      };
    } else {
      const imageUri = this.entries[uri];
      this.entries[uri] = {
        ...imageUri,
        basePath: this.getBaseDir(),
        localUriPath: imageFilePath,
      };
    }
  };

  _updateOfflineStore = async (uri) => {
    try {
      await AsyncStorage.setItem(`@${this.store.name}:uris`, JSON.stringify(this.entries));
      // Notify subscribed handler
      this._notify(uri);
    } catch (error) {
      if (this.store.debugMode) {
        // Error saving data
        console.log(' Offline image entry update failed', error);
      }
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