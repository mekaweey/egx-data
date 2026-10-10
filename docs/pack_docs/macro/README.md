# macro/ — rates, inflation (public, mixed frequency)
- inflation_annual_fred.csv (FPCPITOTLZGEGY, 1960+), cpi_annual_fred.csv (DDOE01EGA086NWDB, 1960+), cpi_reo_fred.csv (EGYPCPIPCHPT, 2000+). Source: FRED/St.Louis Fed (World Bank/OECD origin).
- GAP: monthly CPI, CBE policy-rate history, T-bill auction yields — no machine-readable source reachable (CBE blocks scraping; bond coupon/maturity metadata absent). Do not interpolate annuals into monthly signals without disclosure.
