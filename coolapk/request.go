package coolapk

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/url"
)

var userAgent = `Dalvik/2.1.0 (Linux; U; Android 11) +CoolMarket/10.5.3-2009271`

func request(path string, paramters map[string]string, ctx context.Context) (response []byte, err error) {
	params := url.Values{}
	for key, value := range paramters {
		params.Add(key, value)
	}
	client := &http.Client{}
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.coolapk.com"+path+"?"+params.Encode(), nil)
	if err != nil {
		return
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	req.Header.Set("X-Sdk-Locale", "zh-CN")
	req.Header.Set("X-Sdk-Int", "30")
	req.Header.Set("X-App-Id", "com.coolapk.market")
	req.Header.Set("X-App-Token", NewToken())
	req.Header.Set("X-App-Version", "10.5.3")
	req.Header.Set("X-App-Code", "2009271")
	req.Header.Set("X-Api-Version", "10")
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()
	response, err = ioutil.ReadAll(resp.Body)
	return
}
