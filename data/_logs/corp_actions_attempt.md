## 1) HTTP endpoint candidates for corporate actions
FAIL URLError <urlopen error [Errno 11001] getaddrinfo failed> | https://symbol-info.tradingview.com/symbol-info/v1/symbol?symbol=EGX%3ACOMI

FAIL URLError <urlopen error [Errno 11001] getaddrinfo failed> | https://symbol-info.tradingview.com/symbols?symbol=EGX%3ACOMI

OK 200 len=94 | https://scanner.tradingview.com/symbol?symbol=EGX%3ACOMI&fields=dividends_yield,ex_dividen
   {"dividend_amount_recent":0.10728,"dividends_yield":4.760015866719556,"ex_dividend_date":null}

FAIL HTTPError HTTP Error 400: Bad Request | https://news-mediator.tradingview.com/public/view/v1/symbol?filter=symbol%3AEGX%3ACOMI&wit

## 2) WebSocket corporate action requests
   [critical_error] ['cs_ca2328456385', 'invalid_method', 'get_dividends']
   [critical_error] ['cs_ca2328456385', 'invalid_method', 'get_splits']
   WS EXC ConnectionClosedOK received 1000 (OK); then sent 1000 (OK)
   message types seen: {"?": 1, "critical_error": 2}

## 3) dividends page data for a paying stock
   categories: ['Balance sheet', 'Cash flow', 'Income statements', 'Statistics', 'Dividends', 'Earnings', 'Revenue']
   dividends: {"category": "Dividends", "data": {"currencyCode": " EGP", "dividendType": "Annual", "dividendAmountUpcoming": null, "dividendExDateUpcoming": null, "dividendAmountRecent": 6.0, "dividendsYield": 4.76001586671956}}
