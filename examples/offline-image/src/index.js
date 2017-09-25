import React from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { OfflineImage, OfflineImageStore } from 'react-native-image-offline';

const width = Dimensions.get('window').width;
export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      reStoreCompleted: false,
    }
  }

  componentWillMount() {
    OfflineImageStore.restore({
      name: 'My_Image_gallery',
      imageRemoveTimeout: 259200 // expire image after 3 days
    }, () => {
      console.log('Restore completed!');
      // Restore completed!!
      this.setState({ reStoreCompleted: true });
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
        <View style={ styles.container }>
          <Text>React native offline image</Text>
          <OfflineImage
            style={ { width: width, height: 193 } }
            source={ { uri: 'https://wallpaperbrowse.com/media/images/download_ZNNDLIt.jpg' } }/>

          <OfflineImage
            style={ { width: width, height: 193 } }
            source={ { uri: 'https://wallpaperbrowse.com/media/images/butterfly-wallpaper_SzlKJB8.jpeg' } }/>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
