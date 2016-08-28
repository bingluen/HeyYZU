# HeyYZU API 回應代碼意義

### 注意
API 回應分為 Http response status Code 以及 json 內的 statusCode 兩部分

## HTTP response status code

#### 200

回應正常

#### 400

錯誤由 Client side 造成，通常是參數錯誤

#### 500

錯誤由 Server side 造成，通常是例外沒處理好，若收到此類錯誤請回報後端。

## json 訊息內的 statusCode


#### 200 series
正常回應

#### 1100 series 客戶端造成的錯誤

+ 1100 Syntax Error
	JSON 解析失敗

+ 1101 參數錯誤
	參數缺少，未依照API規定傳遞最少所需要的參數

+ 1102 Token 不合法
	Token 可能已經過期，或不存在

+ 1103 登入失敗
	Portal 登入失敗，可能是帳號密碼錯誤或 portal server 驗證機制故障。

#### 1200 series 伺服器端造成的錯誤

+ 1200 未被Handle的錯誤，請回報給後端進行修復
+ 1201 資料庫查詢錯誤
	進行資料庫查詢時發生錯誤，請發生錯誤的API路徑，以及發送的參數給予後端進行測試

+ 1202 Token 驗證階段發生錯誤



#### 1300 series 校方Server端造成的錯誤

+ 1301 校方Server 連線錯誤
+ 1302 校方Server Http錯誤
+ 1303 校方Server Timeout


# Server 內部錯誤代碼 (2000 series & 3000 series)

### 注意

以下錯誤代碼只會在 server 內 script 出現
若在 API 回應的 json 內看見以下代碼，請回報給後端

## Course Model (2100 Series)

+ 2101 參數格式不正確
+ 2102 資料庫查詢錯誤

## User Model (2200 series)

+ 2201 參數不正確
+ 2202 資料誤查詢錯誤

## Library Model (2300 series)

## Python Model (3000 series)

### 共用

+ 3000 參數不正確
+ 3001 連線錯誤（無網路連線）
+ 3002 HTTP 錯誤
+ 3003 TimeOut
+ 3004 非預期錯誤（沒有被handle到的錯誤）


### Login (3100 series)

+ 3100 OK
+ 3101 帳號密碼驗證失敗

### Course (3200 series)

+ 3200 OK
+ 3201 參數不正確

#### 作業 (3210 series)

+ 3210 作業為空

#### 通知 (3220 series)

+ 3220 通知為空

#### 教材 (3230 series)

+ 3230 教材為空

#### 考試 (3240 series)

+ 3240 考試為空
+ 3241 考試查詢未開放

### Library (3300 series)

+ 3300 OK
+ 3301 參數不確正

#### Library Collection (3310 series)

+ 3310 OK
+ 3311 參數不正確
+ 3312 刪除失敗
+ 3313 新增失敗
+ 3314 刪除的項目不存在
+ 3315 查詢失敗

### UserData (3400 series)

+ 3400 OK
