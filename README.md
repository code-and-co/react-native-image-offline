# react-native-image-offline

React Native library for iOS and Android offline image storage. This library provides most of the capabilities for an application to display pre-loaded images when offline.
(This library has a dependency on **react-native-fetch-blob**. Refer [here](https://github.com/wkh237/react-native-fetch-blob) for more details about the library.)

## Features
* Define your own offline storage name!
* Pre load the images
* Automatically remove expired images from offline storage.
* Supports a fallback source static image that will be shown if a source object has a 'uri' but is unable to download the image or is unable to find it in the offline storage.
* Use custom Image components.
* You can always re-fetch the image by specifying `reloadImage={true}` irrespective of the image already being stored offline, this way you can refresh/load the most recently updated images.
* Option to clear offline storage


## Installation
This library has a dependency on `react-native-fetch-blob`, please refer to their [installation instructions](https://github.com/wkh237/react-native-fetch-blob#user-content-installation)

**Using yarn**

`$ yarn add react-native-image-offline`

Note: Do not forget to run `react-native link` after adding `react-native-fetch-blob` dependency.

**Using npm**

`$ npm install react-native-image-offline --save`


## Usage
<img src="https://raw.githubusercontent.com/code-and-co/react-native-image-offline/master/screenshot.png" width="300" height="500"/>

##### `restore`
First and foremeost, to use this library it is important to call the `restore` function so that you can get the completion status back. See the basic example usage.

`OfflineImageStore.restore({}, () => {})`

First argument is configuration object, example

```
{
  name: 'My_Image_gallery',
  imageRemoveTimeout: 120, // expire image after 120 seconds, default is 3 days if you don't provide this property.
  debugMode: true,
}
```
Second argument is the callback function
```
const restoreCompletion = () => { // Callback function
  console.log('Restore completed !');
   // Restore completed!!
   this.setState({ reStoreCompleted: true });
 }
```

### Configuration properties
##### name
`name` configuration property used to define the application offline store directory name
##### imageRemoveTimeout
`imageRemoveTimeout` is to provide image expiry time in seconds
##### debugMode
`debugMode` set to `true` to view the debug logs

### Complete example usage
```
export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      reStoreCompleted: false,
    };
  }
componentWillMount() {
    OfflineImageStore.restore({
      name: 'My_Image_gallery',
      imageRemoveTimeout: 120, // expire image after 120 seconds, default is 3 days if you don't provide this property.
      debugMode: true,
    }, () => { // Callback function
      console.log('Restore completed and callback called !');
      // Restore completed!!
      this.setState({ reStoreCompleted: true });

      // Preload images
      // Note: We recommend call this method on `restore` completion!
      OfflineImageStore.preLoad([
        'https://wallpaperbrowse.com/media/images/mobileswall-047.jpg',
        'https://wallpaperbrowse.com/media/images/wallpaper-for-mobile-13.jpg',
        'https://wallpaperbrowse.com/media/images/tvrcnkbcgeirbxcmsbfz.jpg',
        'https://wallpaperbrowse.com/media/images/hd-wallpapers-1080p-for-mobile-2015.jpg',
        'https://wallpaperbrowse.com/media/images/mobileswall-043.jpg',
        'https://wallpaperbrowse.com/media/images/hd-wallpapers-for-mobile-2015.png',
        'https://wallpaperbrowse.com/media/images/download_ZNNDLIt.jpg'
      ]);
    });
  }
  
  render() {
      if (!this.state.reStoreCompleted) {
        return (
          <ActivityIndicator
            animating={ true }
            style={ [{
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8,
            }, { height: 80 }] }
            size='large'
            color={ '#A7A7A7' }
          />
        );
      }
      return (
            <View style={styles.container}>
              <Text>React native offline image</Text>
              <OfflineImage
                        key={'https://wrong-url/noImageExist.jpg'}
                        resizeMode={'center'}
                        style={ { width: '99%', height: 110, margin: 5 } }
                        fallbackSource={ Images.fallbackSource }
                        source={ { uri: 'https://wrong-url/noImageExist.jpg' } }/>
                      <OfflineImage
                        key={'https://wallpaperbrowse.com/media/images/wallpaper-for-mobile-13.jpg'}
                        onLoadEnd={(sourceUri) => {
                          console.log('Loading finished for image with path: ', sourceUri)
                        }}
                        reloadImage = { true }
                        resizeMode={'cover'}
                        fallbackSource={ Images.fallbackSource }
                        style={ { width: '99%', height: 110, margin: 5 } }
                        source={ { uri: 'https://wallpaperbrowse.com/media/images/wallpaper-for-mobile-13.jpg' } }/>
                      <OfflineImage
                        key={'https://wallpaperbrowse.com/media/images/tvrcnkbcgeirbxcmsbfz.jpg'}
                        onLoadEnd={(sourceUri) => {
                          console.log('Loading finished for image with path: ', sourceUri)
                        }}
                        resizeMode={'cover'}
                        style={ { width: '99%', height: 110, margin: 5 } }
                        source={ { uri: 'https://wallpaperbrowse.com/media/images/tvrcnkbcgeirbxcmsbfz.jpg' } }/>
                      <OfflineImage
                        key={'https://wallpaperbrowse.com/media/images/mobileswall-043.jpg'}
                        onLoadEnd={(sourceUri) => {
                          console.log('Loading finished for image with path: ', sourceUri)
                        }}
                        resizeMode={'cover'}
                        style={ { width: '99%', height: 110, margin: 5 } }
                        source={ { uri: 'https://wallpaperbrowse.com/media/images/mobileswall-043.jpg' } }/>
                      <OfflineImage
                        key={'https://wallpaperbrowse.com/media/images/butterfly-wallpaper_SzlKJB8.jpeg'}
                        onLoadEnd={(sourceUri) => {
                          console.log('Loading finished for image with path: ', sourceUri)
                        }}
                        resizeMode={'cover'}
                        fallbackSource={ Images.fallbackSource }
                        style={ { width: '99%', height: 110, margin: 5 } }
                        source={ { uri: 'https://wallpaperbrowse.com/media/images/butterfly-wallpaper_SzlKJB8.jpeg' } }/>
            </View>
          );
      }
  }
```

### `preload`
The recommended approach to preload images is to call after `restore`. You could call this method anywhere from the code. For instance, this library can be used with `redux-observable`, here is the code snippet!

```
const loadShoppingCartEpic = (action$, store, { getJSON }) =>
  action$.ofType(LOAD_SHOPPING_CART)
    .flatMap(action => {
        return getJSON(`${API_BASE_URL}/api/cart`)
                .map(res =>  {
                    if (res.metadata.code === 200) {
                        // Preload image after successful response 
                        // These images download and persist offline.
                        OfflineImageStore.preLoad([
                          'res.content.image1.link',
                          'res.content.image2.link',
                        ]);
                        return loadShoppingCartSuccess(res.content);
                    } else { 
                        return loadShoppingCartFailure();
                    }
                })
                ._catch(error => Observable.of(loadShoppingCartFailure));
    })
```

### OfflineImage with static source 
```
<OfflineImage component={ ImageBackground }
                        style={ [styles.swiperBackgroundImg, { width: this.props.width }] }
                        resizeMode="cover"
                        source={ require('../../../assets/images/placeholder/placeholder.png') }>
<View>...</View>  
</OfflineImage>

```

### OfflineImage with fallback/placeholder image 
You can use a fallback image as a default image to show when unable to download the image or if the image not available in the offline storage.
```
<OfflineImage component={ ImageBackground }
                        style={ [styles.swiperBackgroundImg, { width: this.props.width }] }
                        resizeMode="cover"
                        fallbackSource={ require('../../../assets/images/placeholder/placeholder.png') }
                        source={ { uri: this.props.shoppingCartItem.image.link } }>
<View>...</View>  
</OfflineImage>

```

### Clear offline store
You can clear complete offline store at any point of time using 
```
// Clean all the images
OfflineImageStore.clearStore(() => {
    console.log('Hurray!! clearStore completed callback called');
});
```  

## Development/Contributions

#### Credits
Thanks to [https://wallpaperbrowse.com/](https://wallpaperbrowse.com/). These image uris are only used in a sample example application.
