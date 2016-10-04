import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  ScrollView,
  Linking,
  WebView } from 'react-native';
import Subheader from '../components/Subheader';


const heightScript = '<script>window.location.hash = 1;document.title = (document.height !== undefined) ? document.height : document.body.offsetHeight;</script>';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScreenWidthImage: {
    alignSelf: 'stretch',
    height: 180,
    opacity: 0.8,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    fontFamily: (Platform.OS === 'ios') ? 'Helvetica' : 'Roboto',
  },
});

class FullView extends Component {
  static propTypes = {
    article: PropTypes.object.isRequired,
    articles: PropTypes.object.isRequired,
    navigator: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      height: 100,
    };
  }

  articleContent(fieldIdentifier) {
    const articleContentFields = this.props.article.content.CurrentVersion.Version.Fields.field;
    return articleContentFields.find( field =>
      (field.fieldDefinitionIdentifier === fieldIdentifier)
    );
  }

  filteredArticleBody() {
    return this.articleContent('body').fieldValue.xml
      .replace(/<\/?(?:(?!bold|italic|break|link|paragraph|header).)*?\/?>/ig, '') // filter out some xml tags
      .replace(/(<\/?)([a-z]*)/ig, this.replaceXmlTagsWithHtml)
      .replace(/(url)(=)/ig, 'href$2');
  }

  replaceXmlTagsWithHtml(match, tag, keyWord) {
    switch(keyWord) {
      case 'header': return `${tag}h2`;
      case 'link': return `${tag}a`;
      case 'break': return `${tag}br`;
      default: return `${tag}${keyWord.substring(0,1)}`;
    }
  }

  /*
    onShouldStartLoadWithRequest is iOS specific. Thats why this method is being called
    on navigation state change for Android.
  */
  openExternalLinkIfNeeded(navState) {
    const url = navState.url;

    /* Return value defines whether WebView should try to load the source inside the app*/
    if (url.startsWith('http://') || url.startsWith('https://')) {
      Linking.openURL(url);
      return Platform.OS === 'android' ? this.refs.Webview.stopLoading() : false;
    }

    return true;
  }

  onPressBackBtn() {
    this.props.navigator.pop();
  }

  render() {
    const { article } = this.props;
    const customHtml = this.filteredArticleBody();

    return (
      <View style={styles.container}>
        <Subheader
          onPressBackBtn={this.onPressBackBtn.bind(this)} />
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.title}>{ article.name.trim() }</Text>
            { this._renderMetadata() }
          </View>
          <Image
            source={{ uri: article.image }}
            style={styles.fullScreenWidthImage} />
          <WebView
            ref='Webview'
            source={{ html: `<!DOCTYPE html>\n<html><body> ${customHtml} ${heightScript} </body></html>` }}
            style={{ height: Number(this.state.height) + 30 }}
            scrollEnabled={false}
            startInLoadingState={false}
            onShouldStartLoadWithRequest={this.openExternalLinkIfNeeded}
            onNavigationStateChange={ (navState) => {
              this.setState({ height: navState.title });
              if (Platform.OS === 'android') {
                this.openExternalLinkIfNeeded(navState);
              }
            }} />
        </ScrollView>
      </View>
    );
  }

  _renderMetadata() {
    const author = this.articleContent('author_override').fieldValue;
    const publishDate = new Date(this.articleContent('publish_date').fieldValue.rfc850);

    return (
      <View style={{ flexDirection: 'row', marginTop: 10, }}>
        <Text style={{ color: '#ef4134' }}>{ author }</Text>
        { author ? <Text> | </Text> : null }
        <Text style={{ flex:1 }}>{ publishDate.toLocaleDateString('hr') }</Text>
      </View>
    );
  }
}

function mapStateToProps(state) {
  return {
    articles: state.articles.fetchedArticles,
  };
}

export default connect(mapStateToProps)(FullView);