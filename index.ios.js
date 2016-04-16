/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View,
  Image,
  SliderIOS,
  Modal,
  TouchableHighlight
} from 'react-native';

var superagent = require('superagent');

function priceRound(price) {
  return (Math.round(price / 100) * 100) - 1;
}

var Thrifty = React.createClass({
  getInitialState: function () {
    return {
      styleID: null,
      image: null,
      min: 0,
      max: 100,
      guess: null,
      modalVisible: false,
      score: 0
    };
  },

  nextImage: function () {

    var n = Math.round(Math.random() * 1000000);
    superagent.get('http://developer.myntra.com/style/' + n).end((err, res) => {
      if (err) {
        console.log(err);
        return;
      }

      var hasImage = res.body.data && res.body.data.styleImages && res.body.data.styleImages.default && res.body.data.styleImages.default.resolutions;
      if (!hasImage) {
        this.nextImage();
        return;
      }

      var src = res.body.data.styleImages.default.resolutions["360X480Xmini"];
      var price = res.body.data.price;
      var min = Math.random() * (price/2);
      var max = price + (Math.random() * 2 * price);
      var mid = (max + min) / (1 + Math.random());

      this.setState({
        styleID: n,
        image: src,
        price: price,
        min: priceRound(min),
        max: priceRound(max),
        mid: priceRound(mid),
        guess: null,
        product: res.body.data,
      });

      // console.log(res.body.data);
    });
  },

  checkGuess: function () {
    var actualPrice = this.state.price;
    var guessedPrice = this.state.guess;

    var closeness = ((actualPrice - guessedPrice) / actualPrice) * 100;
    
    this.nextImage();

    var isCorrect = false;
    if (closeness > -10 && closeness < 10) {
      isCorrect = true;
    }

    superagent.post('https://popping-heat-5365.firebaseio.com/guesses.json')
      .send({
        guess: guessedPrice,

        id: this.state.product.id,
        gender: this.state.product.gender,
        colour: this.state.product.baseColour,
        year: this.state.product.year,
        usage: this.state.product.usage,
        actual: this.state.product.price,
        brand: this.state.product.brandName,

        fabric: this.state.product.articleAttributes['Fabric'],
        pattern: this.state.product.articleAttributes['Pattern'],
        occasion: this.state.product.articleAttributes['Occasion'],
        knit: this.state.product.articleAttributes['Knit/Woven'],
        pattern: this.state.product.articleAttributes['Pattern'],

        articleType: this.state.product.articleType.typeName,
        masterCategory: this.state.product.masterCategory.typeName,
        subCategory: this.state.product.subCategory.typeName,
        
      }).end(function (err, res) {
        console.log(err, res);
      });

    this.setState({
      modalVisible: true,
      isCorrect: isCorrect,
      message: isCorrect ? "You guessed it pretty close! \nCorrect price is Rs. " + actualPrice : "You are wayyy off. \nActual price is Rs. " + actualPrice,
      color: isCorrect ? 'green' : 'red',
      score: this.state.score + (isCorrect ? 10 : -2)
    });

  },

  componentDidMount: function () {
    this.nextImage();
  },

  render: function () {
    return (
      <View style={styles.container}>
        
        <Text style={styles.instructions}>
          {Math.round(this.state.price)}
        </Text>

        <Text style={styles.welcome}>
          Score: {this.state.score}
        </Text>

        <Image 
          style={{width: 320, height: 480}} 
          source={{uri: this.state.image}}
        />

        <Text style={styles.welcome}>
          Guess the price!
        </Text>

        <SliderIOS
          style={{
            width: 320,
          }}
          step={100}
          value={this.state.mid || this.state.guess}
          minimumValue={this.state.min}
          maximumValue={this.state.max}
          onValueChange={(value) => this.setState({mid: null, guess: value})}
          onSlidingComplete={this.checkGuess}
        />

        <Text style={styles.welcome}>
          {this.state.guess ? "Rs. " + Math.round(this.state.guess) : ''}
        </Text>

        <Modal
          animated={true}
          transparent={true}
          visible={this.state.modalVisible}
          // onRequestClose={() => {this.setState({modalVisible: false})}}
          // onShow={() => {this._setModalVisible(false)}}
          >
          <View style={[styles.container, {backgroundColor: 'transparent'}]}>
            <View style={[styles.innerContainer, {backgroundColor: this.state.color, padding: 20}]}>
              <Text style={styles.welcome}>
                {this.state.isCorrect ? '+10' : '-2'}
              </Text>

              <Text style={styles.welcome}>
                {this.state.message}
              </Text>

              <Button
                onPress={() => {this.setState({modalVisible: false})}}
                style={styles.modalButton}
              >
                Close
              </Button>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
});

var Button = React.createClass({
  getInitialState() {
    return {
      active: false,
    };
  },

  _onHighlight() {
    this.setState({active: true});
  },

  _onUnhighlight() {
    this.setState({active: false});
  },

  render() {
    var colorStyle = {
      color: this.state.active ? '#fff' : '#000',
    };

    return (
      <TouchableHighlight
        onHideUnderlay={this._onUnhighlight}
        onPress={this.props.onPress}
        onShowUnderlay={this._onHighlight}
        style={[styles.button, this.props.style]}
        // underlayColor="#a9d9d4"
      >
          <Text style={[styles.buttonText, colorStyle]}>{this.props.children}</Text>
      </TouchableHighlight>
    );
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },

  innerContainer: {
    borderRadius: 10,
    alignItems: 'center',
  },

  button: {
    borderRadius: 5,
    flex: 1,
    height: 44,
    alignSelf: 'stretch',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  buttonText: {
    fontSize: 18,
    margin: 5,
    textAlign: 'center',
  },

  modalButton: {
    marginTop: 10,
  },
});

AppRegistry.registerComponent('Thrifty', () => Thrifty);
