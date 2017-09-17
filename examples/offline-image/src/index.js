import React from 'react';
import { Provider } from 'react-redux';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { OfflineImage } from 'react-native-image-offline';
import store from './store';

const width = Dimensions.get('window').width;
export default class App extends React.Component {
  render() {
    return (
        <Provider store={ store }>
          <View style={styles.container}>
            <Text>React native offline image</Text>
            <OfflineImage
                style={ { width: width, height: 193 } }
                source={{uri: 'https://wallpaperbrowse.com/media/images/download_ZNNDLIt.jpg'}} />
          </View>
        </Provider>
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
