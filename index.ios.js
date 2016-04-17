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
  TouchableHighlight,
  Animated,
  Dimensions,
  ProgressViewIOS,
  Easing
} from 'react-native';

var superagent = require('superagent');
var windowWidth = Dimensions.get('window').width;
var gameTime = 15;

function priceRound(price) {
  var p = (Math.round(price / 100) * 100) - 1;
  if (p < 0) {
    p = 0;
  }
  return p;
}

var Thrifty = React.createClass({
  getInitialState: function () {
    return {
      styleID: null,
      image: null,
      min: 0,
      max: 100,
      guess: null,
      modalVisible: true,
      newGame: true,
      score: 0,
      color: '#940912',
      timer: gameTime * 20, 
      stampAnimation: new Animated.Value(0),
    };
  },

  endGame: function () {
    clearInterval(this._interval);
    this.setState({
      newGame: false,
      modalVisible: true,
    });
  },

  nextImage: function () {

    clearInterval(this._interval);
    this._interval = setInterval(() => {
      if (this.state.timer <= 20) {
        this.endGame();
      }

      this.setState((prevState) => {
        return {
          timer: prevState.timer - 1
        };
      });
    }, 1000 / 20);

    var n = Math.round(Math.random() * 1000000);
    superagent.get('http://developer.myntra.com/style/' + n).end((err, res) => {
      if (err) {
        console.log(err);
        this.nextImage();
        return;
      }

      var hasImage = res.body.data && res.body.data.styleImages && res.body.data.styleImages.default && res.body.data.styleImages.default.resolutions && res.body.data.styleImages.default.resolutions["360X480Xmini"];;
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
    
    var isCorrect = false;
    if (closeness > -10 && closeness < 10) {
      isCorrect = true;
    }


    Animated.timing(          // Uses easing functions
       this.state.stampAnimation,    // The value to drive
       {
        toValue: 1,
        easing: Easing.easeOut
       }            // Configuration
     ).start(); 

    setTimeout(() => {
      Animated.timing(          // Uses easing functions
       this.state.stampAnimation,    // The value to drive
       {
        toValue: 0,
        easing: Easing.easeOut
       }            // Configuration
     ).start(); 

      this.nextImage();
    }, 1000);

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
      // modalVisible: true,
      isCorrect: isCorrect,
      message: isCorrect ? "CORRECT! \nCorrect price is Rs. " + actualPrice : "You are wayyy off. \nActual price is Rs. " + actualPrice,
      color: isCorrect ? 'green' : '#940912',
      score: this.state.score + (isCorrect ? 10 : -2)
    });

  },

  startGame: function () {
    this.setState({
      styleID: null,
      image: null,
      min: 0,
      max: 100,
      guess: null,
      modalVisible: false,
      newGame: false,
      score: 0,
      color: '#940912',
      timer: gameTime * 20, 
      stampAnimation: new Animated.Value(0),
    });

    this.nextImage();
  },

  render: function () {
    return (
      <View style={styles.container}>
        
        {/*<Text style={styles.instructions}>
          {Math.round(this.state.price)}
        </Text>*/}

        <View style={{
          flexDirection: 'row',
          alignSelf: 'stretch',
          justifyContent: 'space-between',
          // marginHorizontal: 10,
        }}>
          <Text style={styles.welcome}>
            00:{Math.round(this.state.timer / 20)}
          </Text>
          <Text style={styles.welcome}>
            {this.state.score} points
          </Text>
        </View>

        <ProgressViewIOS
          style={{
            alignSelf: 'stretch',
            // height: 10
          }}
          trackTintColor='white'
          progress={(this.state.timer / (gameTime * 20))}
        />

        <Image 
          style={{width: windowWidth, height: windowWidth * 1.2}} 
          source={{uri: this.state.image}}
        >

          <Animated.View style={[styles.container, {
            flex: 1,
            transform: [{
               scale: this.state.stampAnimation.interpolate({
                 inputRange: [0, 1],
                 outputRange: [10, 1]  // 0 : 150, 0.5 : 75, 1 : 0
               }),
             }],
            opacity: this.state.stampAnimation, 
            backgroundColor: 'transparent'
          }]}>
            <View style={[styles.innerContainer, {transform: [{rotate: '-30deg'}], backgroundColor: 'white', paddingVertical: 3, paddingHorizontal: 3, borderWidth: 3, borderColor: this.state.color, width: 240,  borderRadius: 10}]}>
              <View style={[styles.innerContainer, {alignSelf: 'stretch', padding: 10, borderWidth: 5, borderColor: this.state.color, borderRadius: 8}]}>

                  <Text style={styles.welcome, {fontSize: 36, color: this.state.color, fontWeight: 'bold'}}>
                    {this.state.isCorrect ? 'CORRECT' : 'WRONG'}
                  </Text>

                  {/*<Button
                    onPress={() => {this.setState({modalVisible: false})}}
                    style={styles.modalButton}
                  >
                    Close
                  </Button>*/}
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.container, {
            
            transform: [
              {
                translateY: this.state.stampAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [500, 0]  // 0 : 150, 0.5 : 75, 1 : 0
                }),
              },
              // {
              //   scale: this.state.stampAnimation.interpolate({
              //     inputRange: [0, 1],
              //     outputRange: [10, 1]  // 0 : 150, 0.5 : 75, 1 : 0
              //   }),
              // }
            ],
            opacity: this.state.stampAnimation, 
            backgroundColor: 'transparent',
            height: 60,
          }]}>

            <View style={[styles.innerContainer, {backgroundColor: 'white', paddingVertical: 3, paddingHorizontal: 3, borderWidth: 3, borderColor: this.state.color, width: 160,  borderRadius: 10}]}>
              
              <Text style={styles.welcome, {fontSize: 24, color: this.state.color, fontWeight: 'bold'}}>
                Rs. {this.state.price}
              </Text>

            </View>
          </Animated.View>

        </Image>

        <ProgressViewIOS
          style={{
            alignSelf: 'stretch',
            // height: 10
          }}
          trackTintColor='white'
          progress={(this.state.timer / (gameTime * 20))}
        />

        <Text style={styles.instructions}>
          {this.state.product ? this.state.product.articleType.typeName : ''} by {this.state.product ? this.state.product.brandName : ''}
        </Text>

        <Text style={styles.welcome}>
          {this.state.guess ? "Rs. " + Math.round(this.state.guess) : 'Make a guess:'}
        </Text>

        <SliderIOS
          style={{
            width: windowWidth,
          }}
          step={100}
          value={this.state.mid || this.state.guess}
          minimumValue={this.state.min}
          maximumValue={this.state.max}
          onValueChange={(value) => this.setState({mid: null, guess: value})}
          onSlidingComplete={this.checkGuess}
        />
        
        <View style={{
          flexDirection: 'row',
          alignSelf: 'stretch',
          justifyContent: 'space-between',
          marginHorizontal: 10,
        }}>
          <Text style={styles.instructions}>
            Rs. {this.state.min}
          </Text>
          <Text style={styles.instructions}>
            Rs. {this.state.max}
          </Text>
        </View>

        <Modal
          animated={true}
          visible={this.state.modalVisible}
          >
          {this.state.newGame ? <View style={[styles.container, {alignItems: 'stretch'}]}>
            <View style={[styles.innerContainer, {alignItems: 'center'}]}>
              <Image
                source={require('image!splash')}
              />
              
              <Button
                onPress={() => this.startGame()}
                style={styles.modalButton}
              >
                Start
              </Button>

            </View>
          </View> :
          <View style={[styles.container, {alignItems: 'stretch'}]}>
            <View style={[styles.innerContainer, {alignItems: 'center'}]}>

              <Text style={styles.welcome, {fontSize: 72}}>
                {this.state.score}
              </Text>

              <Text style={styles.welcome}>
                points
              </Text>

              <Image
                style={{marginVertical: 40}}
                source={require('image!game-over')}              
              />
              
              <Button
                onPress={() => this.startGame()}
                style={styles.modalButton}
              >
                Play Again
              </Button>

            </View>
          </View>}
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
      color: '#fff',
    };

    return (
      <TouchableHighlight
        onHideUnderlay={this._onUnhighlight}
        onPress={this.props.onPress}
        onShowUnderlay={this._onHighlight}
        style={[styles.button, this.props.style]}
        underlayColor="#002752"
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
    backgroundColor: '#FFF',
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
    // height: 44,
    width: 100,
    // alignSelf: 'center',
    // justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#007aff'
  },

  buttonText: {
    fontSize: 18,
    margin: 10,
    textAlign: 'center',
  },

  modalButton: {
    marginTop: 10,
  },
});

AppRegistry.registerComponent('Thrifty', () => Thrifty);
