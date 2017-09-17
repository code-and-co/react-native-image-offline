import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ImageBackground, Platform } from 'react-native';

import { downloadImageOffline } from './actions';

const FILE_PREFIX = Platform.OS === 'ios' ? '' : 'file://';

/**
 * Wrapper class for React Image {@link https://facebook.github.io/react-native/docs/image.html}.
 * This component can get or observe the cached image's device file path as source path.
 */
class ImageOffline extends React.Component {

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    /**
     * Always download and update image in offline store if 'reloadImage' === 'always', however
     * Case 1: Show offline image if already exist
     * Case 2: Show Fallback image if given until image gets downloaded
     * Case 3: Never cache image if property 'reloadImage' === never
     */
    const { source, reloadImage } = this.props;

    // TODO: check source type as 'ImageURISource'
    // Download only if property 'uri' exists
    if (source.uri && reloadImage === 'always') {
      this.props.downloadImageOffline(source);
    }
  }

  /**
   * Check whether given uri already exist in our offline cache!
   * @param uris Offline cached image uris
   * @param uri uri to check in offline cache list
   */
  isExistOffline = (uris, uri) => {
    return uris !== undefined && uris[uri] !== undefined;
  };

  // this.props.fallBackSource // Show default image as fallbackImage(If exist) until actual image has been loaded.
  render() {
    const { uris, fallbackSource, source, component } = this.props;
    let sourceImage = source;

    // Replace source.uri with offline image path instead waiting for image to download from server
    if (source.uri) {
      if (this.isExistOffline(uris, source.uri)) {
        sourceImage = {
          uri: FILE_PREFIX + uris[source.uri],
        };
      } else if (fallbackSource) { // Show fallback image until we download actual image
        sourceImage = fallbackSource;
      }
    }

    const componentProps = {
      ...this.props,
      source: sourceImage
    };

    if (component) {
      const Component = component;
      return (
        <Component { ...componentProps }>{ this.props.children }</Component>
      );
    }

    // Default component would be 'ImageBackground' to render
    return (
      <ImageBackground { ...componentProps }>{ this.props.children }</ImageBackground>
    );
  }

}

ImageOffline.defaultProps = {
  reloadImage: 'always'
};

ImageOffline.propTypes = {
  //fallbackSource: PropTypes.int,
  component: PropTypes.func,
  // TODO: Boolean would be sufficient
  reloadImage: PropTypes.string, // 'always', 'never'
};

const mapStateToProps = (state) => ({
  uris: state.imageOfflineReducer.uris,
});

const mapStateToDispatch = (dispatch) => ({
  downloadImageOffline: (source) => dispatch(downloadImageOffline(source)),
});

export default connect(mapStateToProps, mapStateToDispatch)(ImageOffline);