# react-native-image-offline

## Features
* By default, it always will reload the image from backend unless you specify the reloadImage={'never'}.
* You can Download and cache the image upfront when you get API response from backend.
* It persists all the image uris so that on second load onwards, image shown from local device! However, also reloads the latest images from backend and replace the image in offline store.
* Supports fallback source static image. This will be shown if source object has 'uri' but image not exist in offline store

## Installation

**Using yarn**

`$ yarn add react-native-image-offline`

**Using npm**

`$ npm install react-native-image-offline --save`

## Basic Usage

##### OfflineImage with static source 
```
<OfflineImage component={ ImageBackground }
                        reloadImage={'always'}
                        style={ [styles.swiperBackgroundImg, { width: this.props.width }] }
                        resizeMode="cover"
                        source={ require('../../../assets/images/placeholder/placeholder.png') }>
<View>...</View>  
</OfflineImage>

```

##### OfflineImage with fallback/placeholder image 
```
<OfflineImage component={ ImageBackground }
                        reloadImage={'always'}
                        style={ [styles.swiperBackgroundImg, { width: this.props.width }] }
                        resizeMode="cover"
                        fallbackSource={ require('../../../assets/images/placeholder/placeholder.png') }
                        source={ { uri: this.props.serverResponse.image.link } }>
<View>...</View>  
</OfflineImage>

```
**Note** fallback image shown if actual image not available in offline store!

## Development/Contributions