class Item {
  constructor(data, prev, next) {
    this.next = next;
    if (next)
      next.prev = this;
    this.prev = prev;
    if (prev)
      prev.next = this;
    this.data = data;
  }
}
class LinkedList {
  constructor() {
    this._length = 0;
  }
  get head() {
    return this._head && this._head.data;
  }
  get tail() {
    return this._tail && this._tail.data;
  }
  get current() {
    return this._current && this._current.data;
  }
  get length() {
    return this._length;
  }
  push(data) {
    this._tail = new Item(data, this._tail);
    if (this._length === 0) {
      this._head = this._tail;
      this._current = this._head;
      this._next = this._head;
    }
    this._length++;
  }
  pop() {
    var tail = this._tail;
    if (this._length === 0) {
      return;
    }
    this._length--;
    if (this._length === 0) {
      this._head = this._tail = this._current = this._next = void 0;
      return tail.data;
    }
    this._tail = tail.prev;
    this._tail.next = void 0;
    if (this._current === tail) {
      this._current = this._tail;
      this._next = void 0;
    }
    return tail.data;
  }
  shift() {
    var head = this._head;
    if (this._length === 0) {
      return;
    }
    this._length--;
    if (this._length === 0) {
      this._head = this._tail = this._current = this._next = void 0;
      return head.data;
    }
    this._head = this._head.next;
    if (this._current === head) {
      this._current = this._head;
      this._next = this._current.next;
    }
    return head.data;
  }
  unshift(data) {
    this._head = new Item(data, void 0, this._head);
    if (this._length === 0) {
      this._tail = this._head;
      this._next = this._head;
    }
    this._length++;
  }
  unshiftCurrent() {
    var current = this._current;
    if (current === this._head || this._length < 2) {
      return current && current.data;
    }
    if (current === this._tail) {
      this._tail = current.prev;
      this._tail.next = void 0;
      this._current = this._tail;
    } else {
      current.next.prev = current.prev;
      current.prev.next = current.next;
      this._current = current.prev;
    }
    this._next = this._current.next;
    current.next = this._head;
    current.prev = void 0;
    this._head.prev = current;
    this._head = current;
    return current.data;
  }
  removeCurrent() {
    var current = this._current;
    if (this._length === 0) {
      return;
    }
    this._length--;
    if (this._length === 0) {
      this._head = this._tail = this._current = this._next = void 0;
      return current.data;
    }
    if (current === this._tail) {
      this._tail = current.prev;
      this._tail.next = void 0;
      this._current = this._tail;
    } else if (current === this._head) {
      this._head = current.next;
      this._head.prev = void 0;
      this._current = this._head;
    } else {
      current.next.prev = current.prev;
      current.prev.next = current.next;
      this._current = current.prev;
    }
    this._next = this._current.next;
    return current.data;
  }
  resetCursor() {
    this._current = this._next = this._head;
    return this;
  }
  next() {
    var next = this._next;
    if (next !== void 0) {
      this._next = next.next;
      this._current = next;
      return next.data;
    }
  }
}
class FixedSizeLinkedList extends LinkedList {
  constructor(size, maintainHigh, maintainLow, maintainSum) {
    super();
    this.size = size;
    this.maintainHigh = maintainHigh;
    this.maintainLow = maintainLow;
    this.maintainSum = maintainSum;
    this.totalPushed = 0;
    this.periodHigh = 0;
    this.periodLow = Infinity;
    this.periodSum = 0;
    if (!size || typeof size !== "number") {
      throw "Size required and should be a number.";
    }
    this._push = this.push;
    this.push = function(data) {
      this.add(data);
      this.totalPushed++;
    };
  }
  add(data) {
    if (this.length === this.size) {
      this.lastShift = this.shift();
      this._push(data);
      if (this.maintainHigh) {
        if (this.lastShift == this.periodHigh)
          this.calculatePeriodHigh();
      }
      if (this.maintainLow) {
        if (this.lastShift == this.periodLow)
          this.calculatePeriodLow();
      }
      if (this.maintainSum) {
        this.periodSum = this.periodSum - this.lastShift;
      }
    } else {
      this._push(data);
    }
    if (this.maintainHigh) {
      if (this.periodHigh <= data)
        this.periodHigh = data;
    }
    if (this.maintainLow) {
      if (this.periodLow >= data)
        this.periodLow = data;
    }
    if (this.maintainSum) {
      this.periodSum = this.periodSum + data;
    }
  }
  *iterator() {
    this.resetCursor();
    while (this.next()) {
      yield this.current;
    }
  }
  calculatePeriodHigh() {
    this.resetCursor();
    if (this.next())
      this.periodHigh = this.current;
    while (this.next()) {
      if (this.periodHigh <= this.current) {
        this.periodHigh = this.current;
      }
    }
  }
  calculatePeriodLow() {
    this.resetCursor();
    if (this.next())
      this.periodLow = this.current;
    while (this.next()) {
      if (this.periodLow >= this.current) {
        this.periodLow = this.current;
      }
    }
  }
}
let config = {};
function getConfig(key) {
  return config[key];
}
function format(v) {
  let precision = getConfig("precision");
  if (precision) {
    return parseFloat(v.toPrecision(precision));
  }
  return v;
}
class Indicator {
  constructor(input) {
    this.format = input.format || format;
  }
  static reverseInputs(input) {
    if (input.reversedInput) {
      input.values ? input.values.reverse() : void 0;
      input.open ? input.open.reverse() : void 0;
      input.high ? input.high.reverse() : void 0;
      input.low ? input.low.reverse() : void 0;
      input.close ? input.close.reverse() : void 0;
      input.volume ? input.volume.reverse() : void 0;
      input.timestamp ? input.timestamp.reverse() : void 0;
    }
  }
  getResult() {
    return this.result;
  }
}
class SMA extends Indicator {
  constructor(input) {
    super(input);
    this.period = input.period;
    this.price = input.values;
    var genFn = (function* (period) {
      var list = new LinkedList();
      var sum = 0;
      var counter = 1;
      var current = yield;
      var result;
      list.push(0);
      while (true) {
        if (counter < period) {
          counter++;
          list.push(current);
          sum = sum + current;
        } else {
          sum = sum - list.shift() + current;
          result = sum / period;
          list.push(current);
        }
        current = yield result;
      }
    });
    this.generator = genFn(this.period);
    this.generator.next();
    this.result = [];
    this.price.forEach((tick) => {
      var result = this.generator.next(tick);
      if (result.value !== void 0) {
        this.result.push(this.format(result.value));
      }
    });
  }
  nextValue(price) {
    var result = this.generator.next(price).value;
    if (result != void 0)
      return this.format(result);
  }
}
SMA.calculate = sma;
function sma(input) {
  Indicator.reverseInputs(input);
  var result = new SMA(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class EMA extends Indicator {
  constructor(input) {
    super(input);
    var period = input.period;
    var priceArray = input.values;
    var exponent = 2 / (period + 1);
    var sma2;
    this.result = [];
    sma2 = new SMA({ period, values: [] });
    var genFn = (function* () {
      var tick = yield;
      var prevEma;
      while (true) {
        if (prevEma !== void 0 && tick !== void 0) {
          prevEma = (tick - prevEma) * exponent + prevEma;
          tick = yield prevEma;
        } else {
          tick = yield;
          prevEma = sma2.nextValue(tick);
          if (prevEma)
            tick = yield prevEma;
        }
      }
    });
    this.generator = genFn();
    this.generator.next();
    this.generator.next();
    priceArray.forEach((tick) => {
      var result = this.generator.next(tick);
      if (result.value != void 0) {
        this.result.push(this.format(result.value));
      }
    });
  }
  nextValue(price) {
    var result = this.generator.next(price).value;
    if (result != void 0)
      return this.format(result);
  }
}
EMA.calculate = ema;
function ema(input) {
  Indicator.reverseInputs(input);
  var result = new EMA(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class WEMA extends Indicator {
  constructor(input) {
    super(input);
    var period = input.period;
    var priceArray = input.values;
    var exponent = 1 / period;
    var sma2;
    this.result = [];
    sma2 = new SMA({ period, values: [] });
    var genFn = (function* () {
      var tick = yield;
      var prevEma;
      while (true) {
        if (prevEma !== void 0 && tick !== void 0) {
          prevEma = (tick - prevEma) * exponent + prevEma;
          tick = yield prevEma;
        } else {
          tick = yield;
          prevEma = sma2.nextValue(tick);
          if (prevEma !== void 0)
            tick = yield prevEma;
        }
      }
    });
    this.generator = genFn();
    this.generator.next();
    this.generator.next();
    priceArray.forEach((tick) => {
      var result = this.generator.next(tick);
      if (result.value != void 0) {
        this.result.push(this.format(result.value));
      }
    });
  }
  nextValue(price) {
    var result = this.generator.next(price).value;
    if (result != void 0)
      return this.format(result);
  }
}
WEMA.calculate = wema;
function wema(input) {
  Indicator.reverseInputs(input);
  var result = new WEMA(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class MACD extends Indicator {
  constructor(input) {
    super(input);
    var oscillatorMAtype = input.SimpleMAOscillator ? SMA : EMA;
    var signalMAtype = input.SimpleMASignal ? SMA : EMA;
    var fastMAProducer = new oscillatorMAtype({ period: input.fastPeriod, values: [], format: (v) => {
      return v;
    } });
    var slowMAProducer = new oscillatorMAtype({ period: input.slowPeriod, values: [], format: (v) => {
      return v;
    } });
    var signalMAProducer = new signalMAtype({ period: input.signalPeriod, values: [], format: (v) => {
      return v;
    } });
    var format2 = this.format;
    this.result = [];
    this.generator = (function* () {
      var index = 0;
      var tick;
      var MACD2, signal, histogram, fast, slow;
      while (true) {
        if (index < input.slowPeriod) {
          tick = yield;
          fast = fastMAProducer.nextValue(tick);
          slow = slowMAProducer.nextValue(tick);
          index++;
          continue;
        }
        if (fast && slow) {
          MACD2 = fast - slow;
          signal = signalMAProducer.nextValue(MACD2);
        }
        histogram = MACD2 - signal;
        tick = yield {
          //fast : fast,
          //slow : slow,
          MACD: format2(MACD2),
          signal: signal ? format2(signal) : void 0,
          histogram: isNaN(histogram) ? void 0 : format2(histogram)
        };
        fast = fastMAProducer.nextValue(tick);
        slow = slowMAProducer.nextValue(tick);
      }
    })();
    this.generator.next();
    input.values.forEach((tick) => {
      var result = this.generator.next(tick);
      if (result.value != void 0) {
        this.result.push(result.value);
      }
    });
  }
  nextValue(price) {
    var result = this.generator.next(price).value;
    return result;
  }
}
MACD.calculate = macd;
function macd(input) {
  Indicator.reverseInputs(input);
  var result = new MACD(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class AverageGain extends Indicator {
  constructor(input) {
    super(input);
    let values = input.values;
    let period = input.period;
    let format2 = this.format;
    this.generator = (function* (period2) {
      var currentValue = yield;
      var counter = 1;
      var gainSum = 0;
      var avgGain;
      var gain;
      var lastValue = currentValue;
      currentValue = yield;
      while (true) {
        gain = currentValue - lastValue;
        gain = gain > 0 ? gain : 0;
        if (gain > 0) {
          gainSum = gainSum + gain;
        }
        if (counter < period2) {
          counter++;
        } else if (avgGain === void 0) {
          avgGain = gainSum / period2;
        } else {
          avgGain = (avgGain * (period2 - 1) + gain) / period2;
        }
        lastValue = currentValue;
        avgGain = avgGain !== void 0 ? format2(avgGain) : void 0;
        currentValue = yield avgGain;
      }
    })(period);
    this.generator.next();
    this.result = [];
    values.forEach((tick) => {
      var result = this.generator.next(tick);
      if (result.value !== void 0) {
        this.result.push(result.value);
      }
    });
  }
  nextValue(price) {
    return this.generator.next(price).value;
  }
}
AverageGain.calculate = averagegain;
function averagegain(input) {
  Indicator.reverseInputs(input);
  var result = new AverageGain(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class AverageLoss extends Indicator {
  constructor(input) {
    super(input);
    let values = input.values;
    let period = input.period;
    let format2 = this.format;
    this.generator = (function* (period2) {
      var currentValue = yield;
      var counter = 1;
      var lossSum = 0;
      var avgLoss;
      var loss;
      var lastValue = currentValue;
      currentValue = yield;
      while (true) {
        loss = lastValue - currentValue;
        loss = loss > 0 ? loss : 0;
        if (loss > 0) {
          lossSum = lossSum + loss;
        }
        if (counter < period2) {
          counter++;
        } else if (avgLoss === void 0) {
          avgLoss = lossSum / period2;
        } else {
          avgLoss = (avgLoss * (period2 - 1) + loss) / period2;
        }
        lastValue = currentValue;
        avgLoss = avgLoss !== void 0 ? format2(avgLoss) : void 0;
        currentValue = yield avgLoss;
      }
    })(period);
    this.generator.next();
    this.result = [];
    values.forEach((tick) => {
      var result = this.generator.next(tick);
      if (result.value !== void 0) {
        this.result.push(result.value);
      }
    });
  }
  nextValue(price) {
    return this.generator.next(price).value;
  }
}
AverageLoss.calculate = averageloss;
function averageloss(input) {
  Indicator.reverseInputs(input);
  var result = new AverageLoss(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class RSI extends Indicator {
  constructor(input) {
    super(input);
    var period = input.period;
    var values = input.values;
    var GainProvider = new AverageGain({ period, values: [] });
    var LossProvider = new AverageLoss({ period, values: [] });
    this.generator = (function* (period2) {
      var current = yield;
      var lastAvgGain, lastAvgLoss, RS, currentRSI;
      while (true) {
        lastAvgGain = GainProvider.nextValue(current);
        lastAvgLoss = LossProvider.nextValue(current);
        if (lastAvgGain !== void 0 && lastAvgLoss !== void 0) {
          if (lastAvgLoss === 0) {
            currentRSI = 100;
          } else if (lastAvgGain === 0) {
            currentRSI = 0;
          } else {
            RS = lastAvgGain / lastAvgLoss;
            RS = isNaN(RS) ? 0 : RS;
            currentRSI = parseFloat((100 - 100 / (1 + RS)).toFixed(2));
          }
        }
        current = yield currentRSI;
      }
    })();
    this.generator.next();
    this.result = [];
    values.forEach((tick) => {
      var result = this.generator.next(tick);
      if (result.value !== void 0) {
        this.result.push(result.value);
      }
    });
  }
  nextValue(price) {
    return this.generator.next(price).value;
  }
}
RSI.calculate = rsi;
function rsi(input) {
  Indicator.reverseInputs(input);
  var result = new RSI(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class SD extends Indicator {
  constructor(input) {
    super(input);
    var period = input.period;
    var priceArray = input.values;
    var sma2 = new SMA({ period, values: [], format: (v) => {
      return v;
    } });
    this.result = [];
    this.generator = (function* () {
      var tick;
      var mean;
      var currentSet = new FixedSizeLinkedList(period);
      tick = yield;
      var sd2;
      while (true) {
        currentSet.push(tick);
        mean = sma2.nextValue(tick);
        if (mean) {
          let sum = 0;
          for (let x of currentSet.iterator()) {
            sum = sum + Math.pow(x - mean, 2);
          }
          sd2 = Math.sqrt(sum / period);
        }
        tick = yield sd2;
      }
    })();
    this.generator.next();
    priceArray.forEach((tick) => {
      var result = this.generator.next(tick);
      if (result.value != void 0) {
        this.result.push(this.format(result.value));
      }
    });
  }
  nextValue(price) {
    var nextResult = this.generator.next(price);
    if (nextResult.value != void 0)
      return this.format(nextResult.value);
  }
}
SD.calculate = sd;
function sd(input) {
  Indicator.reverseInputs(input);
  var result = new SD(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class BollingerBands extends Indicator {
  constructor(input) {
    super(input);
    var period = input.period;
    var priceArray = input.values;
    var stdDev = input.stdDev;
    var format2 = this.format;
    var sma2, sd2;
    this.result = [];
    sma2 = new SMA({ period, values: [], format: (v) => {
      return v;
    } });
    sd2 = new SD({ period, values: [], format: (v) => {
      return v;
    } });
    this.generator = (function* () {
      var result;
      var tick;
      var calcSMA;
      var calcsd;
      tick = yield;
      while (true) {
        calcSMA = sma2.nextValue(tick);
        calcsd = sd2.nextValue(tick);
        if (calcSMA) {
          let middle = format2(calcSMA);
          let upper = format2(calcSMA + calcsd * stdDev);
          let lower = format2(calcSMA - calcsd * stdDev);
          let pb = format2((tick - lower) / (upper - lower));
          result = {
            middle,
            upper,
            lower,
            pb
          };
        }
        tick = yield result;
      }
    })();
    this.generator.next();
    priceArray.forEach((tick) => {
      var result = this.generator.next(tick);
      if (result.value != void 0) {
        this.result.push(result.value);
      }
    });
  }
  nextValue(price) {
    return this.generator.next(price).value;
  }
}
BollingerBands.calculate = bollingerbands;
function bollingerbands(input) {
  Indicator.reverseInputs(input);
  var result = new BollingerBands(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class WilderSmoothing extends Indicator {
  constructor(input) {
    super(input);
    this.period = input.period;
    this.price = input.values;
    var genFn = (function* (period) {
      var sum = 0;
      var counter = 1;
      var current = yield;
      var result = 0;
      while (true) {
        if (counter < period) {
          counter++;
          sum = sum + current;
          result = void 0;
        } else if (counter == period) {
          counter++;
          sum = sum + current;
          result = sum;
        } else {
          result = result - result / period + current;
        }
        current = yield result;
      }
    });
    this.generator = genFn(this.period);
    this.generator.next();
    this.result = [];
    this.price.forEach((tick) => {
      var result = this.generator.next(tick);
      if (result.value != void 0) {
        this.result.push(this.format(result.value));
      }
    });
  }
  nextValue(price) {
    var result = this.generator.next(price).value;
    if (result != void 0)
      return this.format(result);
  }
}
WilderSmoothing.calculate = wildersmoothing;
function wildersmoothing(input) {
  Indicator.reverseInputs(input);
  var result = new WilderSmoothing(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class MDM extends Indicator {
  constructor(input) {
    super(input);
    var lows = input.low;
    var highs = input.high;
    var format2 = this.format;
    if (lows.length != highs.length) {
      throw "Inputs(low,high) not of equal size";
    }
    this.result = [];
    this.generator = (function* () {
      var minusDm;
      var current = yield;
      var last;
      while (true) {
        if (last) {
          let upMove = current.high - last.high;
          let downMove = last.low - current.low;
          minusDm = format2(downMove > upMove && downMove > 0 ? downMove : 0);
        }
        last = current;
        current = yield minusDm;
      }
    })();
    this.generator.next();
    lows.forEach((tick, index) => {
      var result = this.generator.next({
        high: highs[index],
        low: lows[index]
      });
      if (result.value !== void 0)
        this.result.push(result.value);
    });
  }
  static calculate(input) {
    Indicator.reverseInputs(input);
    var result = new MDM(input).result;
    if (input.reversedInput) {
      result.reverse();
    }
    Indicator.reverseInputs(input);
    return result;
  }
  nextValue(price) {
    return this.generator.next(price).value;
  }
}
class PDM extends Indicator {
  constructor(input) {
    super(input);
    var lows = input.low;
    var highs = input.high;
    var format2 = this.format;
    if (lows.length != highs.length) {
      throw "Inputs(low,high) not of equal size";
    }
    this.result = [];
    this.generator = (function* () {
      var plusDm;
      var current = yield;
      var last;
      while (true) {
        if (last) {
          let upMove = current.high - last.high;
          let downMove = last.low - current.low;
          plusDm = format2(upMove > downMove && upMove > 0 ? upMove : 0);
        }
        last = current;
        current = yield plusDm;
      }
    })();
    this.generator.next();
    lows.forEach((tick, index) => {
      var result = this.generator.next({
        high: highs[index],
        low: lows[index]
      });
      if (result.value !== void 0)
        this.result.push(result.value);
    });
  }
  static calculate(input) {
    Indicator.reverseInputs(input);
    var result = new PDM(input).result;
    if (input.reversedInput) {
      result.reverse();
    }
    Indicator.reverseInputs(input);
    return result;
  }
  nextValue(price) {
    return this.generator.next(price).value;
  }
}
class TrueRange extends Indicator {
  constructor(input) {
    super(input);
    var lows = input.low;
    var highs = input.high;
    var closes = input.close;
    var format2 = this.format;
    if (lows.length != highs.length) {
      throw "Inputs(low,high) not of equal size";
    }
    this.result = [];
    this.generator = (function* () {
      var current = yield;
      var previousClose, result;
      while (true) {
        if (previousClose === void 0) {
          previousClose = current.close;
          current = yield result;
        }
        result = Math.max(current.high - current.low, isNaN(Math.abs(current.high - previousClose)) ? 0 : Math.abs(current.high - previousClose), isNaN(Math.abs(current.low - previousClose)) ? 0 : Math.abs(current.low - previousClose));
        previousClose = current.close;
        if (result != void 0) {
          result = format2(result);
        }
        current = yield result;
      }
    })();
    this.generator.next();
    lows.forEach((tick, index) => {
      var result = this.generator.next({
        high: highs[index],
        low: lows[index],
        close: closes[index]
      });
      if (result.value != void 0) {
        this.result.push(result.value);
      }
    });
  }
  nextValue(price) {
    return this.generator.next(price).value;
  }
}
TrueRange.calculate = truerange;
function truerange(input) {
  Indicator.reverseInputs(input);
  var result = new TrueRange(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class ADX extends Indicator {
  constructor(input) {
    super(input);
    var lows = input.low;
    var highs = input.high;
    var closes = input.close;
    var period = input.period;
    var format2 = this.format;
    var plusDM = new PDM({
      high: [],
      low: []
    });
    var minusDM = new MDM({
      high: [],
      low: []
    });
    var emaPDM = new WilderSmoothing({ period, values: [], format: (v) => {
      return v;
    } });
    var emaMDM = new WilderSmoothing({ period, values: [], format: (v) => {
      return v;
    } });
    var emaTR = new WilderSmoothing({ period, values: [], format: (v) => {
      return v;
    } });
    var emaDX = new WEMA({ period, values: [], format: (v) => {
      return v;
    } });
    var tr = new TrueRange({
      low: [],
      high: [],
      close: []
    });
    if (!(lows.length === highs.length && highs.length === closes.length)) {
      throw "Inputs(low,high, close) not of equal size";
    }
    this.result = [];
    this.generator = (function* () {
      var tick = yield;
      var lastPDI, lastMDI, lastDX, smoothedDX;
      while (true) {
        let calcTr = tr.nextValue(tick);
        let calcPDM = plusDM.nextValue(tick);
        let calcMDM = minusDM.nextValue(tick);
        if (calcTr === void 0) {
          tick = yield;
          continue;
        }
        let lastATR = emaTR.nextValue(calcTr);
        let lastAPDM = emaPDM.nextValue(calcPDM);
        let lastAMDM = emaMDM.nextValue(calcMDM);
        if (lastATR != void 0 && lastAPDM != void 0 && lastAMDM != void 0) {
          lastPDI = lastAPDM * 100 / lastATR;
          lastMDI = lastAMDM * 100 / lastATR;
          let diDiff = Math.abs(lastPDI - lastMDI);
          let diSum = lastPDI + lastMDI;
          lastDX = diDiff / diSum * 100;
          smoothedDX = emaDX.nextValue(lastDX);
        }
        tick = yield { adx: smoothedDX, pdi: lastPDI, mdi: lastMDI };
      }
    })();
    this.generator.next();
    lows.forEach((tick, index) => {
      var result = this.generator.next({
        high: highs[index],
        low: lows[index],
        close: closes[index]
      });
      if (result.value != void 0 && result.value.adx != void 0) {
        this.result.push({ adx: format2(result.value.adx), pdi: format2(result.value.pdi), mdi: format2(result.value.mdi) });
      }
    });
  }
  nextValue(price) {
    let result = this.generator.next(price).value;
    if (result != void 0 && result.adx != void 0) {
      return { adx: this.format(result.adx), pdi: this.format(result.pdi), mdi: this.format(result.mdi) };
    }
  }
}
ADX.calculate = adx;
function adx(input) {
  Indicator.reverseInputs(input);
  var result = new ADX(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class ATR extends Indicator {
  constructor(input) {
    super(input);
    var lows = input.low;
    var highs = input.high;
    var closes = input.close;
    var period = input.period;
    var format2 = this.format;
    if (!(lows.length === highs.length && highs.length === closes.length)) {
      throw "Inputs(low,high, close) not of equal size";
    }
    var trueRange = new TrueRange({
      low: [],
      high: [],
      close: []
    });
    var wema2 = new WEMA({ period, values: [], format: (v) => {
      return v;
    } });
    this.result = [];
    this.generator = (function* () {
      var tick = yield;
      var avgTrueRange, trange;
      while (true) {
        trange = trueRange.nextValue({
          low: tick.low,
          high: tick.high,
          close: tick.close
        });
        if (trange === void 0) {
          avgTrueRange = void 0;
        } else {
          avgTrueRange = wema2.nextValue(trange);
        }
        tick = yield avgTrueRange;
      }
    })();
    this.generator.next();
    lows.forEach((tick, index) => {
      var result = this.generator.next({
        high: highs[index],
        low: lows[index],
        close: closes[index]
      });
      if (result.value !== void 0) {
        this.result.push(format2(result.value));
      }
    });
  }
  nextValue(price) {
    return this.generator.next(price).value;
  }
}
ATR.calculate = atr;
function atr(input) {
  Indicator.reverseInputs(input);
  var result = new ATR(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
class CandlestickFinder {
  constructor() {
  }
  approximateEqual(a, b) {
    let left = parseFloat(Math.abs(a - b).toPrecision(4)) * 1;
    let right = parseFloat((a * 1e-3).toPrecision(4)) * 1;
    return left <= right;
  }
  logic(data) {
    throw "this has to be implemented";
  }
  getAllPatternIndex(data) {
    if (data.close.length < this.requiredCount) {
      console.warn("Data count less than data required for the strategy ", this.name);
      return [];
    }
    if (data.reversedInput) {
      data.open.reverse();
      data.high.reverse();
      data.low.reverse();
      data.close.reverse();
    }
    let strategyFn = this.logic;
    return this._generateDataForCandleStick(data).map((current, index) => {
      return strategyFn.call(this, current) ? index : void 0;
    }).filter((hasIndex) => {
      return hasIndex;
    });
  }
  hasPattern(data) {
    if (data.close.length < this.requiredCount) {
      console.warn("Data count less than data required for the strategy ", this.name);
      return false;
    }
    if (data.reversedInput) {
      data.open.reverse();
      data.high.reverse();
      data.low.reverse();
      data.close.reverse();
    }
    let strategyFn = this.logic;
    return strategyFn.call(this, this._getLastDataForCandleStick(data));
  }
  _getLastDataForCandleStick(data) {
    let requiredCount = this.requiredCount;
    if (data.close.length === requiredCount) {
      return data;
    } else {
      let returnVal = {
        open: [],
        high: [],
        low: [],
        close: []
      };
      let i = 0;
      let index = data.close.length - requiredCount;
      while (i < requiredCount) {
        returnVal.open.push(data.open[index + i]);
        returnVal.high.push(data.high[index + i]);
        returnVal.low.push(data.low[index + i]);
        returnVal.close.push(data.close[index + i]);
        i++;
      }
      return returnVal;
    }
  }
  _generateDataForCandleStick(data) {
    let requiredCount = this.requiredCount;
    let generatedData = data.close.map(function(currentData, index) {
      let i = 0;
      let returnVal = {
        open: [],
        high: [],
        low: [],
        close: []
      };
      while (i < requiredCount) {
        returnVal.open.push(data.open[index + i]);
        returnVal.high.push(data.high[index + i]);
        returnVal.low.push(data.low[index + i]);
        returnVal.close.push(data.close[index + i]);
        i++;
      }
      return returnVal;
    }).filter((val, index) => {
      return index <= data.close.length - requiredCount;
    });
    return generatedData;
  }
}
class MorningStar extends CandlestickFinder {
  constructor() {
    super();
    this.name = "MorningStar";
    this.requiredCount = 3;
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    data.high[0];
    let firstdaysLow = data.low[0];
    data.open[1];
    let seconddaysClose = data.close[1];
    let seconddaysHigh = data.high[1];
    let seconddaysLow = data.low[1];
    let thirddaysOpen = data.open[2];
    let thirddaysClose = data.close[2];
    data.high[2];
    data.low[2];
    let firstdaysMidpoint = (firstdaysOpen + firstdaysClose) / 2;
    let isFirstBearish = firstdaysClose < firstdaysOpen;
    let isSmallBodyExists = firstdaysLow > seconddaysLow && firstdaysLow > seconddaysHigh;
    let isThirdBullish = thirddaysOpen < thirddaysClose;
    let gapExists = seconddaysHigh < firstdaysLow && seconddaysLow < firstdaysLow && thirddaysOpen > seconddaysHigh && seconddaysClose < thirddaysOpen;
    let doesCloseAboveFirstMidpoint = thirddaysClose > firstdaysMidpoint;
    return isFirstBearish && isSmallBodyExists && gapExists && isThirdBullish && doesCloseAboveFirstMidpoint;
  }
}
class BullishEngulfingPattern extends CandlestickFinder {
  constructor() {
    super();
    this.name = "BullishEngulfingPattern";
    this.requiredCount = 2;
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    data.high[0];
    data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    data.high[1];
    data.low[1];
    let isBullishEngulfing = firstdaysClose < firstdaysOpen && firstdaysOpen > seconddaysOpen && firstdaysClose > seconddaysOpen && firstdaysOpen < seconddaysClose;
    return isBullishEngulfing;
  }
}
class BullishHarami extends CandlestickFinder {
  constructor() {
    super();
    this.requiredCount = 2;
    this.name = "BullishHarami";
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    let firstdaysHigh = data.high[0];
    data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    let seconddaysHigh = data.high[1];
    let seconddaysLow = data.low[1];
    let isBullishHaramiPattern = firstdaysOpen > seconddaysOpen && firstdaysClose < seconddaysOpen && firstdaysClose < seconddaysClose && firstdaysOpen > seconddaysLow && firstdaysHigh > seconddaysHigh;
    return isBullishHaramiPattern;
  }
}
class BullishHaramiCross extends CandlestickFinder {
  constructor() {
    super();
    this.requiredCount = 2;
    this.name = "BullishHaramiCross";
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    let firstdaysHigh = data.high[0];
    data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    let seconddaysHigh = data.high[1];
    let seconddaysLow = data.low[1];
    let isBullishHaramiCrossPattern = firstdaysOpen > seconddaysOpen && firstdaysClose < seconddaysOpen && firstdaysClose < seconddaysClose && firstdaysOpen > seconddaysLow && firstdaysHigh > seconddaysHigh;
    let isSecondDayDoji = this.approximateEqual(seconddaysOpen, seconddaysClose);
    return isBullishHaramiCrossPattern && isSecondDayDoji;
  }
}
class Doji extends CandlestickFinder {
  constructor() {
    super();
    this.name = "Doji";
    this.requiredCount = 1;
  }
  logic(data) {
    let daysOpen = data.open[0];
    let daysClose = data.close[0];
    let daysHigh = data.high[0];
    let daysLow = data.low[0];
    let isOpenEqualsClose = this.approximateEqual(daysOpen, daysClose);
    let isHighEqualsOpen = isOpenEqualsClose && this.approximateEqual(daysOpen, daysHigh);
    let isLowEqualsClose = isOpenEqualsClose && this.approximateEqual(daysClose, daysLow);
    return isOpenEqualsClose && isHighEqualsOpen == isLowEqualsClose;
  }
}
class MorningDojiStar extends CandlestickFinder {
  constructor() {
    super();
    this.name = "MorningDojiStar";
    this.requiredCount = 3;
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    data.high[0];
    let firstdaysLow = data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    let seconddaysHigh = data.high[1];
    let seconddaysLow = data.low[1];
    let thirddaysOpen = data.open[2];
    let thirddaysClose = data.close[2];
    data.high[2];
    data.low[2];
    let firstdaysMidpoint = (firstdaysOpen + firstdaysClose) / 2;
    let isFirstBearish = firstdaysClose < firstdaysOpen;
    let dojiExists = new Doji().hasPattern({
      "open": [seconddaysOpen],
      "close": [seconddaysClose],
      "high": [seconddaysHigh],
      "low": [seconddaysLow]
    });
    let isThirdBullish = thirddaysOpen < thirddaysClose;
    let gapExists = seconddaysHigh < firstdaysLow && seconddaysLow < firstdaysLow && thirddaysOpen > seconddaysHigh && seconddaysClose < thirddaysOpen;
    let doesCloseAboveFirstMidpoint = thirddaysClose > firstdaysMidpoint;
    return isFirstBearish && dojiExists && isThirdBullish && gapExists && doesCloseAboveFirstMidpoint;
  }
}
class DownsideTasukiGap extends CandlestickFinder {
  constructor() {
    super();
    this.requiredCount = 3;
    this.name = "DownsideTasukiGap";
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    data.high[0];
    let firstdaysLow = data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    let seconddaysHigh = data.high[1];
    data.low[1];
    let thirddaysOpen = data.open[2];
    let thirddaysClose = data.close[2];
    data.high[2];
    data.low[2];
    let isFirstBearish = firstdaysClose < firstdaysOpen;
    let isSecondBearish = seconddaysClose < seconddaysOpen;
    let isThirdBullish = thirddaysClose > thirddaysOpen;
    let isFirstGapExists = seconddaysHigh < firstdaysLow;
    let isDownsideTasukiGap = seconddaysOpen > thirddaysOpen && seconddaysClose < thirddaysOpen && thirddaysClose > seconddaysOpen && thirddaysClose < firstdaysClose;
    return isFirstBearish && isSecondBearish && isThirdBullish && isFirstGapExists && isDownsideTasukiGap;
  }
}
class BullishMarubozu extends CandlestickFinder {
  constructor() {
    super();
    this.name = "BullishMarubozu";
    this.requiredCount = 1;
  }
  logic(data) {
    let daysOpen = data.open[0];
    let daysClose = data.close[0];
    let daysHigh = data.high[0];
    let daysLow = data.low[0];
    let isBullishMarbozu = this.approximateEqual(daysClose, daysHigh) && this.approximateEqual(daysLow, daysOpen) && daysOpen < daysClose && daysOpen < daysHigh;
    return isBullishMarbozu;
  }
}
class PiercingLine extends CandlestickFinder {
  constructor() {
    super();
    this.requiredCount = 2;
    this.name = "PiercingLine";
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    data.high[0];
    let firstdaysLow = data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    data.high[1];
    let seconddaysLow = data.low[1];
    let firstdaysMidpoint = (firstdaysOpen + firstdaysClose) / 2;
    let isDowntrend = seconddaysLow < firstdaysLow;
    let isFirstBearish = firstdaysClose < firstdaysOpen;
    let isSecondBullish = seconddaysClose > seconddaysOpen;
    let isPiercingLinePattern = firstdaysLow > seconddaysOpen && seconddaysClose > firstdaysMidpoint;
    return isDowntrend && isFirstBearish && isPiercingLinePattern && isSecondBullish;
  }
}
class ThreeWhiteSoldiers extends CandlestickFinder {
  constructor() {
    super();
    this.name = "ThreeWhiteSoldiers";
    this.requiredCount = 3;
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    let firstdaysHigh = data.high[0];
    data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    let seconddaysHigh = data.high[1];
    data.low[1];
    let thirddaysOpen = data.open[2];
    let thirddaysClose = data.close[2];
    let thirddaysHigh = data.high[2];
    data.low[2];
    let isUpTrend = seconddaysHigh > firstdaysHigh && thirddaysHigh > seconddaysHigh;
    let isAllBullish = firstdaysOpen < firstdaysClose && seconddaysOpen < seconddaysClose && thirddaysOpen < thirddaysClose;
    let doesOpenWithinPreviousBody = firstdaysClose > seconddaysOpen && seconddaysOpen < firstdaysHigh && seconddaysHigh > thirddaysOpen && thirddaysOpen < seconddaysClose;
    return isUpTrend && isAllBullish && doesOpenWithinPreviousBody;
  }
}
class BullishHammerStick extends CandlestickFinder {
  constructor() {
    super();
    this.name = "BullishHammerStick";
    this.requiredCount = 1;
  }
  logic(data) {
    let daysOpen = data.open[0];
    let daysClose = data.close[0];
    let daysHigh = data.high[0];
    let daysLow = data.low[0];
    let isBullishHammer = daysClose > daysOpen;
    isBullishHammer = isBullishHammer && this.approximateEqual(daysClose, daysHigh);
    isBullishHammer = isBullishHammer && daysClose - daysOpen <= 2 * (daysOpen - daysLow);
    return isBullishHammer;
  }
}
function bullishhammerstick(data) {
  return new BullishHammerStick().hasPattern(data);
}
class BullishInvertedHammerStick extends CandlestickFinder {
  constructor() {
    super();
    this.name = "BullishInvertedHammerStick";
    this.requiredCount = 1;
  }
  logic(data) {
    let daysOpen = data.open[0];
    let daysClose = data.close[0];
    let daysHigh = data.high[0];
    let daysLow = data.low[0];
    let isBullishInvertedHammer = daysClose > daysOpen;
    isBullishInvertedHammer = isBullishInvertedHammer && this.approximateEqual(daysOpen, daysLow);
    isBullishInvertedHammer = isBullishInvertedHammer && daysClose - daysOpen <= 2 * (daysHigh - daysClose);
    return isBullishInvertedHammer;
  }
}
function bullishinvertedhammerstick(data) {
  return new BullishInvertedHammerStick().hasPattern(data);
}
class BearishHammerStick extends CandlestickFinder {
  constructor() {
    super();
    this.name = "BearishHammerStick";
    this.requiredCount = 1;
  }
  logic(data) {
    let daysOpen = data.open[0];
    let daysClose = data.close[0];
    let daysHigh = data.high[0];
    let daysLow = data.low[0];
    let isBearishHammer = daysOpen > daysClose;
    isBearishHammer = isBearishHammer && this.approximateEqual(daysOpen, daysHigh);
    isBearishHammer = isBearishHammer && daysOpen - daysClose <= 2 * (daysClose - daysLow);
    return isBearishHammer;
  }
}
function bearishhammerstick(data) {
  return new BearishHammerStick().hasPattern(data);
}
class BearishInvertedHammerStick extends CandlestickFinder {
  constructor() {
    super();
    this.name = "BearishInvertedHammerStick";
    this.requiredCount = 1;
  }
  logic(data) {
    let daysOpen = data.open[0];
    let daysClose = data.close[0];
    let daysHigh = data.high[0];
    let daysLow = data.low[0];
    let isBearishInvertedHammer = daysOpen > daysClose;
    isBearishInvertedHammer = isBearishInvertedHammer && this.approximateEqual(daysClose, daysLow);
    isBearishInvertedHammer = isBearishInvertedHammer && daysOpen - daysClose <= 2 * (daysHigh - daysOpen);
    return isBearishInvertedHammer;
  }
}
function bearishinvertedhammerstick(data) {
  return new BearishInvertedHammerStick().hasPattern(data);
}
class HammerPattern extends CandlestickFinder {
  constructor() {
    super();
    this.name = "HammerPattern";
    this.requiredCount = 5;
  }
  logic(data) {
    let isPattern = this.downwardTrend(data);
    isPattern = isPattern && this.includesHammer(data);
    isPattern = isPattern && this.hasConfirmation(data);
    return isPattern;
  }
  downwardTrend(data, confirm = true) {
    let end = confirm ? 3 : 4;
    let gains = averagegain({ values: data.close.slice(0, end), period: end - 1 });
    let losses = averageloss({ values: data.close.slice(0, end), period: end - 1 });
    return losses > gains;
  }
  includesHammer(data, confirm = true) {
    let start = confirm ? 3 : 4;
    let end = confirm ? 4 : void 0;
    let possibleHammerData = {
      open: data.open.slice(start, end),
      close: data.close.slice(start, end),
      low: data.low.slice(start, end),
      high: data.high.slice(start, end)
    };
    let isPattern = bearishhammerstick(possibleHammerData);
    isPattern = isPattern || bearishinvertedhammerstick(possibleHammerData);
    isPattern = isPattern || bullishhammerstick(possibleHammerData);
    isPattern = isPattern || bullishinvertedhammerstick(possibleHammerData);
    return isPattern;
  }
  hasConfirmation(data) {
    let possibleHammer = {
      open: data.open[3],
      close: data.close[3],
      low: data.low[3],
      high: data.high[3]
    };
    let possibleConfirmation = {
      open: data.open[4],
      close: data.close[4],
      low: data.low[4],
      high: data.high[4]
    };
    let isPattern = possibleConfirmation.open < possibleConfirmation.close;
    return isPattern && possibleHammer.close < possibleConfirmation.close;
  }
}
class HammerPatternUnconfirmed extends HammerPattern {
  constructor() {
    super();
    this.name = "HammerPatternUnconfirmed";
  }
  logic(data) {
    let isPattern = this.downwardTrend(data, false);
    isPattern = isPattern && this.includesHammer(data, false);
    return isPattern;
  }
}
class TweezerBottom extends CandlestickFinder {
  constructor() {
    super();
    this.name = "TweezerBottom";
    this.requiredCount = 5;
  }
  logic(data) {
    return this.downwardTrend(data) && data.low[3] == data.low[4];
  }
  downwardTrend(data) {
    let gains = averagegain({ values: data.close.slice(0, 3), period: 2 });
    let losses = averageloss({ values: data.close.slice(0, 3), period: 2 });
    return losses > gains;
  }
}
let bullishPatterns = [
  new BullishEngulfingPattern(),
  new DownsideTasukiGap(),
  new BullishHarami(),
  new BullishHaramiCross(),
  new MorningDojiStar(),
  new MorningStar(),
  new BullishMarubozu(),
  new PiercingLine(),
  new ThreeWhiteSoldiers(),
  new BullishHammerStick(),
  new BullishInvertedHammerStick(),
  new HammerPattern(),
  new HammerPatternUnconfirmed(),
  new TweezerBottom()
];
class BullishPatterns extends CandlestickFinder {
  constructor() {
    super();
    this.name = "Bullish Candlesticks";
  }
  hasPattern(data) {
    return bullishPatterns.reduce(function(state, pattern) {
      let result = pattern.hasPattern(data);
      return state || result;
    }, false);
  }
}
function bullish(data) {
  return new BullishPatterns().hasPattern(data);
}
class BearishEngulfingPattern extends CandlestickFinder {
  constructor() {
    super();
    this.name = "BearishEngulfingPattern";
    this.requiredCount = 2;
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    data.high[0];
    data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    data.high[1];
    data.low[1];
    let isBearishEngulfing = firstdaysClose > firstdaysOpen && firstdaysOpen < seconddaysOpen && firstdaysClose < seconddaysOpen && firstdaysOpen > seconddaysClose;
    return isBearishEngulfing;
  }
}
class BearishHarami extends CandlestickFinder {
  constructor() {
    super();
    this.requiredCount = 2;
    this.name = "BearishHarami";
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    let firstdaysHigh = data.high[0];
    data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    let seconddaysHigh = data.high[1];
    let seconddaysLow = data.low[1];
    let isBearishHaramiPattern = firstdaysOpen < seconddaysOpen && firstdaysClose > seconddaysOpen && firstdaysClose > seconddaysClose && firstdaysOpen < seconddaysLow && firstdaysHigh > seconddaysHigh;
    return isBearishHaramiPattern;
  }
}
class BearishHaramiCross extends CandlestickFinder {
  constructor() {
    super();
    this.requiredCount = 2;
    this.name = "BearishHaramiCross";
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    let firstdaysHigh = data.high[0];
    data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    let seconddaysHigh = data.high[1];
    let seconddaysLow = data.low[1];
    let isBearishHaramiCrossPattern = firstdaysOpen < seconddaysOpen && firstdaysClose > seconddaysOpen && firstdaysClose > seconddaysClose && firstdaysOpen < seconddaysLow && firstdaysHigh > seconddaysHigh;
    let isSecondDayDoji = this.approximateEqual(seconddaysOpen, seconddaysClose);
    return isBearishHaramiCrossPattern && isSecondDayDoji;
  }
}
class EveningDojiStar extends CandlestickFinder {
  constructor() {
    super();
    this.name = "EveningDojiStar";
    this.requiredCount = 3;
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    let firstdaysHigh = data.high[0];
    data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    let seconddaysHigh = data.high[1];
    let seconddaysLow = data.low[1];
    let thirddaysOpen = data.open[2];
    let thirddaysClose = data.close[2];
    data.high[2];
    data.low[2];
    let firstdaysMidpoint = (firstdaysOpen + firstdaysClose) / 2;
    let isFirstBullish = firstdaysClose > firstdaysOpen;
    let dojiExists = new Doji().hasPattern({
      "open": [seconddaysOpen],
      "close": [seconddaysClose],
      "high": [seconddaysHigh],
      "low": [seconddaysLow]
    });
    let isThirdBearish = thirddaysOpen > thirddaysClose;
    let gapExists = seconddaysHigh > firstdaysHigh && seconddaysLow > firstdaysHigh && thirddaysOpen < seconddaysLow && seconddaysClose > thirddaysOpen;
    let doesCloseBelowFirstMidpoint = thirddaysClose < firstdaysMidpoint;
    return isFirstBullish && dojiExists && gapExists && isThirdBearish && doesCloseBelowFirstMidpoint;
  }
}
class EveningStar extends CandlestickFinder {
  constructor() {
    super();
    this.name = "EveningStar";
    this.requiredCount = 3;
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    let firstdaysHigh = data.high[0];
    data.low[0];
    data.open[1];
    let seconddaysClose = data.close[1];
    let seconddaysHigh = data.high[1];
    let seconddaysLow = data.low[1];
    let thirddaysOpen = data.open[2];
    let thirddaysClose = data.close[2];
    data.high[2];
    data.low[2];
    let firstdaysMidpoint = (firstdaysOpen + firstdaysClose) / 2;
    let isFirstBullish = firstdaysClose > firstdaysOpen;
    let isSmallBodyExists = firstdaysHigh < seconddaysLow && firstdaysHigh < seconddaysHigh;
    let isThirdBearish = thirddaysOpen > thirddaysClose;
    let gapExists = seconddaysHigh > firstdaysHigh && seconddaysLow > firstdaysHigh && thirddaysOpen < seconddaysLow && seconddaysClose > thirddaysOpen;
    let doesCloseBelowFirstMidpoint = thirddaysClose < firstdaysMidpoint;
    return isFirstBullish && isSmallBodyExists && gapExists && isThirdBearish && doesCloseBelowFirstMidpoint;
  }
}
class BearishMarubozu extends CandlestickFinder {
  constructor() {
    super();
    this.name = "BearishMarubozu";
    this.requiredCount = 1;
  }
  logic(data) {
    let daysOpen = data.open[0];
    let daysClose = data.close[0];
    let daysHigh = data.high[0];
    let daysLow = data.low[0];
    let isBearishMarbozu = this.approximateEqual(daysOpen, daysHigh) && this.approximateEqual(daysLow, daysClose) && daysOpen > daysClose && daysOpen > daysLow;
    return isBearishMarbozu;
  }
}
class ThreeBlackCrows extends CandlestickFinder {
  constructor() {
    super();
    this.name = "ThreeBlackCrows";
    this.requiredCount = 3;
  }
  logic(data) {
    let firstdaysOpen = data.open[0];
    let firstdaysClose = data.close[0];
    data.high[0];
    let firstdaysLow = data.low[0];
    let seconddaysOpen = data.open[1];
    let seconddaysClose = data.close[1];
    data.high[1];
    let seconddaysLow = data.low[1];
    let thirddaysOpen = data.open[2];
    let thirddaysClose = data.close[2];
    data.high[2];
    let thirddaysLow = data.low[2];
    let isDownTrend = firstdaysLow > seconddaysLow && seconddaysLow > thirddaysLow;
    let isAllBearish = firstdaysOpen > firstdaysClose && seconddaysOpen > seconddaysClose && thirddaysOpen > thirddaysClose;
    let doesOpenWithinPreviousBody = firstdaysOpen > seconddaysOpen && seconddaysOpen > firstdaysClose && seconddaysOpen > thirddaysOpen && thirddaysOpen > seconddaysClose;
    return isDownTrend && isAllBearish && doesOpenWithinPreviousBody;
  }
}
class HangingMan extends CandlestickFinder {
  constructor() {
    super();
    this.name = "HangingMan";
    this.requiredCount = 5;
  }
  logic(data) {
    let isPattern = this.upwardTrend(data);
    isPattern = isPattern && this.includesHammer(data);
    isPattern = isPattern && this.hasConfirmation(data);
    return isPattern;
  }
  upwardTrend(data, confirm = true) {
    let end = confirm ? 3 : 4;
    let gains = averagegain({ values: data.close.slice(0, end), period: end - 1 });
    let losses = averageloss({ values: data.close.slice(0, end), period: end - 1 });
    return gains > losses;
  }
  includesHammer(data, confirm = true) {
    let start = confirm ? 3 : 4;
    let end = confirm ? 4 : void 0;
    let possibleHammerData = {
      open: data.open.slice(start, end),
      close: data.close.slice(start, end),
      low: data.low.slice(start, end),
      high: data.high.slice(start, end)
    };
    let isPattern = bearishhammerstick(possibleHammerData);
    isPattern = isPattern || bullishhammerstick(possibleHammerData);
    return isPattern;
  }
  hasConfirmation(data) {
    let possibleHammer = {
      open: data.open[3],
      close: data.close[3],
      low: data.low[3],
      high: data.high[3]
    };
    let possibleConfirmation = {
      open: data.open[4],
      close: data.close[4],
      low: data.low[4],
      high: data.high[4]
    };
    let isPattern = possibleConfirmation.open > possibleConfirmation.close;
    return isPattern && possibleHammer.close > possibleConfirmation.close;
  }
}
class HangingManUnconfirmed extends HangingMan {
  constructor() {
    super();
    this.name = "HangingManUnconfirmed";
  }
  logic(data) {
    let isPattern = this.upwardTrend(data, false);
    isPattern = isPattern && this.includesHammer(data, false);
    return isPattern;
  }
}
class ShootingStar extends CandlestickFinder {
  constructor() {
    super();
    this.name = "ShootingStar";
    this.requiredCount = 5;
  }
  logic(data) {
    let isPattern = this.upwardTrend(data);
    isPattern = isPattern && this.includesHammer(data);
    isPattern = isPattern && this.hasConfirmation(data);
    return isPattern;
  }
  upwardTrend(data, confirm = true) {
    let end = confirm ? 3 : 4;
    let gains = averagegain({ values: data.close.slice(0, end), period: end - 1 });
    let losses = averageloss({ values: data.close.slice(0, end), period: end - 1 });
    return gains > losses;
  }
  includesHammer(data, confirm = true) {
    let start = confirm ? 3 : 4;
    let end = confirm ? 4 : void 0;
    let possibleHammerData = {
      open: data.open.slice(start, end),
      close: data.close.slice(start, end),
      low: data.low.slice(start, end),
      high: data.high.slice(start, end)
    };
    let isPattern = bearishinvertedhammerstick(possibleHammerData);
    isPattern = isPattern || bullishinvertedhammerstick(possibleHammerData);
    return isPattern;
  }
  hasConfirmation(data) {
    let possibleHammer = {
      open: data.open[3],
      close: data.close[3],
      low: data.low[3],
      high: data.high[3]
    };
    let possibleConfirmation = {
      open: data.open[4],
      close: data.close[4],
      low: data.low[4],
      high: data.high[4]
    };
    let isPattern = possibleConfirmation.open > possibleConfirmation.close;
    return isPattern && possibleHammer.close > possibleConfirmation.close;
  }
}
class ShootingStarUnconfirmed extends ShootingStar {
  constructor() {
    super();
    this.name = "ShootingStarUnconfirmed";
  }
  logic(data) {
    let isPattern = this.upwardTrend(data, false);
    isPattern = isPattern && this.includesHammer(data, false);
    return isPattern;
  }
}
class TweezerTop extends CandlestickFinder {
  constructor() {
    super();
    this.name = "TweezerTop";
    this.requiredCount = 5;
  }
  logic(data) {
    return this.upwardTrend(data) && data.high[3] == data.high[4];
  }
  upwardTrend(data) {
    let gains = averagegain({ values: data.close.slice(0, 3), period: 2 });
    let losses = averageloss({ values: data.close.slice(0, 3), period: 2 });
    return gains > losses;
  }
}
let bearishPatterns = [
  new BearishEngulfingPattern(),
  new BearishHarami(),
  new BearishHaramiCross(),
  new EveningDojiStar(),
  new EveningStar(),
  new BearishMarubozu(),
  new ThreeBlackCrows(),
  new BearishHammerStick(),
  new BearishInvertedHammerStick(),
  new HangingMan(),
  new HangingManUnconfirmed(),
  new ShootingStar(),
  new ShootingStarUnconfirmed(),
  new TweezerTop()
];
class BearishPatterns extends CandlestickFinder {
  constructor() {
    super();
    this.name = "Bearish Candlesticks";
  }
  hasPattern(data) {
    return bearishPatterns.reduce(function(state, pattern) {
      return state || pattern.hasPattern(data);
    }, false);
  }
}
function bearish(data) {
  return new BearishPatterns().hasPattern(data);
}
export {
  ADX as A,
  BollingerBands as B,
  EMA as E,
  MACD as M,
  RSI as R,
  SMA as S,
  ATR as a,
  bullish as b,
  bearish as c
};
