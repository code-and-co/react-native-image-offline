import React from 'react';
import { ActivityIndicator, Dimensions, ScrollView, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { OfflineImage, OfflineImageStore } from 'react-native-image-offline';
import Images from '@assets/images';

const width = Dimensions.get('window').width;
export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      reStoreCompleted: false,
      loadImages: false,
    };
  }

  componentWillMount() {
    OfflineImageStore.restore({
      name: 'My_Image_gallery',
      imageRemoveTimeout: 120, // expire image after 120 seconds, default is 3 days if you don't provide this property.
    }, () => {
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

  /**
   * This is just testing logic to show `removeExpiredImages` and `clearStore` usage!!
   */
  componentDidMount() {
    // Clean all the images

    // OfflineImageStore.clearStore(() => {
    //   console.log('Hurray!! clearStore completed callback called');
    // });
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
    if(this.state.reStoreCompleted && !this.state.loadImages) {
      return (
        <View style={styles.container}>
          <TouchableOpacity
            onPress={
              () => {
              this.setState({
                loadImages: true
              })}
            }>
            <Text>Click to Load Images!</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text>React native offline image</Text>
        <OfflineImage
          resizeMode={'center'}
          style={ { width: '99%', height: 110, margin: 5 } }
          fallbackSource={ Images.fallbackSource }
          source={ { uri: 'https://wrong-url/noImageExist.jpg' } }/>
        <OfflineImage
          resizeMode={'cover'}
          style={ { width: '99%', height: 110, margin: 5 } }
          source={ { uri: 'https://wallpaperbrowse.com/media/images/wallpaper-for-mobile-13.jpg' } }/>
        <OfflineImage
          resizeMode={'cover'}
          style={ { width: '99%', height: 110, margin: 5 } }
          source={ { uri: 'https://wallpaperbrowse.com/media/images/tvrcnkbcgeirbxcmsbfz.jpg' } }/>
        <OfflineImage
          resizeMode={'cover'}
          style={ { width: '99%', height: 110, margin: 5 } }
          source={ { uri: 'https://wallpaperbrowse.com/media/images/mobileswall-043.jpg' } }/>
        <OfflineImage
          resizeMode={'cover'}
          style={ { width: '99%', height: 110, margin: 5 } }
          source={ { uri: 'https://wallpaperbrowse.com/media/images/butterfly-wallpaper_SzlKJB8.jpeg' } }/>
      </View>
    );
  }
}

//const createOfflineImageViewRow = (uri, i) => <OfflineImageView key={ i } uri={ uri }/>;
//
// const OfflineImageView = React.createClass({
//   render: function () {
//     return (
//       <View>
//         <OfflineImage
//           style={ { width: width, height: 50 } }
//           fallbackSource={ Images.fallbackSource }
//           source={ { uri: this.props.uri } }/>
//       </View>
//     );
//   }
// });
//
// var images = [
//   'https://wallpaperbrowse.com/media/images/mobileswall-047.jpg',
//   'https://wallpaperbrowse.com/media/images/wallpaper-for-mobile-13.jpg',
//   'https://wallpaperbrowse.com/media/images/tvrcnkbcgeirbxcmsbfz.jpg',
//   'https://wallpaperbrowse.com/media/images/download_ZNNDLIt.jpg',
//   'https://wallpaperbrowse.com/media/images/butterfly-wallpaper_SzlKJB8.jpeg'
// ];

const styles = StyleSheet.create({
  scrollView: {
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

});
