var _ = require('underscore');
var ml = require('machine_learning');
var raw = require('./data.json');
var table = require('better-console').table;

// var config = {
//   pick: ['year'],
//   classify: [
//     ['2012'],
//     ['2013'],
//     ['2014'],
//     ['2015'],
//   ]
// };

var config = {
  pick: ['gender'],
  classify: [
    ['Men'],
    ['Women'],
  ]
};

// var config = {
//   pick: ['fabric'],
//   classify: [
//     ['Polyester'],
//     ['Cotton'],
//     ['Synthetic'],
//     ['Nylon'],
//   ]
// };

function getData() {
  return _.chain(raw)
    .values()
    .map(function (i) {
      return _.chain(i)
        .pick(config.pick)
        .values(i).value();
    })
    .value();
}

function getResults(key) {
  return _.chain(raw)
    .values()
    .pluck(key)
    .map(function (p) {
      if (p < 1000) {
        return 'cheap';
      } else if (p < 2000) {
        return 'affordable';
      } else if (p < 5000) {
        return 'pricey';
      } else {
        return 'exhorbitant';
      }
    })
    .value();
}

var dtExpected = new ml.DecisionTree({
  data: getData(),
  result: getResults('guess')
});
dtExpected.build();
// dtExpected.prune(1.0);

var dtActual = new ml.DecisionTree({
  data: getData(),
  result: getResults('actual')
});
dtActual.build();
// dtActual.prune(1.0);

function max(res) {
  var m = 0;
  var winner;

  _.each(res, function (v, k) {
    if (v > m) {
      m = v;
      winner = k;
    }
  });

  return winner;
}

function classify(inputs) {
  var expectedOutput = dtExpected.classify(inputs);
  var actualOutput = dtActual.classify(inputs);
  
  return {
    inputs: inputs,
    expected: max(expectedOutput),
    actual: max(actualOutput)
  };
}

var o = _.map(config.classify, function (c) {
  return classify(c);
});

table(o);
