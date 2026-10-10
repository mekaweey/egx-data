Wild symbols (files): 131
Wild total file size: 460.6 MB
Wild raw data rows (incl. dup file): 561,156
Wild unique (symbol,date) rows: 557,193
Wild OHLCV-subset bytes (unique rows, 5 cols): 27.77 MB

Ours indicators/daily files: 269
Ours indicators total size: 736.8 MB
Ours indicator data rows: 995,763
Ours unique (symbol,date) rows: 995,763
Ours OHLCV-subset bytes (unique rows, 5 cols): 44.21 MB

Common symbols: 131
Overlapping (symbol,date) pairs: 555,355
Wild-only days (in Wild, missing in ours, common symbols): 1,838
Ours-only days (in ours, not in Wild, common symbols): 21,069

## Same symbols + same dates + same 5 columns (open,high,low,close,Volume):
- Wild overlap bytes: 27.68 MB over 555,355 rows
- Ours overlap bytes: 24.81 MB over 555,355 rows
- ratio ours/wild: 0.897

## Overall OHLCV-subset (all symbols, all dates, same 5 columns):
- Wild: 557,193 rows -> 27.77 MB
- Ours: 995,763 rows -> 44.21 MB
- ratio ours/wild: 1.592

## Why raw file sizes differ:
- Wild raw: 460.6 MB / 561,156 rows = 860.7 B/row (57 cols)
- Ours indicators raw: 736.8 MB / 995,763 rows = 775.8 B/row (81 cols)

## Wild-only days detail (top):
- CIRA: 1838 e.g. ['2001-07-31', '2001-08-27', '2002-09-17', '2004-04-28', '2005-08-16', '2006-12-18']
