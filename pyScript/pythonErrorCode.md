# Python Execute Code Table
## 回應正常

Code | Mean
:--- | :-----
200  | 請求執行成功

## 400 series 連線問題

Code | Mean
:--- | :--------------------------
401  | 無法連線至Portal Server
402  | HTTP Error
403  | 連線逾時。未能於時間內連線至 Portal Server 或 Portal Server 未能於時間內回應。


## 500 series Python執行錯誤

Code | Mean
:--- | :--------
501  | 未被預期之例外狀況
502  | 參數錯誤
503  | Parse error.(可能是學校系統資料格式變更)

## 1000 series 請求執行失敗

Code | Mean
:--- | :-----
1001 | 帳號密碼錯誤
